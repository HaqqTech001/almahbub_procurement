import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Package, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon?: string;
  color?: string;
  product_count: number;
  is_active: boolean;
}

interface CategoryData {
  subcategories: Category[];
  parent: Category;
}

const SubcategoriesPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchCategoryData();
    }
  }, [slug]);

  useEffect(() => {
    filterSubcategories();
  }, [subcategories, searchTerm]);

  const fetchCategoryData = async () => {
    try {
      setIsLoading(true);
      
      // First, get the category by slug to get its ID
      const categoryResponse = await apiClient.getCategoryBySlug(slug!);
      const categoryData = categoryResponse.data?.category || categoryResponse.data;
      
      if (categoryData) {
        setParentCategory(categoryData);
        
        // Then get subcategories for this parent
        const subcategoriesResponse = await apiClient.getSubcategories(categoryData.id.toString());
        const subcategoriesData = subcategoriesResponse.data?.subcategories || [];
        setSubcategories(subcategoriesData);
      } else {
        // Fallback - use mock data
        const fallbackCategory = {
          id: 1,
          name: 'Category',
          description: 'Category description',
          slug: slug,
          is_active: true
        };
        setParentCategory(fallbackCategory);
        setSubcategories([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch category data:', error);
      
      // Set fallback data
      const fallbackCategory = {
        id: 1,
        name: 'Category',
        description: 'Category description',
        slug: slug,
        is_active: true
      };
      setParentCategory(fallbackCategory);
      setSubcategories([]);
      
      toast({
        title: 'Error',
        description: 'Failed to load subcategories. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterSubcategories = () => {
    let filtered = subcategories.filter(subcategory =>
      subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategory.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubcategories(filtered);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredSubcategories.map((subcategory) => (
        <Link key={subcategory.id} to={`/category/${subcategory.slug}`}>
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-[#0e7490]/20 overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative overflow-hidden">
                {subcategory.image ? (
                  <div className="w-full h-40 overflow-hidden">
                    <img 
                      src={apiClient.getFileUrl(subcategory.image)}
                      alt={subcategory.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-full h-40 bg-gradient-to-br from-${subcategory.color || '#0e7490'}/20 to-[#E3B505]/10 flex items-center justify-center"><span class="text-5xl">${subcategory.icon || '📁'}</span></div>`;
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    className="w-full h-40 flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
                    style={{ 
                      background: subcategory.color 
                        ? `linear-gradient(135deg, ${subcategory.color}40, ${subcategory.color}20)`
                        : 'linear-gradient(135deg, #0e749020, #E3B50510)'
                    }}
                  >
                    <span className="text-6xl">{subcategory.icon || '📁'}</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/90 text-gray-700 shadow-md">
                    {subcategory.product_count || 0} items
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e7490]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                  <span className="text-white font-medium flex items-center">
                    View {subcategory.name} <ChevronRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <CardTitle className="text-lg mb-2 group-hover:text-[#0e7490] transition-colors">
                {subcategory.name}
              </CardTitle>
              <p className="text-gray-600 text-sm line-clamp-2">
                {subcategory.description || 'No description available'}
              </p>
              <div className="mt-3 flex items-center text-[#0e7490]">
                <span className="text-sm font-medium">Browse Products</span>
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredSubcategories.map((subcategory) => (
        <Link key={subcategory.id} to={`/category/${subcategory.slug}`}>
          <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-l-[#0e7490]">
            <CardContent className="p-5">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                  {subcategory.image ? (
                    <div className="w-20 h-20 overflow-hidden rounded-lg">
                      <img 
                        src={apiClient.getFileUrl(subcategory.image)}
                        alt={subcategory.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-20 h-20 bg-gradient-to-br from-${subcategory.color || '#0e7490'}/20 to-[#E3B505]/10 rounded-lg flex items-center justify-center"><span class="text-3xl">${subcategory.icon || '📁'}</span></div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-20 h-20 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
                      style={{ 
                        background: subcategory.color 
                          ? `linear-gradient(135deg, ${subcategory.color}40, ${subcategory.color}20)`
                          : 'linear-gradient(135deg, #0e749020, #E3B50510)'
                      }}
                    >
                      <span className="text-3xl">{subcategory.icon || '📁'}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0e7490] transition-colors">
                    {subcategory.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {subcategory.description || 'No description available'}
                  </p>
                  <div className="flex items-center mt-2 space-x-3">
                    <Badge variant="secondary">
                      {subcategory.product_count || 0} products
                    </Badge>
                    <div className="flex items-center text-[#0e7490]">
                      <span className="text-sm font-medium">Browse</span>
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  const handleBrowseProducts = () => {
    // If no subcategories, browse products in the main category
    if (subcategories.length === 0 && parentCategory) {
      navigate(`/category/${parentCategory.slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg p-8 mb-8">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                  <div className="h-40 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section for Parent Category */}
      <div 
        className="relative bg-gradient-to-r from-[#0e7490] to-[#164e63] py-16"
        style={parentCategory?.color ? {
          background: `linear-gradient(135deg, ${parentCategory.color}, ${parentCategory.color}dd)`
        } : undefined}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(42,157,143,0.15)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(227,181,5,0.1)_0%,transparent_50%)]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <Link 
            to="/services" 
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Categories
          </Link>

          {/* Parent Category Info */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            {parentCategory?.image ? (
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 mb-4 md:mb-0">
                <img 
                  src={apiClient.getFileUrl(parentCategory.image)}
                  alt={parentCategory.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div 
                className="w-24 h-24 rounded-xl flex items-center justify-center text-5xl flex-shrink-0 mb-4 md:mb-0"
                style={{ 
                  background: parentCategory?.color 
                    ? `${parentCategory.color}66`
                    : 'rgba(255,255,255,0.2)'
                }}
              >
                {parentCategory?.icon || '📂'}
              </div>
            )}
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {parentCategory?.name || 'Category'}
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                {parentCategory?.description || 'Browse our collection of products and services'}
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <Badge className="bg-white/20 text-white">
                  {subcategories.length} Subcategories
                </Badge>
                {parentCategory?.is_active && (
                  <Badge className="bg-green-500/20 text-green-100">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {subcategories.length > 0 ? (
            <>
              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search subcategories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#0e7490] focus:ring-[#0e7490]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {filteredSubcategories.length} of {subcategories.length} subcategories
                    </span>
                    <div className="flex border rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-l-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subcategories Grid/List */}
              {filteredSubcategories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subcategories found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'No subcategories available'}
                  </p>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm('')}
                      variant="outline"
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {viewMode === 'grid' ? renderGridView() : renderListView()}
                </div>
              )}
            </>
          ) : (
            /* No Subcategories - Show direct products link */
            <Card className="bg-white shadow-sm border">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-[#0e7490]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-[#0e7490]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Browse Products in {parentCategory?.name}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  There are no subcategories under {parentCategory?.name}. 
                  Click below to browse all products directly in this category.
                </p>
                <Button 
                  onClick={handleBrowseProducts}
                  size="lg"
                  className="bg-[#0e7490] hover:bg-[#0e7490]/90"
                >
                  <Package className="h-5 w-5 mr-2" />
                  Browse All Products
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubcategoriesPage;
