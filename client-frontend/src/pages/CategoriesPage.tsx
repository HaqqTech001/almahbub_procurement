import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronRight, ArrowRight, Globe, Truck, Plane, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
}

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [animationStep, setAnimationStep] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortServices();
  }, [services, searchTerm, sortBy]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCategories();
      const categoriesData = response.data?.categories || response.data || [];
      
      if (categoriesData.length === 0) {
        setServices([
          { id: 1, name: 'iPhones & Gadgets', description: 'We source latest iPhones, smartphones, tablets, and electronic gadgets directly from manufacturers worldwide', slug: 'iphones-gadgets', image: '/images/categories/electronics.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
          { id: 2, name: 'Medical Equipments', description: 'We source medical equipment, hospital furniture, diagnostic tools, and healthcare devices from certified manufacturers', slug: 'medical-equipments', image: '/images/categories/medical.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
          { id: 3, name: 'Home & Garden Wares', description: 'We source home furniture, kitchen appliances, garden equipment, and household items for residential use', slug: 'home-garden-wares', image: '/images/categories/home.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
          { id: 4, name: 'Machineries', description: 'We source heavy machinery, industrial equipment, construction machinery, and specialized equipment', slug: 'machineries', image: '/images/categories/machinery.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
          { id: 5, name: 'General Procurement', description: 'General procurement requests for items not covered in specific categories. Submit any procurement need', slug: 'general-procurement', image: '/images/categories/general.svg', productCount: 999, isActive: true, createdAt: new Date().toISOString() }
        ]);
      } else {
        setServices(categoriesData);
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories. Please try again later.',
        variant: 'destructive',
      });
      setServices([
        { id: 1, name: 'iPhones & Gadgets', description: 'Latest smartphones, tablets, and electronic gadgets', slug: 'iphones-gadgets', image: '/images/categories/electronics.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
        { id: 2, name: 'Medical Equipments', description: 'Medical equipment and healthcare devices', slug: 'medical-equipments', image: '/images/categories/medical.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
        { id: 3, name: 'Home & Garden Wares', description: 'Home furniture and household items', slug: 'home-garden-wares', image: '/images/categories/home.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
        { id: 4, name: 'Machineries', description: 'Heavy machinery and industrial equipment', slug: 'machineries', image: '/images/categories/machinery.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
        { id: 5, name: 'General Procurement', description: 'Any procurement need', slug: 'general-procurement', image: '/images/categories/general.svg', productCount: 999, isActive: true, createdAt: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortServices = () => {
    let filtered = services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'products': return b.productCount - a.productCount;
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return 0;
      }
    });

    setFilteredServices(filtered);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredServices.map((service) => (
        <Link key={service.id} to={`/category/${service.slug}`}>
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-[#0e7490]/20 overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative overflow-hidden">
                {service.image ? (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={apiClient.getFileUrl(service.image)}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-48 bg-gradient-to-br from-[#0e7490]/10 to-[#E3B505]/10 flex items-center justify-center"><span class="text-6xl">📦</span></div>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[#0e7490]/10 to-[#E3B505]/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <div className="text-6xl">📦</div>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 text-gray-700 shadow-md">
                    {service.productCount} items
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e7490]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                  <span className="text-white font-medium flex items-center">
                    Explore Category <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-3 group-hover:text-[#0e7490] transition-colors">
                {service.name}
              </CardTitle>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                {service.description}
              </p>
              <div className="flex items-center text-[#0e7490] group-hover:text-[#155e75]">
                <span className="text-sm font-medium">Explore Category</span>
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
      {filteredServices.map((service) => (
        <Link key={service.id} to={`/category/${service.slug}`}>
          <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-l-[#0e7490]">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {service.image ? (
                    <div className="w-24 h-24 overflow-hidden rounded-lg">
                      <img 
                        src={apiClient.getFileUrl(service.image)}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-24 h-24 bg-gradient-to-br from-[#0e7490]/10 to-[#E3B505]/10 rounded-lg flex items-center justify-center"><span class="text-4xl">📦</span></div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-[#0e7490]/10 to-[#E3B505]/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0e7490] transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center mt-3 space-x-4">
                    <Badge variant="secondary">
                      {service.productCount} items
                    </Badge>
                    <div className="flex items-center text-[#0e7490] group-hover:text-[#0e7490]">
                      <span className="text-sm font-medium">Explore</span>
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

  const serviceHighlights = [
    { icon: <Globe className="h-6 w-6" />, text: 'Global Sourcing', color: 'bg-blue-500' },
    { icon: <Truck className="h-6 w-6" />, text: 'Sea Shipping', color: 'bg-green-500' },
    { icon: <Plane className="h-6 w-6" />, text: 'Air Freight', color: 'bg-amber-500' },
    { icon: <Headphones className="h-6 w-6" />, text: '24/7 Support', color: 'bg-rose-500' }
  ];

  const animatedMessages = [
    { text: 'We Import', subtitle: 'Quality Products Worldwide' },
    { text: 'We Export', subtitle: 'Nigerian Excellence' },
    { text: 'We Supply', subtitle: 'Reliable Partner' },
    { text: 'We Procure', subtitle: 'Your Success Matters' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                  <div className="h-48 bg-gray-200 rounded"></div>
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
      {/* Animated Hero Section */}
      <section className="relative h-[40vh] bg-gradient-to-br from-[#0e7490] via-[#0e7490]/90 to-[#164e63] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(42,157,143,0.15)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(227,181,5,0.1)_0%,transparent_50%)]"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Animated Text */}
          <div className="h-28 flex flex-col items-center justify-center mb-6">
            {animatedMessages.map((msg, index) => (
              <div
                key={index}
                className={`absolute transition-all duration-1000 ease-in-out transform ${
                  animationStep === index 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : animationStep > index 
                      ? 'opacity-0 -translate-y-10 scale-95' 
                      : 'opacity-0 translate-y-10 scale-95'
                }`}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
                  {msg.text}
                </h1>
                <p className="text-xl text-[#E3B505] font-normal">
                  {msg.subtitle}
                </p>
              </div>
            ))}
          </div>

          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Professional procurement and importation services from Nigeria to the world
          </p>

          {/* Service Highlights */}
          <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base">
            {serviceHighlights.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-5 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/70 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 tour-categories-header">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Categories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              iPhones & Gadgets, Medical Equipment, Machinery, Home & Garden Wares, and more. Importing from China, USA, Korea, Malaysia, Japan, and Thailand.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 tour-search-products">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#0e7490] focus:ring-[#0e7490]"
                />
              </div>

              {/* Sort and View Controls */}
              <div className="flex items-center space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="products">Product Count</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>

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

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-[#0e7490]">{filteredServices.length}</span> of <span className="font-semibold">{services.length}</span> services
            </p>
          </div>

          {/* Services Grid/List */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 tour-category-cards">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or browse all services
              </p>
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div>
              {viewMode === 'grid' ? renderGridView() : renderListView()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;