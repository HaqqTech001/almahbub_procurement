import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Globe, Users, Truck, Shield, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AboutPage: React.FC = () => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Global Reach',
      description: 'Operating in over 50 countries with a vast network of suppliers and partners worldwide.',
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Quality Assurance',
      description: 'Rigorous quality control processes ensuring every product meets international standards.',
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: 'Reliable Logistics',
      description: 'Efficient supply chain management with real-time tracking and on-time delivery guarantees.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Expert Team',
      description: 'Dedicated professionals with decades of experience in international trade and procurement.',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure Transactions',
      description: 'Advanced security measures protecting your business and financial information.',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: '24/7 Support',
      description: 'Round-the-clock customer service to assist you whenever you need help.',
    }
  ];

  const stats = [
    { number: '15+', label: 'Years of Experience' },
    { number: '500+', label: 'Satisfied Clients' },
    { number: '50+', label: 'Countries Served' },
    { number: '10,000+', label: 'Products Available' }
  ];

  const values = [
    {
      title: 'Integrity',
      description: 'We conduct business with honesty, transparency, and ethical standards.',
    },
    {
      title: 'Excellence',
      description: 'We strive for perfection in every transaction and service we provide.',
    },
    {
      title: 'Innovation',
      description: 'We continuously improve our processes and embrace new technologies.',
    },
    {
      title: 'Partnership',
      description: 'We build long-term relationships based on mutual trust and success.',
    }
  ];

  const animatedMessages = [
    { text: 'About Almahbub', subtitle: 'Your Trusted Procurement Partner' },
    { text: 'Our Story', subtitle: 'A Journey of Excellence' },
    { text: 'Our Vision', subtitle: 'Global Procurement Excellence' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Animated Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0e7490] via-[#0e7490]/90 to-[#164e63] text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(42,157,143,0.15)_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(227,181,5,0.1)_0%,transparent_50%)]"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/10 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${6 + Math.random() * 8}s`
              }}
            ></div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Animated Text */}
            <div className="h-32 flex flex-col items-center justify-center mb-6">
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
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
                    {msg.text}
                  </h1>
                  <p className="text-xl text-[#E3B505] font-normal">
                    {msg.subtitle}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
              Your trusted partner in international procurement and supply chain management since 2009
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button asChild className="bg-[#E3B505] hover:bg-[#d4a504] text-gray-900">
                <Link to="/contact">
                  Contact Us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#0e7490]" asChild>
                <Link to="/services">
                  Our Services
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-5 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/70 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-5 text-gray-600">
                <p className="text-lg leading-relaxed">
                  Founded in 2009, <strong className="text-[#0e7490]">Almahbub International</strong> has grown 
                  from a small trading company to a leading global procurement and service management platform. 
                  Our journey began with a simple vision: to bridge the gap between businesses worldwide 
                  and make international trade more accessible and efficient.
                </p>
                <p className="text-lg leading-relaxed">
                  Today, we serve clients across various industries, from small businesses 
                  to multinational corporations, providing comprehensive procurement solutions 
                  that drive growth and operational excellence.
                </p>
                <p className="text-lg leading-relaxed">
                  Our commitment to quality, reliability, and customer satisfaction has earned 
                  us the trust of hundreds of clients worldwide, making us a preferred partner 
                  for international trade and supply chain management.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#0e7490]/10 to-[#E3B505]/10 rounded-2xl transform rotate-3"></div>
              <img
                src="/about-us.jpg"
                alt="Almahbub International Office"
                className="relative rounded-xl shadow-xl w-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
                      <rect fill="#F0F4F8" width="600" height="400"/>
                      <text fill="#0e7490" font-family="Arial" font-size="24" font-weight="bold" x="50%" y="45%" text-anchor="middle">Almahbub International</text>
                      <text fill="#666" font-family="Arial" font-size="16" x="50%" y="55%" text-anchor="middle">Procurement Excellence Worldwide</text>
                    </svg>
                  `);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-[#F0F4F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-[#0e7490]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-[#0e7490]" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-lg leading-relaxed">
                  To empower businesses worldwide by providing seamless, reliable, and 
                  cost-effective procurement solutions that drive growth and operational 
                  excellence while maintaining the highest standards of quality and service.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-[#E3B505]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-[#E3B505]" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-lg leading-relaxed">
                  To be the world's most trusted platform for international procurement 
                  and supply chain management, setting industry standards for innovation, 
                  reliability, and customer satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-[#0e7490]/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#0e7490]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-[#0e7490]" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 bg-gradient-to-br from-[#0e7490] to-[#164e63] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-gray-200">
              Numbers that speak to our commitment and success
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#E3B505] mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-200 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-xl text-gray-600">
              What sets us apart in the global marketplace
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-[#0e7490]/20">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-[#0e7490]/10 rounded-full w-fit group-hover:bg-[#0e7490] transition-colors">
                    <div className="text-[#0e7490] group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-[#0e7490] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Partner with Us?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust Almahbub International 
            for their procurement needs. Let us help you grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-[#E3B505] hover:bg-[#d4a504] text-gray-900">
              <Link to="/register">
                Get Started
              </Link>
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#0e7490]" asChild>
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;