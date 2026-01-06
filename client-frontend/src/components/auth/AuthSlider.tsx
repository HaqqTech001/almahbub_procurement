import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Shield, Clock } from 'lucide-react';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
}

interface AuthSliderProps {
  slides: Slide[];
  variant?: 'login' | 'register' | 'forgot' | 'verify';
  currentSlide: number;
  onSlideChange: (index: number) => void;
}

const AuthSlider: React.FC<AuthSliderProps> = ({ slides, variant = 'login', currentSlide, onSlideChange }) => {
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      onSlideChange((currentSlide + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isAutoPlaying, slides.length, onSlideChange]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Gradient - Professional Teal Theme matching authentication pages */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F4C5C] via-[#0A3D47] to-[#082F38]">
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Gold Accent Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E3B505] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E3B505] opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Slides Container */}
      <div 
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div 
            key={slide.id} 
            className="w-full h-full flex-shrink-0 relative"
          >
            {/* Slide Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-8 lg:p-12 z-10">
              {/* Top Section - Logo and Back Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                    <Globe className="w-6 h-6 text-[#E3B505]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Almahbub International</h1>
                    <p className="text-white/60 text-xs">
                      Global Procurement Services
                    </p>
                  </div>
                </div>
                <Link 
                  to="/" 
                  className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/20 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to website
                </Link>
              </div>

              {/* Middle Section - Content */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="max-w-lg">
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-[#E3B505]">
                      {slide.subtitle}
                    </h3>
                  )}
                  <p className="text-lg text-white/80 leading-relaxed mb-8">
                    {slide.description}
                  </p>
                  
                  {/* Feature Points */}
                  <div className="space-y-4">
                    <div className="flex items-center text-white/70">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3">
                        <Shield className="w-4 h-4 text-[#E3B505]" />
                      </div>
                      <span>Secure and encrypted platform</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3">
                        <Clock className="w-4 h-4 text-[#E3B505]" />
                      </div>
                      <span>24/7 customer support</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3">
                        <Globe className="w-4 h-4 text-[#E3B505]" />
                      </div>
                      <span>Global shipping expertise</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Indicators */}
              <div className="flex justify-center items-center space-x-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onSlideChange(index)}
                    className={`transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-8 h-1 rounded-full bg-[#E3B505]' 
                        : 'w-2 h-1 rounded-full bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Image Overlay */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F4C5C]/80 via-transparent to-transparent"></div>
              {slide.image && (
                <img 
                  src={slide.image} 
                  alt="" 
                  className="w-full h-full object-cover opacity-20"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-20 right-12 flex space-x-2 z-20">
        <button
          onClick={() => onSlideChange(currentSlide > 0 ? currentSlide - 1 : slides.length - 1)}
          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onSlideChange((currentSlide + 1) % slides.length)}
          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
          aria-label="Next slide"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 left-12 z-20">
        <span className="text-white/60 text-sm font-medium">
          {currentSlide + 1} <span className="text-white/40">/ {slides.length}</span>
        </span>
      </div>
    </div>
  );
};

export default AuthSlider;
