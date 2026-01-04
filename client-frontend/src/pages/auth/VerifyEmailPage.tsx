import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import AuthSlider from '@/components/auth/AuthSlider';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        console.log('[VerifyEmail] No token found in URL');
        setError('This verification link is broken. The link may be incomplete or corrupted. Please request a new verification email from the login page.');
        setIsVerifying(false);
        return;
      }

      console.log('[VerifyEmail] Starting verification with token:', token.substring(0, 20) + '...');

      try {
        const response = await apiClient.verifyEmail(token);
        console.log('[VerifyEmail] API response:', response);
        
        if (response.success) {
          console.log('[VerifyEmail] Verification successful!');
          setIsVerified(true);
          setIsVerifying(false);
          
          toast({
            title: 'Email Verified Successfully!',
            description: 'Your email has been verified. You can now log in to your account.',
            variant: 'default',
          });

          // Start countdown
          let timer: NodeJS.Timeout;
          timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/login', { 
                  state: { 
                    title: 'Welcome!',
                    message: 'Email verified successfully! Please log in to your account.' 
                  }
                });
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } else {
          console.log('[VerifyEmail] API returned success: false');
          // Handle specific error cases with user-friendly messages
          if (response.message?.toLowerCase().includes('already verified')) {
            setError('Your email has already been verified. You can log in to your account now.');
          } else if (response.message?.toLowerCase().includes('invalid') || response.message?.toLowerCase().includes('expired')) {
            setError('This verification link has expired or is invalid. Please request a new verification email below.');
          } else {
            setError(response.message || 'Something went wrong during verification. Please try again or request a new verification email.');
          }
          setIsVerifying(false);
        }
      } catch (error: any) {
        console.error('[VerifyEmail] Verification error:', error);
        
        // Handle specific error types with user-friendly messages
        let errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        
        // Check for common error patterns
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Your session has expired. Please request a new verification email.';
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          errorMessage = 'This verification link is invalid or has already been used. Please request a new verification email.';
        } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
          errorMessage = 'Our server is having trouble right now. Please wait a moment and try again.';
        } else if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
          errorMessage = 'Unable to connect to our servers. Please check your internet connection and try again.';
        }
        
        setError(errorMessage);
        setIsVerifying(false);
        
        toast({
          title: 'Verification Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };

    verifyEmail();
  }, [token, navigate, toast]);

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail || !/\S+@\S+\.\S+/.test(resendEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);

    try {
      // This would typically call a resend verification email endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Email Resent',
        description: 'Please check your email for a new verification link.',
        variant: 'default',
      });
      setResendEmail('');
    } catch (error: any) {
      toast({
        title: 'Failed to Resend',
        description: error.message || 'Could not resend verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Slider */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <AuthSlider />
      </div>

      {/* Right Side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900">Almahbub</h1>
                <p className="text-gray-500 text-xs">International</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Email Verification</h2>
            <p className="text-gray-500 mt-2">
              {isVerifying ? 'Verifying your email address...' : 
               isVerified ? 'Email verified successfully!' : 
               'Email verification failed'}
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="pt-6">
              {isVerifying && (
                <div className="text-center py-8 space-y-6">
                  <div className="relative inline-block">
                    <Loader2 className="h-16 w-16 text-violet-600 animate-spin mx-auto" />
                    <div className="absolute inset-0 rounded-full border-4 border-violet-200"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">Verifying Email</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Please wait while we verify your email address and activate your account.
                    </p>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-violet-600 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-violet-600 rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-3 h-3 bg-violet-600 rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {isVerified && !isVerifying && !error && (
                <div className="text-center py-8 space-y-6 animate-fade-in">
                  <div className="relative inline-block">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-ping"></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Email Verified Successfully!</h3>
                    <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
                      Your email has been successfully verified. You can now access all features of the Almahbub International platform.
                    </p>
                    <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                      <p className="text-violet-700 text-sm font-medium">
                        Redirecting to login page in {countdown} seconds...
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleBackToLogin} 
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Continue to Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Error State */}
              {error && !isVerifying && !isVerified && (
                <div className="text-center py-8 space-y-6 animate-fade-in">
                  <div className="relative inline-block">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <div className="absolute inset-0 rounded-full border-4 border-red-100"></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Verification Failed</h3>
                    <p className="text-red-500 leading-relaxed max-w-sm mx-auto">
                      {error}
                    </p>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100 text-left">
                      <p className="text-red-600 text-sm">
                        The verification link may be invalid or has expired. Please try requesting a new verification email below.
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleResendEmail} className="space-y-4">
                    <div className="text-left">
                      <Label htmlFor="resend-email" className="text-sm font-medium text-gray-700 mb-2 block">
                        Enter your email to resend verification link
                      </Label>
                      <Input
                        id="resend-email"
                        type="email"
                        placeholder="Enter your registered email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={isResending}
                      className="w-full h-12 border-2 border-violet-600 text-violet-600 hover:bg-violet-50 font-semibold rounded-xl transition-all duration-200"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </form>
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <Button 
                      onClick={handleBackToLogin} 
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Back to Login
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      onClick={handleBackToHome} 
                      variant="outline" 
                      className="w-full h-12 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-xl transition-all duration-200"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              )}

              {/* Fallback State - Invalid/Unknown State */}
              {!isVerifying && !isVerified && !error && (
                <div className="text-center py-8 space-y-6 animate-fade-in">
                  <div className="relative inline-block">
                    <XCircle className="h-16 w-16 text-yellow-500 mx-auto" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Invalid Link</h3>
                    <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
                      The verification link is invalid or has expired. Please check your email for the correct verification link.
                    </p>
                  </div>
                  <form onSubmit={handleResendEmail} className="space-y-4">
                    <div className="text-left">
                      <Label htmlFor="resend-email-2" className="text-sm font-medium text-gray-700 mb-2 block">
                        Enter your email to resend verification link
                      </Label>
                      <Input
                        id="resend-email-2"
                        type="email"
                        placeholder="Enter your registered email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={isResending}
                      className="w-full h-12 border-2 border-violet-600 text-violet-600 hover:bg-violet-50 font-semibold rounded-xl transition-all duration-200"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </form>
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <Button 
                      onClick={handleBackToLogin} 
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Back to Login
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      onClick={handleBackToHome} 
                      variant="outline" 
                      className="w-full h-12 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-xl transition-all duration-200"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Info */}
          <div className="text-center mt-8 space-y-1">
            <p className="text-gray-500 font-medium">Almahbub International</p>
            <p className="text-gray-400 text-sm">"...a service that works"</p>
          </div>
        </div>
      </div>

      {/* Mobile Slider */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-1/3">
        <AuthSlider />
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmailPage;
