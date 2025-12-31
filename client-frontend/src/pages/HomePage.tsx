import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { 
  ArrowRight, 
  CheckCircle, 
  Globe, 
  Clock, 
  Shield, 
  Users, 
  TrendingUp,
  Star,
  Quote,
  Package,
  Ship,
  Plane,
  Truck,
  FileText,
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Play
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);


// const fetchCategories = async () => {
//     try {
//       setIsLoading(true);
//       const response = await apiClient.getCategories();
//       const categoriesData = response.data?.categories || response.data || [];
      
//       if (categoriesData.length === 0) {
//         setCategories([
//           { id: 1, name: 'iPhones & Gadgets', description: 'We source latest iPhones, smartphones, tablets, and electronic gadgets directly from manufacturers worldwide', slug: 'iphones-gadgets', image: '/images/categories/electronics.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
//           { id: 2, name: 'Medical Equipments', description: 'We source medical equipment, hospital furniture, diagnostic tools, and healthcare devices from certified manufacturers', slug: 'medical-equipments', image: '/images/categories/medical.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
//           { id: 3, name: 'Home & Garden Wares', description: 'We source home furniture, kitchen appliances, garden equipment, and household items for residential use', slug: 'home-garden-wares', image: '/images/categories/home.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
//           { id: 4, name: 'Machineries', description: 'We source heavy machinery, industrial equipment, construction machinery, and specialized equipment', slug: 'machineries', image: '/images/categories/machinery.svg', productCount: 5, isActive: true, createdAt: new Date().toISOString() },
//           { id: 5, name: 'General Procurement', description: 'General procurement requests for items not covered in specific categories. Submit any procurement need', slug: 'general-procurement', image: '/images/categories/general.svg', productCount: 999, isActive: true, createdAt: new Date().toISOString() }
//         ]);
//       } else {
//         setCategories(categoriesData);
//       }
//     } catch (error: any) {
//       console.error('Failed to fetch categories:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to fetch categories. Please try again later.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };
  

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      const [categoriesResponse, announcementsResponse] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getAnnouncements(),
      ]);
      console.log(categoriesResponse)

      if (categoriesResponse.success) {
        setCategories((categoriesResponse.data.categories || categoriesResponse.data || []).slice(0, 6));
      }

      if (announcementsResponse.success) {
        setAnnouncements(announcementsResponse.data.announcements.slice(0, 3));
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setCategories([
        { id: 1, name: 'iPhones & Gadgets', description: 'Latest iPhones, smartphones, tablets, and electronic gadgets from global manufacturers', icon: '📱' },
        { id: 2, name: 'Medical Equipment', description: 'Hospital equipment, diagnostic tools, and healthcare devices from certified suppliers', icon: '🏥' },
        { id: 3, name: 'Home & Garden', description: 'Furniture, kitchen appliances, garden equipment, and household items', icon: '🏠' },
        { id: 4, name: 'Industrial Machinery', description: 'Heavy machinery, construction equipment, and industrial tools', icon: '🏗️' },
        { id: 5, name: 'Automobiles', description: 'Vehicles, automotive parts, and transportation equipment', icon: '🚗' },
        { id: 6, name: 'General Procurement', description: 'Any procurement need not covered in specific categories', icon: '📦' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const services = [
    {
      icon: Globe,
      title: 'Global Sourcing',
      description: 'We source products from trusted manufacturers in China, USA, Korea, Malaysia, Japan, and Thailand.',
    },
    {
      icon: Ship,
      title: 'Sea Freight',
      description: 'Cost-effective ocean freight services for bulk shipments with professional customs clearance.',
    },
    {
      icon: Plane,
      title: 'Air Freight',
      description: 'Fast and reliable air freight for urgent shipments with door-to-door delivery options.',
    },
    {
      icon: Truck,
      title: 'Land Delivery',
      description: 'Nationwide delivery across Nigeria with our fleet of professional transportation vehicles.',
    },
    {
      icon: FileText,
      title: 'Customs Processing',
      description: 'Complete documentation and customs clearance services to ensure smooth border crossing.',
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'Quality inspection and verification services to ensure products meet your specifications.',
    },
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Submit Request',
      description: 'Tell us what you need to import and your specifications.',
    },
    {
      step: '02',
      title: 'We Source & Quote',
      description: 'We find the best suppliers and provide detailed pricing.',
    },
    {
      step: '03',
      title: 'Payment & Processing',
      description: 'Secure payment processing and order fulfillment.',
    },
    {
      step: '04',
      title: 'Delivery',
      description: 'We ship to Nigeria and deliver to your doorstep.',
    },
  ];

  const stats = [
    { value: '8+', label: 'Years Experience' },
    { value: '500+', label: 'Global Suppliers' },
    { value: '10,000+', label: 'Products Sourced' },
    { value: '5,000+', label: 'Happy Clients' },
  ];

  const trustIndicators = [
    'China', 'USA', 'Korea', 'Malaysia', 'Japan', 'Thailand'
  ];

  const testimonials = [
    {
      name: 'Adebayo Okafor',
      position: 'CEO, Medical Supply Co.',
      content: 'Almahbub International sourced our medical equipment from China with complete professionalism. Their quality assurance and timely delivery exceeded our expectations.',
      rating: 5,
    },
    {
      name: 'Fatima Ibrahim',
      position: 'Owner, Tech Retail Store',
      content: 'Importing iPhones and gadgets through Almahbub has transformed our business. Their sea freight services are cost-effective and their support team is exceptional.',
      rating: 5,
    },
    {
      name: 'Chidi Okwu',
      position: 'Director, Construction Ltd.',
      content: 'Quality machinery imports from Japan and Korea. Their end-to-end service from sourcing to delivery in Nigeria is simply outstanding. Highly recommended.',
      rating: 5,
    },
  ];

  const footerLinks = {
    services: ['Product Sourcing', 'Sea Freight', 'Air Freight', 'Land Delivery', 'Customs Clearance'],
    company: ['About Us', 'Our Team', 'Careers', 'Press', 'Partners'],
    support: ['Help Center', 'FAQs', 'Contact Us', 'Track Order', 'Returns'],
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {/* <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-[#0F4C5C] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-[#0F4C5C]">Almahbub</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-[#0F4C5C] font-medium transition-colors">Home</Link>
              <Link to="/services" className="text-gray-700 hover:text-[#0F4C5C] font-medium transition-colors">Services</Link>
              <Link to="/categories" className="text-gray-700 hover:text-[#0F4C5C] font-medium transition-colors">Categories</Link>
              <Link to="/about" className="text-gray-700 hover:text-[#0F4C5C] font-medium transition-colors">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-[#0F4C5C] font-medium transition-colors">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-[#0F4C5C]">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#0F4C5C] hover:bg-[#0a3d4a] text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav> */}

      {/* Hero Section */}
      <section className="relative bg-[#0F4C5C] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C5C] to-[#1A3A47]"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-[#E3B505]/20 rounded-full px-4 py-2 mb-6">
                <span className="text-[#E3B505] text-sm font-medium">Global Procurement Partner</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Seamless Global Procurement for Nigerian Business
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Your trusted partner for importing iPhones, medical equipment, machinery, and more 
                from China, USA, Korea, Malaysia, Japan, and Thailand to Nigeria.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-[#E3B505] hover:bg-[#d4a504] text-gray-900 w-full sm:w-auto">
                    Request a Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="border-white hover:bg-white/90 text-[#0F4C5C] w-full sm:w-auto">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-sm text-gray-300 mb-4">Trusted for imports from:</p>
                <div className="flex flex-wrap gap-4">
                  {trustIndicators.map((country, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
                      <Globe className="w-4 h-4 text-[#E3B505]" />
                      <span className="text-sm font-medium">{country}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#E3B505] mb-2">10+</div>
                      <div className="text-sm text-gray-300">Years Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#E3B505] mb-2">500+</div>
                      <div className="text-sm text-gray-300">Global Suppliers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#E3B505] mb-2">10K+</div>
                      <div className="text-sm text-gray-300">Products Sourced</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#E3B505] mb-2">5K+</div>
                      <div className="text-sm text-gray-300">Happy Clients</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#0F4C5C] mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              End-to-end procurement and logistics solutions tailored to your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="group p-8 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-[#0F4C5C]/30 transition-all duration-300">
                <div className="w-14 h-14 bg-[#0F4C5C] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services">
              <Button variant="outline" size="lg" className="border-[#0F4C5C] text-[#0F4C5C] hover:bg-[#0F4C5C] hover:text-white">
                View All Services
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, transparent process from request to delivery
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gray-200"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="relative text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-white border-2 border-[#0F4C5C] rounded-full mb-6 z-10">
                    <span className="text-2xl font-bold text-[#0F4C5C]">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Product Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of procurement categories
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link key={category.id} to={`/category/${category.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-gray-200 group overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-[#0F4C5C]/5 to-[#E3B505]/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img 
             src={apiClient.getFileUrl(category.image)}
             alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
           target.parentElement!.innerHTML = '<div class="w-24 h-24 bg-gradient-to-br from-[#0e7490]/10 to-[#E3B505]/10 rounded-lg flex items-center justify-center"><span class="text-4xl">📦</span></div>';}} />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg text-[#0F4C5C] group-hover:text-[#0a3d4a] transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <span className="text-[#0F4C5C] font-medium flex items-center">
                        Explore <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/categories">
              <Button variant="outline" size="lg" className="border-[#0F4C5C] text-[#0F4C5C] hover:bg-[#0F4C5C] hover:text-white">
                View All Categories
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Latest Updates
              </h2>
              <p className="text-xl text-gray-600">
                Stay informed about our latest news and announcements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {announcements.map((announcement) => (
                <Link key={announcement.id} to={`/announcement/${announcement.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-gray-200 group">
                    <CardHeader>
                      <div className="text-sm text-[#0F4C5C] font-medium mb-2">
                        {new Date(announcement.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <CardTitle className="text-lg text-gray-900 group-hover:text-[#0F4C5C] transition-colors line-clamp-2">
                        {announcement.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3">
                        {announcement.content}
                      </p>
                      <span className="text-[#0F4C5C] font-medium flex items-center mt-4">
                        Read More <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by businesses across Nigeria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#E3B505] text-[#E3B505]" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-[#0F4C5C] mb-4" />
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.position}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0F4C5C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Streamline Your Procurement?
          </h2>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            Let Almahbub International handle your global sourcing needs. 
            Get competitive quotes and reliable delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-[#E3B505] hover:bg-[#d4a504] text-gray-900 w-full sm:w-auto">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white  hover:bg-white/90 text-[#0F4C5C] w-full sm:w-auto">
                Contact Us Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info *
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-[#0F4C5C] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold">Almahbub</span>
              </div>
              <p className="text-gray-400 mb-6">
                Your trusted partner for global procurement and importation services from Nigeria to the world.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-400">
                  <MapPin className="h-5 w-5 text-[#E3B505]" />
                  <span className="text-sm">Graceland Bus Stop, University Road, Tanke, Ilorin, Kwara State</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Phone className="h-5 w-5 text-[#E3B505]" />
                  <span className="text-sm">08074454081, 07033546666</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Mail className="h-5 w-5 text-[#E3B505]" />
                  <span className="text-sm">almahbubinternational@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Services 
            <div>
              <h4 className="text-lg font-semibold mb-6">Services</h4>
              <ul className="space-y-3">
                {footerLinks.services.map((link, index) => (
                  <li key={index}>
                    <Link to="/services" className="text-gray-400 hover:text-[#E3B505] transition-colors text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company 
            <div>
              <h4 className="text-lg font-semibold mb-6">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link to="/about" className="text-gray-400 hover:text-[#E3B505] transition-colors text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support 
            <div>
              <h4 className="text-lg font-semibold mb-6">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <Link to="/contact" className="text-gray-400 hover:text-[#E3B005] transition-colors text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Almahbub International. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link to="/privacy" className="text-gray-400 hover:text-[#E3B505] text-sm transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-gray-400 hover:text-[#E3B505] text-sm transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default HomePage;
