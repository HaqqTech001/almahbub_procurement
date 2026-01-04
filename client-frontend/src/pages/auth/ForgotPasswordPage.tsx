import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Facebook, Instagram, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import AuthSlider from '@/components/auth/AuthSlider';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { toast } = useToast();

  const forgotSlides: Slide[] = [
    {
      id: 1,
      image: '',
      title: 'Reset Your Password',
      subtitle: 'Quick & Secure Recovery',
      description: 'Forgot your password? No worries! Enter your email address and we\'ll send you a secure link to reset your password and regain access to your account.'
    },
    {
      id: 2,
      image: '',
      title: 'Account Security',
      subtitle: 'Your Safety Matters',
      description: 'We take your account security seriously. Our password reset process is secure, encrypted, and designed to protect your account from unauthorized access.'
    },
    {
      id: 3,
      image: '',
      title: 'Need Help?',
      subtitle: '24/7 Support Available',
      description: 'If you\'re having trouble resetting your password or accessing your account, our support team is available around the clock to assist you.'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setEmailSent(true);
      toast({
        title: 'Email Sent',
        description: 'Password reset instructions have been sent to your email.',
      });
    } catch (error: any) {
      // Make error messages more user-friendly
      let errorMessage = 'Something went wrong while sending the reset email. Please try again.';
      let errorTitle = 'Unable to Send Email';
      
      // Check for specific error patterns and provide friendly messages
      if (error.message?.includes('Network') || error.message?.includes('fetch') || error.message?.includes('connection')) {
        errorMessage = 'Unable to connect to our servers. Please check your internet connection and try again.';
      } else if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('User not found')) {
        // For security, we don't reveal if email exists or not
        errorMessage = 'If an account with this email exists, you will receive a password reset link shortly. Please check your inbox and spam folder.';
        errorTitle = 'Check Your Email';
      } else if (error.message?.includes('500') || error.message?.includes('server')) {
        errorMessage = 'Our servers are experiencing issues. Please wait a moment and try again.';
      } else if (error.message?.includes('429') || error.message?.includes('too many')) {
        errorMessage = 'You have requested too many password resets. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('invalid') || error.message?.includes('format')) {
        errorMessage = 'Please enter a valid email address in the format: name@example.com';
        errorTitle = 'Invalid Email';
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
        {/* Main Card Container */}
        <div className="w-full max-w-6xl bg-white rounded-[20px] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Side - Auth Slider */}
          <div className="hidden lg:flex lg:w-[45%] relative h-[700px] lg:h-[800px] xl:h-[900px]">
            <AuthSlider 
              slides={forgotSlides} 
              variant="forgot"
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
            />
          </div>

          {/* Right Side - Email Sent Confirmation */}
          <div className="w-full lg:w-[55%] p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 bg-[#0F4C5C] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Almahbub International</h1>
              <p className="text-gray-500 text-sm mt-1">Password Reset</p>
            </div>

            <div className="max-w-md mx-auto w-full">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-500">
                  We've sent password reset instructions to <strong className="text-gray-900">{email}</strong>
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-gray-600 text-sm leading-relaxed">
                  If an account with this email exists, you'll receive an email with instructions to reset your password. Please check your inbox and spam folder.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-colors"
                >
                  Try Different Email
                </Button>
                
                <Link to="/login" className="block">
                  <Button className="w-full h-12 bg-[#0F4C5C] hover:bg-[#0a3d48] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Login
                  </Button>
                </Link>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center">
                <div className="flex justify-center space-x-6 mb-4">
                  <a href="https://www.facebook.com/almahbubinternational" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="Facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="https://www.tiktok.com/@almahbubinternational" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors" title="TikTok">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/almahbubinternational" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" title="Instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      {/* Main Card Container */}
      <div className="w-full max-w-6xl bg-white rounded-[20px] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side - Auth Slider */}
        <div className="hidden lg:flex lg:w-[45%] relative h-[700px] lg:h-[800px] xl:h-[900px]">
          <AuthSlider 
            slides={forgotSlides} 
            variant="forgot"
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
          />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[55%] p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-[#0F4C5C] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Almahbub International</h1>
            <p className="text-gray-500 text-sm mt-1">Password Recovery</p>
          </div>

          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
              <p className="text-gray-500">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/20 transition-all rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#0F4C5C]/5 border border-[#0F4C5C]/10 rounded-lg p-4">
                <p className="text-sm text-[#0F4C5C]">
                  <strong>Note:</strong> This will send a password reset link to your email address. The link will expire in 1 hour.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#0F4C5C] hover:bg-[#0a3d48] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="flex justify-center space-x-6 mb-4">
                <a href="https://www.facebook.com/almahbubinternational" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.tiktok.com/@almahbubinternational" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors" title="TikTok">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/almahbubinternational" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" title="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>

              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <Link to="/login" className="hover:text-gray-900 transition-colors">Sign In</Link>
                <span className="text-gray-300">|</span>
                <Link to="/register" className="hover:text-gray-900 transition-colors">Create Account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
