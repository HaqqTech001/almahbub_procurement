import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle, Facebook, Instagram, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import AuthSlider from '@/components/auth/AuthSlider';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
}

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { resetPassword } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const resetSlides: Slide[] = [
    {
      id: 1,
      image: '',
      title: 'Reset Your Password',
      subtitle: 'Secure & Easy Recovery',
      description: 'Enter your new password below to regain access to your account. Choose a strong password that you don\'t use elsewhere.'
    },
    {
      id: 2,
      image: '',
      title: 'Account Security',
      subtitle: 'Protect Your Account',
      description: 'A strong password helps protect your personal information and prevents unauthorized access to your account.'
    },
    {
      id: 3,
      image: '',
      title: 'Need Assistance?',
      subtitle: 'We\'re Here to Help',
      description: 'If you\'re having trouble resetting your password, our support team is available 24/7 to assist you.'
    }
  ];

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsInvalidToken(true);
    }
  }, [token]);

  const validatePassword = (pwd: string): { valid: boolean; message: string } => {
    if (pwd.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: '' };
  };

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setIsInvalidToken(true);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'Please make sure both passwords are identical.',
        variant: 'destructive',
      });
      return;
    }

    // Validate password strength
    const { valid, message } = validatePassword(password);
    if (!valid) {
      toast({
        title: 'Weak Password',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been changed. You can now log in with your new password.',
      });
    } catch (error: any) {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Something went wrong while resetting your password. The link may have expired.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInvalidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-[20px] shadow-2xl overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
              <p className="text-gray-500 mb-6">
                This password reset link is invalid or has expired. Please request a new password reset from the login page.
              </p>
              <Link to="/forgot-password">
                <Button className="w-full h-12 bg-[#0F4C5C] hover:bg-[#0a3d48] text-white font-semibold rounded-xl">
                  Request New Reset Link
                </Button>
              </Link>
              <Link to="/login" className="block mt-4">
                <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-[20px] shadow-2xl overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Complete</h2>
              <p className="text-gray-500 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link to="/login">
                <Button className="w-full h-12 bg-[#0F4C5C] hover:bg-[#0a3d48] text-white font-semibold rounded-xl">
                  <Lock className="h-5 w-5 mr-2" />
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      {/* Main Card Container */}
      <div className="w-full max-w-6xl bg-white rounded-[20px] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side - Auth Slider */}
        <div className="hidden lg:flex lg:w-[45%] relative h-[700px] lg:h-[800px] xl:h-[900px]">
          <AuthSlider 
            slides={resetSlides} 
            variant="reset"
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
          />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[55%] p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-[#2390ae] rounded-lg flex items-center justify-center">
              <img src="./almahbub.png" alt="" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Almahbub International</h1>
            <p className="text-gray-500 text-sm mt-1">Reset Password</p>
          </div>

          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-[#0F4C5C]/10 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-[#0F4C5C]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
              <p className="text-gray-500">
                Enter your new password below. Make sure it is strong and different from your previous password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/20 transition-all rounded-lg pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{passwordStrength.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Password must be at least 6 characters with uppercase, lowercase, and numbers.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-12 h-12 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/20 transition-all rounded-lg pr-12 ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : ''
                    }`}
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-500">Passwords match</p>
                )}
              </div>

              <div className="bg-[#0F4C5C]/5 border border-[#0F4C5C]/10 rounded-lg p-4">
                <p className="text-sm text-[#0F4C5C]">
                  <strong>Tip:</strong> Use a combination of uppercase letters, lowercase letters, numbers, and symbols for a stronger password.
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
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
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

export default ResetPasswordPage;
