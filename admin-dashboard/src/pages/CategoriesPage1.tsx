import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  Package,
  X,
  Save,
  Upload,
  Image,
  XCircle,
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parent_id?: number;
  icon?: string;
  color?: string;
  sort_order: number;
  status: 'active' | 'inactive';
  total_products: number;
  created_at: string;
  updated_at: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    icon: '',
    color: '#205562',
    sort_order: '0',
    status: 'active' as 'active' | 'inactive',
  });
  
  // Media upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, statusFilter]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCategories();
      
      if (response.success) {
        // Transform the data to match our interface
        const transformedCategories = response.data.categories.map((category: any, index: number) => ({
          ...category,
          total_products: Math.floor(Math.random() * 100), // Mock data
          order_index: index,
        }));
        setCategories(transformedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(category => category.status === statusFilter);
    }

    setFilteredCategories(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data request
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('slug', formData.slug);
      submitData.append('description', formData.description);
      if (formData.parent_id) {
        submitData.append('parent_id', formData.parent_id);
      }
      if (formData.icon) {
        submitData.append('icon', formData.icon);
      }
      submitData.append('color', formData.color);
      submitData.append('sort_order', formData.sort_order);
      submitData.append('status', formData.status);

      // Add image file if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      // For edit mode, add removeImage flag if there's no new image but we want to remove existing
      if (selectedCategory && !imagePreview && uploadedImage) {
        submitData.append('removeImage', 'true');
      }

      if (selectedCategory) {
        // Update existing category
        const response = await apiClient.updateCategory(selectedCategory.id, submitData);
        if (response.success) {
          setCategories(prev => prev.map(cat => 
            cat.id === selectedCategory.id ? { ...cat, ...response.data.category } : cat
          ));
          setShowEditModal(false);
        }
      } else {
        // Create new category
        const response = await apiClient.createCategory(submitData);
        if (response.success) {
          setCategories(prev => [...prev, {
            ...formData,
            id: response.data.category.id || Date.now(),
            image: response.data.category.image,
            order_index: categories.length,
            total_products: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
          setShowCreateModal(false);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect all products in this category.')) {
      try {
        const response = await apiClient.deleteCategory(categoryId);
        if (response.success) {
          setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: '',
      icon: '',
      color: '#205562',
      sort_order: '0',
      status: 'active',
    });
    setUploadedImage(null);
    setImagePreview(null);
    setImageFile(null);
    setSelectedCategory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file); // Store the file for submission
    setUploadedImage(null); // Clear uploaded URL since we have a new file
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description,
      parent_id: category.parent_id?.toString() || '',
      icon: category.icon || '',
      color: category.color || '#205562',
      sort_order: category.sort_order?.toString() || '0',
      status: category.status === 'active' ? 'active' : 'inactive',
    });
    
    // Load existing image if available
    if (category.image) {
      // Check if it's a full URL or a relative path
      if (category.image.startsWith('http')) {
        setUploadedImage(category.image);
        setImagePreview(category.image);
      } else {
        // Relative path - construct full URL
        const imageUrl = apiClient.getFileUrl(category.image);
        setUploadedImage(imageUrl);
        setImagePreview(imageUrl);
      }
    } else {
      setUploadedImage(null);
      setImagePreview(null);
    }
    
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const stats = {
    total: categories.length,
    active: categories.filter(c => c.status === 'active').length,
    inactive: categories.filter(c => c.status === 'inactive').length,
    totalProducts: categories.reduce((sum, cat) => sum + cat.total_products, 0),
  };

  const parentCategories = categories.filter(cat => !cat.parent_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Manage product categories and organization
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Categories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Inactive</CardTitle>
            <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Disabled categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-1 sm:flex-none min-w-[100px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex gap-1 ml-auto">
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {category.image && (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={apiClient.getFileUrl(category.image)} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: category.color || '#205562' }}
                    >
                      {category.icon ? category.icon : category.name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(category.status)}>
                          {category.status}
                        </Badge>
                        {category.parent_id && (
                          <Badge variant="outline">
                            Sub-category
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {category.total_products} products
                  </span>
                  <span className="text-muted-foreground">
                    Created {new Date(category.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {category.parent_id && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Parent: {categories.find(c => c.id === category.parent_id)?.name || 'Unknown'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No categories match your search criteria'
                    : 'Get started by creating your first category'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-md w-full h-full overflow-y-scroll">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name,
                      // Auto-generate slug from name if slug hasn't been manually edited
                      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/\s+/g, '-') 
                        ? name.toLowerCase().replace(/\s+/g, '-') 
                        : prev.slug
                    }));
                  }}
                  placeholder="Enter category name"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  URL Slug *
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="category-url-slug"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used in URLs: /categories/{formData.slug || 'your-slug'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">No parent (main category)</option>
                  {parentCategories
                    .filter(cat => !selectedCategory || cat.id !== selectedCategory.id)
                    .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Icon/Emoji
                  </label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., 📱 or FA"
                    maxLength={2}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Color
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#205562"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category Image
                </label>
                
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Category preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Image className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload category image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                    {isUploading && (
                      <p className="text-sm text-primary mt-2">
                        Uploading...
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : (selectedCategory ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;