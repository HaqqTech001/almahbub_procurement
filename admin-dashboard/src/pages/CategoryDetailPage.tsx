import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Upload, ShoppingCart, Phone, Globe, Clock, FileText, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface ProcurementExample {
  id: number;
  title: string;
  description: string;
  image: string;
  typicalSpecs: string[];
  importNotes: string;
}

const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [procurementExamples, setProcurementExamples] = useState<ProcurementExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchCategoryData();
    }
  }, [slug]);

  const fetchCategoryData = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch category details by slug first
      const categoryResponse = await apiClient.get(`/categories/slug/${slug}`);
      const categoryData = categoryResponse.data?.data || categoryResponse.data;
      setCategory(categoryData);

      // Set procurement examples for this category (mock data for demonstration)
      const examples = getProcurementExamples(categoryData?.name || slug);
      setProcurementExamples(examples);
      
    } catch (error: any) {
      console.error('Failed to fetch category data:', error);
      
      // Set fallback procurement data on error
      const fallbackCategory = {
        id: 1,
        name: 'iPhones & Gadgets',
        description: 'We source latest iPhones, smartphones, tablets, and electronic gadgets directly from manufacturers and authorized distributors worldwide.',
        image: '/images/categories/electronics.jpg',
        slug: 'iphones-gadgets'
      };
      
      setCategory(fallbackCategory);
      setProcurementExamples(getProcurementExamples('iPhones & Gadgets'));
      
      toast({
        title: 'Procurement Request System',
        description: 'This is a procurement service. We source items based on your requirements.',
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProcurementExamples = (categoryName: string): ProcurementExample[] => {
    const examples: { [key: string]: ProcurementExample[] } = {
      'iPhones & Gadgets': [
        {
          id: 1,
          title: 'Latest iPhone Models',
          description: 'iPhone 15 Pro, iPhone 15, iPhone 14 series - various storage capacities and colors',
          image: '/images/procurement/iphone-series.jpg',
          typicalSpecs: ['Storage: 128GB, 256GB, 512GB', 'Colors: Multiple options', 'Accessories included'],
          importNotes: 'Genuine Apple products with warranty'
        },
        {
          id: 2,
          title: 'Samsung Galaxy Series',
          description: 'Galaxy S24, S24 Ultra, Note series smartphones',
          image: '/images/procurement/samsung-galaxy.jpg',
          typicalSpecs: ['Various storage options', 'Unlocked versions available', 'Global variants'],
          importNotes: 'Factory unlocked models'
        },
        {
          id: 3,
          title: 'iPads & Tablets',
          description: 'iPad Pro, iPad Air, iPad Mini, Samsung Galaxy Tab series',
          image: '/images/procurement/tablets.jpg',
          typicalSpecs: ['WiFi & Cellular models', 'Various screen sizes', 'Stylus compatibility'],
          importNotes: 'Latest generation models'
        },
        {
          id: 4,
          title: 'Apple Watches',
          description: 'Apple Watch Series 9, Ultra, SE with various bands',
          image: '/images/procurement/apple-watches.jpg',
          typicalSpecs: ['GPS + Cellular', 'Sport, Nike, Hermès bands', 'All sizes available'],
          importNotes: 'Genuine Apple warranty'
        },
        {
          id: 5,
          title: 'Gaming Gadgets',
          description: 'PlayStation 5, Xbox Series X, Nintendo Switch, gaming accessories',
          image: '/images/procurement/gaming-gadgets.jpg',
          typicalSpecs: ['Latest console models', 'Accessories & games', 'Regional variants'],
          importNotes: 'Regional game compatibility'
        }
      ],
      'Medical Equipments': [
        {
          id: 1,
          title: 'Hospital Beds & Furniture',
          description: 'Electric hospital beds, examination tables, medical furniture',
          image: '/images/procurement/hospital-furniture.jpg',
          typicalSpecs: ['Electric adjustments', 'Various sizes', 'Hospital-grade materials'],
          importNotes: 'Medical certification required'
        },
        {
          id: 2,
          title: 'Diagnostic Equipment',
          description: 'ECG machines, ultrasound devices, X-ray equipment',
          image: '/images/procurement/diagnostic.jpg',
          typicalSpecs: ['Latest technology', 'Multiple brands', 'Training included'],
          importNotes: 'FDA/CE certified equipment'
        },
        {
          id: 3,
          title: 'Surgical Instruments',
          description: 'Surgical tools, instruments, sterile equipment',
          image: '/images/procurement/surgical.jpg',
          typicalSpecs: ['Stainless steel', 'Various sizes', 'Sterile packaging'],
          importNotes: 'Medical grade certification'
        },
        {
          id: 4,
          title: 'Patient Monitoring',
          description: 'Vital signs monitors, patient monitoring systems',
          image: '/images/procurement/monitoring.jpg',
          typicalSpecs: ['Multi-parameter', 'Wireless connectivity', 'Alarm systems'],
          importNotes: 'Medical device registration'
        },
        {
          id: 5,
          title: 'Laboratory Equipment',
          description: 'Microscopes, centrifuges, lab analyzers',
          image: '/images/procurement/lab-equipment.jpg',
          typicalSpecs: ['High precision', 'Various capacities', 'Easy maintenance'],
          importNotes: 'Laboratory certification'
        }
      ],
      'Home & Garden Wares': [
        {
          id: 1,
          title: 'Furniture & Furnishings',
          description: 'Home furniture, office furniture, outdoor furniture',
          image: '/images/procurement/furniture.jpg',
          typicalSpecs: ['Various materials', 'Custom sizes', 'Bulk quantities'],
          importNotes: 'Furniture assembly service'
        },
        {
          id: 2,
          title: 'Kitchen Appliances',
          description: 'Refrigerators, washing machines, kitchen equipment',
          image: '/images/procurement/appliances.jpg',
          typicalSpecs: ['Energy efficient', 'Various capacities', 'Multiple brands'],
          importNotes: 'Installation service available'
        },
        {
          id: 3,
          title: 'Garden & Outdoor',
          description: 'Garden tools, outdoor furniture, landscaping equipment',
          image: '/images/procurement/garden.jpg',
          typicalSpecs: ['Weather resistant', 'Various sizes', 'Eco-friendly options'],
          importNotes: 'Seasonal availability'
        },
        {
          id: 4,
          title: 'Home Decor & Lighting',
          description: 'Lighting fixtures, decorative items, home accessories',
          image: '/images/procurement/lighting.jpg',
          typicalSpecs: ['LED technology', 'Custom designs', 'Energy saving'],
          importNotes: 'Design consultation included'
        },
        {
          id: 5,
          title: 'Cleaning & Maintenance',
          description: 'Cleaning equipment, maintenance tools, supplies',
          image: '/images/procurement/cleaning.jpg',
          typicalSpecs: ['Industrial grade', 'Bulk supplies', 'Eco-friendly'],
          importNotes: 'Regular supply contracts'
        }
      ],
      'Machineries': [
        {
          id: 1,
          title: 'Heavy Machinery',
          description: 'Construction equipment, excavators, bulldozers, cranes',
          image: '/images/procurement/heavy-machinery.jpg',
          typicalSpecs: ['Various capacities', 'Fuel efficient', 'Operator training'],
          importNotes: 'Import permits required'
        },
        {
          id: 2,
          title: 'Industrial Equipment',
          description: 'Manufacturing machinery, production lines, industrial tools',
          image: '/images/procurement/industrial.jpg',
          typicalSpecs: ['High capacity', 'Automated systems', 'Maintenance included'],
          importNotes: 'Technical support provided'
        },
        {
          id: 3,
          title: 'Agricultural Machinery',
          description: 'Tractors, harvesters, farming equipment',
          image: '/images/procurement/agricultural.jpg',
          typicalSpecs: ['Multi-purpose', 'Fuel efficient', 'Various attachments'],
          importNotes: 'Agricultural certification'
        },
        {
          id: 4,
          title: 'Mining Equipment',
          description: 'Mining machinery, extraction equipment, safety gear',
          image: '/images/procurement/mining.jpg',
          typicalSpecs: ['Heavy duty', 'Safety compliant', 'Remote monitoring'],
          importNotes: 'Mining license required'
        },
        {
          id: 5,
          title: 'Transport Machinery',
          description: 'Trucks, buses, specialized transport vehicles',
          image: '/images/procurement/transport.jpg',
          typicalSpecs: ['Various capacities', 'Fuel efficient', 'Safety features'],
          importNotes: 'Transportation permits'
        }
      ]
    };

    return examples[categoryName] || examples['iPhones & Gadgets'];
  };

  const handleRequestProcurement = () => {
    navigate('/create-request', { 
      state: { 
        category: {
          id: category?.id,
          name: category?.name || slug,
          slug: category?.slug,
          image: category?.image,
          description: category?.description,
        }
      } 
    });
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4 mb-6 sm:mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
              <div className="space-y-4">
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-48 sm:h-64 bg-gray-200 rounded mt-4 sm:mt-6"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="h-32 sm:h-40 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center py-10 sm:py-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Category not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 sm:mb-8">
          <Link to="/categories" className="text-teal-600 hover:text-teal-800 flex items-center text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            Back to Categories
          </Link>
        </div>

        {/* Category Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{category.name}</h1>
              <p className="text-gray-600 text-base sm:text-lg mb-4">{category.description}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <Badge variant="secondary" className="text-xs sm:text-sm">{category.product_count || 0} Products</Badge>
                {category.is_active && (
                  <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">Active</Badge>
                )}
              </div>
            </div>
            <div className="lg:pl-0 lg:mt-0 mt-4">
              <img
                src={apiClient.getFileUrl(category.image) || '/placeholder-category.jpg'}
                alt={category.name}
                className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-category.jpg';
                }}
              />
            </div>
          </div>
        </div>

        {/* Procurement Process Info */}
        <Card className="mb-6 sm:mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Procurement Request System</h3>
                  <p className="text-gray-600 text-sm">We source {category.name?.toLowerCase()} based on your specific requirements</p>
                </div>
              </div>
              <Button 
                onClick={handleRequestProcurement}
                className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto text-sm sm:text-base"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Request Procurement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Procurement Process Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-xs sm:text-sm">Submit Request</h4>
              <p className="text-xs text-gray-600 hidden sm:block">Describe your requirements</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-xs sm:text-sm">Upload References</h4>
              <p className="text-xs text-gray-600 hidden sm:block">Images, specs, documents</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-xs sm:text-sm">Admin Review</h4>
              <p className="text-xs text-gray-600 hidden sm:block">We review & get back to you</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-xs sm:text-sm">Procurement</h4>
              <p className="text-xs text-gray-600 hidden sm:block">We source & deliver globally</p>
            </CardContent>
          </Card>
        </div>

        {/* Examples of Items We Procure */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Examples of {category.name} We Procure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {procurementExamples.map((example) => (
              <Card key={example.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={example.image || '/images/placeholder-procurement.jpg'}
                      alt={example.title}
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-procurement.jpg';
                      }}
                    />
                    <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs">
                      We Source This
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg mb-2 text-gray-900">
                    {example.title}
                  </CardTitle>
                  <p className="text-gray-600 text-sm mb-4">
                    {example.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <h5 className="text-xs sm:text-sm font-semibold text-gray-700">Typical Specifications:</h5>
                      <ul className="text-xs text-gray-600 space-y-1 mt-1">
                        {example.typicalSpecs.map((spec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                            {spec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-2">
                      <h5 className="text-xs sm:text-sm font-semibold text-gray-700">Import Notes:</h5>
                      <p className="text-xs text-gray-600">{example.importNotes}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full sm:flex-1 text-xs sm:text-sm"
                      onClick={() => handleRequestProcurement()}
                    >
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Request Quote
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        toast({
                          title: 'Upload Reference',
                          description: 'Upload images, specs, or documents for this item.',
                        });
                      }}
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <CardContent className="p-4 sm:p-6 md:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Ready to Procure {category.name}?
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
              Submit your procurement request with detailed specifications, quantities, and any reference materials. 
              Our team will review your request and get back to you with pricing and availability.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                onClick={handleRequestProcurement}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto text-sm sm:text-base"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Submit Procurement Request
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto text-sm sm:text-base"
                onClick={() => {
                  toast({
                    title: 'Contact Information',
                    description: 'Chat with our procurement team for immediate assistance.',
                  });
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Chat with Procurement Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoryDetailPage;