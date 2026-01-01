import React, { useEffect, useState, useMemo } from 'react';
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
  ChevronRight,
  ChevronDown,
  TreeDeciduous,
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parent_id?: number | null;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
}

interface HierarchicalCategory extends Category {
  children: HierarchicalCategory[];
  isExpanded: boolean;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<HierarchicalCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HierarchicalCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    icon: '',
    color: '#0F4C5C',
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
    buildHierarchicalCategories();
  }, [categories, searchTerm, statusFilter, expandedCategories]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCategories();
      
      if (response.success) {
        const transformedCategories = response.data.categories.map((category: any) => ({
          ...category,
          is_active: category.is_active ?? (category.status === 'active'),
          product_count: category.product_count || 0,
        }));
        setCategories(transformedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildHierarchicalCategories = () => {
    // Filter categories first
    let filtered = categories;

    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(category => 
        (statusFilter === 'active' && category.is_active) ||
        (statusFilter === 'inactive' && !category.is_active)
      );
    }

    // Build hierarchical structure
    const categoryMap = new Map<number, HierarchicalCategory>();
    const rootCategories: HierarchicalCategory[] = [];

    // First pass: create all hierarchical category objects
    filtered.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        isExpanded: expandedCategories.has(category.id),
      });
    });

    // Second pass: organize into tree structure
    filtered.forEach(category => {
      const hierarchicalCategory = categoryMap.get(category.id)!;
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(hierarchicalCategory);
        } else {
          // Parent not found (可能是被过滤掉了), treat as root
          rootCategories.push(hierarchicalCategory);
        }
      } else {
        rootCategories.push(hierarchicalCategory);
      }
    });

    // Sort each level by sort_order
    const sortCategories = (cats: HierarchicalCategory[]) => {
      cats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      cats.forEach(cat => sortCategories(cat.children));
    };

    sortCategories(rootCategories);
    setHierarchicalCategories(rootCategories);
  };

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleExpandAll = () => {
    if (expandedCategories.size === categories.length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(categories.map(c => c.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (selectedCategory && !imagePreview && uploadedImage) {
        submitData.append('removeImage', 'true');
      }

      if (selectedCategory) {
        const response = await apiClient.updateCategory(selectedCategory.id, submitData);
        if (response.success) {
          setCategories(prev => prev.map(cat => 
            cat.id === selectedCategory.id ? { ...cat, ...response.data.category } : cat
          ));
          setShowEditModal(false);
        }
      } else {
        const response = await apiClient.createCategory(submitData);
        if (response.success) {
          const newCategory = {
            ...formData,
            id: response.data.category.id || Date.now(),
            parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
            image: response.data.category.image,
            sort_order: parseInt(formData.sort_order) || 0,
            is_active: formData.status === 'active',
            product_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setCategories(prev => [...prev, newCategory as Category]);
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
      color: '#0F4C5C',
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

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);
    setUploadedImage(null);
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

  const openEditModal = (category: HierarchicalCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      parent_id: category.parent_id?.toString() || '',
      icon: category.icon || '',
      color: category.color || '#0F4C5C',
      sort_order: category.sort_order?.toString() || '0',
      status: category.is_active ? 'active' : 'inactive',
    });
    
    if (category.image) {
      if (category.image.startsWith('http')) {
        setUploadedImage(category.image);
        setImagePreview(category.image);
      } else {
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

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // Get all root categories (no parent) for the parent dropdown
  const rootCategories = useMemo(() => {
    return categories.filter(cat => !cat.parent_id);
  }, [categories]);

  const renderCategoryCard = (category: HierarchicalCategory, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const paddingLeft = depth * 24 + 16;

    return (
      <React.Fragment key={category.id}>
        <Card 
          className="hover:shadow-md transition-all duration-200 overflow-hidden"
          style={{ marginLeft: `${depth * 16}px`, maxWidth: `calc(100% - ${depth * 16}px)` }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8"
                    onClick={() => toggleExpand(category.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                {/* Category Icon */}
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                  style={{ backgroundColor: category.color || '#0F4C5C' }}
                >
                  {category.icon ? category.icon : category.name[0]}
                </div>

                {/* Category Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <CardTitle className="text-lg truncate">{category.name}</CardTitle>
                    {category.parent_id && (
                      <Badge variant="outline" className="text-xs">
                        Sub
                      </Badge>
                    )}
                    <Badge className={getStatusColor(category.is_active)}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                    <span>{category.product_count} products</span>
                    {category.parent_id && (
                      <>
                        <span>•</span>
                        <span className="truncate">
                          Parent: {categories.find(c => c.id === category.parent_id)?.name || 'Unknown'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(category)}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  title="Delete"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {category.image && (
            <CardContent className="pt-0 pb-3">
              <div className="h-32 overflow-hidden rounded-lg">
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
            </CardContent>
          )}
          
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {category.description || 'No description provided'}
            </p>
          </CardContent>
        </Card>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {category.children.map(child => renderCategoryCard(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  const stats = useMemo(() => {
    return {
      total: categories.length,
      active: categories.filter(c => c.is_active).length,
      inactive: categories.filter(c => !c.is_active).length,
      totalProducts: categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0),
      rootCategories: categories.filter(c => !c.parent_id).length,
    };
  }, [categories]);

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
            Manage product categories and subcategories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleExpandAll}>
            {expandedCategories.size > 0 ? 'Collapse All' : 'Expand All'}
          </Button>
          <Button onClick={openCreateModal} className="bg-[#0F4C5C] hover:bg-[#0a3d4a]">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Categories</CardTitle>
            <TreeDeciduous className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.rootCategories} main, {stats.total - stats.rootCategories} sub
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

      {/* Categories Tree */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hierarchicalCategories.length > 0 ? (
          hierarchicalCategories.map(category => renderCategoryCard(category))
        ) : (
          <Card className='flex '>
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
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
                  disabled={!!selectedCategory}
                >
                  <option value="">No parent (main category)</option>
                  {rootCategories
                    .filter(cat => !selectedCategory || cat.id !== selectedCategory.id)
                    .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCategory 
                    ? "Cannot change parent of existing category" 
                    : "Select a parent to create a subcategory, or leave empty for main category"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Icon/Emoji
                  </label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., 📱"
                    maxLength={4}
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
                      className="w-12 h-10 cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#0F4C5C"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
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
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                    placeholder="0"
                    min="0"
                  />
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
                <Button type="submit" disabled={isSubmitting} className="bg-[#0F4C5C] hover:bg-[#0a3d4a]">
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
