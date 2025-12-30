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
  Quote
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesResponse, announcementsResponse] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getAnnouncements(),
      ]);

      if (categoriesResponse.success) {
        setCategories((categoriesResponse.data.categories || categoriesResponse.data || []).slice(0, 6));
      }

      if (announcementsResponse.success) {
        setAnnouncements(announcementsResponse.data.announcements.slice(0, 3));
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setCategories([
        { id: 1, name: 'iPhones & Gadgets', description: 'We source latest iPhones, smartphones, tablets, and electronic gadgets directly from manufacturers worldwide' },
        { id: 2, name: 'Medical Equipments', description: 'We source medical equipment, hospital furniture, diagnostic tools, and healthcare devices from certified manufacturers' },
        { id: 3, name: 'Home & Garden Wares', description: 'We source home furniture, kitchen appliances, garden equipment, and household items for residential use' },
        { id: 4, name: 'Machineries', description: 'We source heavy machinery, industrial equipment, construction machinery, and specialized equipment' },
        { id: 5, name: 'And Many More (General Procurement Requests)', description: 'General procurement requests for items not covered in specific categories. Submit any procurement need' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Globe,
      title: 'Sea Shipping',
      description: 'Professional arrangement of sea transportation services for your international imports.',
    },
    {
      icon: Clock,
      title: 'Air Freight',
      description: 'Fast and reliable air freight services for urgent and time-sensitive shipments.',
    },
    {
      icon: Shield,
      title: 'Land Delivery',
      description: 'Nationwide delivery services across Nigeria with professional truck transportation.',
    },
    {
      icon: Users,
      title: '24/7 Support',
      description: 'Round-the-clock customer service support for all your procurement needs.',
    },
  ];

  const testimonials = [
    {
      name: 'Adebayo Okafor',
      company: 'Medical Supply Co.',
      content: 'Almahbub International sourced our medical equipment from China. Professional service, quality products, and reliable delivery.',
      rating: 5,
    },
    {
      name: 'Fatima Ibrahim',
      company: 'Tech Retail Store',
      content: 'They imported iPhones and gadgets for our store. Fast processing, competitive prices, and excellent customer service.',
      rating: 5,
    },
    {
      name: 'Chidi Okwu',
      company: 'Construction Ltd.',
      content: 'Quality machinery imports from Japan and Korea. Their sea shipping and land delivery services are outstanding.',
      rating: 5,
    },
  ];

  const animatedMessages = [
    { text: 'Welcome', subtitle: '' },
    { text: 'Almahbubnamendco', subtitle: '' },
    { text: 'Your Global Procurement Partner', subtitle: 'Importing Excellence Worldwide' },
    { text: 'Quality. Trust. Reliability.', subtitle: 'Your Success Is Our Priority' }
  ];

  return (
    <div className="min-h-screen">
      {/* Animated Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0F4C5C] via-[#0F4C5C]/90 to-[#1A3A47] text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(42,157,143,0.15)_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(227,181,5,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_0%,transparent_50%)]"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            {/* Animated Text Container */}
            <div className="h-40 flex flex-col items-center justify-center mb-8 tour-hero-title">
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
                  <h1 className={`${index === 1 ? 'text-5xl md:text-7xl font-bold' : 'text-4xl md:text-6xl font-bold'} mb-2`}>
                    {msg.text}
                  </h1>
                  {msg.subtitle && (
                    <p className="text-xl md:text-2xl text-[#E3B505] font-normal mt-2">
                      {msg.subtitle}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
              Professional procurement and importation services from Nigeria to the world. 
              We import iPhones, gadgets, medical equipment, machinery, and more from China, USA, Korea, Malaysia, Japan, and Thailand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#E3B505] hover:bg-[#d4a504] text-gray-900" asChild>
                <Link to="/register">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#0e7490]" asChild>
                <Link to="/services">
                  Browse Categories
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#F0F4F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0F4C5C] mb-2">500+</div>
              <div className="text-gray-600">Global Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0F4C5C] mb-2">10K+</div>
              <div className="text-gray-600">Products Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0F4C5C] mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0F4C5C] mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 tour-categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Our Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover a wide range of products and services across multiple categories
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-full h-32 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-[#0F4C5C]/20 overflow-hidden">
                  {category.image ? (
                    <div className="w-full h-32 overflow-hidden">
                      <img 
                        src={apiClient.getFileUrl(category.image)}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show placeholder instead
                          target.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-[#0F4C5C]/10 to-[#E3B505]/10 rounded-lg flex items-center justify-center"><span class="text-4xl">📦</span></div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-[#0F4C5C]/10 to-[#E3B505]/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <div className="text-4xl">📦</div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="group-hover:text-[#0e7490] transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription>
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full group-hover:bg-[#0F4C5C] group-hover:text-white transition-colors">
                      Explore Category
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">
                View All Categories
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#F0F4F8] tour-services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Almahbub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our comprehensive procurement platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0F4C5C] to-[#1A3A47] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Latest News
              </h2>
              <p className="text-xl text-gray-600">
                Stay updated with our latest announcements and developments
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((announcement) => (
                <Link key={announcement.id} to={`/announcement/${announcement.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#0F4C5C]">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#0F4C5C]">{announcement.title}</CardTitle>
                      <CardDescription>
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        {announcement.content.substring(0, 150)}...
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20 bg-[#F0F4F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Hear from businesses who trust Almahbub for their procurement needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#E3B505] text-[#E3B505]" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-[#0F4C5C] mb-2" />
                  <CardDescription className="text-gray-700 text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#0F4C5C] to-[#1A3A47] text-white tour-cta">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Import Your Products?
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            From iPhones to medical equipment, from China to Nigeria - we make international procurement simple and reliable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#E3B505] hover:bg-[#d4a504] text-gray-900" asChild>
              <Link to="/register">
                Start Your Journey
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#0e7490]" asChild>
              <Link to="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;