import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

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
  const [touchStart, setTouchStart] = useState(0);

  const getGradientClass = () => {
    switch (variant) {
      case 'login':
        return 'from-blue-600 via-blue-700 to-purple-800';
      case 'register':
        return 'from-purple-600 via-blue-700 to-indigo-800';
      case 'forgot':
        return 'from-indigo-600 via-blue-700 to-cyan-800';
      case 'verify':
        return 'from-emerald-600 via-cyan-700 to-cyan-800';
      default:
        return 'from-blue-600 via-blue-700 to-purple-800';
    }
  };

  const getAccentColor = () => {
    switch (variant) {
      case 'login':
        return 'blue';
      case 'register':
        return 'purple';
      case 'forgot':
        return 'indigo';
      case 'verify':
        return 'emerald';
      default:
        return 'blue';
    }
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      onSlideChange((currentSlide + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isAutoPlaying, slides.length, onSlideChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStart - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) {
        onSlideChange(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        onSlideChange(currentSlide - 1);
      }
    }
  };

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass()} transition-all duration-700`}>
        {/* Decorative Blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow animation-delay-4000"></div>
        </div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
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
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-20 h-20 bg-[#0F4C5C]/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <img src="./almahbub.png" alt="a.png" />
                 </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Almahbub International</h1>
                    <p className="text-white/60 text-xs">
                      {variant === 'login' && 'Procurement & Import Services'}
                      {variant === 'register' && 'Join Our Professional Network'}
                      {variant === 'forgot' && 'Password Recovery'}
                      {variant === 'verify' && 'Email Verification'}
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
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight animate-fade-in-up">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <h3 className={`text-xl lg:text-2xl font-semibold mb-4 animate-fade-in-up animation-delay-200 ${
                      variant === 'login' ? 'text-blue-200' :
                      variant === 'register' ? 'text-purple-200' :
                      variant === 'forgot' ? 'text-indigo-200' :
                      'text-emerald-200'
                    }`}>
                      {slide.subtitle}
                    </h3>
                  )}
                  <p className="text-lg text-white/80 leading-relaxed mb-6 animate-fade-in-up animation-delay-400">
                    {slide.description}
                  </p>
                  
                  {/* Feature Points */}
                  <div className="space-y-3 animate-fade-in-up animation-delay-600">
                    <div className="flex items-center text-white/70">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        variant === 'login' ? 'bg-blue-400' :
                        variant === 'register' ? 'bg-purple-400' :
                        variant === 'forgot' ? 'bg-indigo-400' :
                        'bg-emerald-400'
                      }`}></div>
                      <span>Secure and encrypted platform</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        variant === 'login' ? 'bg-purple-400' :
                        variant === 'register' ? 'bg-pink-400' :
                        variant === 'forgot' ? 'bg-cyan-400' :
                        'bg-cyan-400'
                      }`}></div>
                      <span>24/7 customer support</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        variant === 'login' ? 'bg-pink-400' :
                        variant === 'register' ? 'bg-blue-400' :
                        variant === 'forgot' ? 'bg-blue-400' :
                        'bg-cyan-400'
                      }`}></div>
                      <span>Real-time order tracking</span>
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
                        ? `w-8 h-1 rounded-full ${
                          variant === 'login' ? 'bg-white' :
                          variant === 'register' ? 'bg-white' :
                          variant === 'forgot' ? 'bg-white' :
                          'bg-white'
                        }` 
                        : 'w-2 h-1 rounded-full bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Image Overlay */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              {slide.image && (
                <img 
                  src={slide.image} 
                  alt="" 
                  className="w-full h-full object-cover opacity-30"
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

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthSlider;
