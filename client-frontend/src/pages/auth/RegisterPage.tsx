import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building, ArrowLeft, ArrowRight, CheckCircle, Facebook, Instagram, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    companyType: '',
   // address: '',
    //city: '',
   // state: '',
   // country: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const registerSlides: Slide[] = [
    {
      id: 1,
      image: '',
      title: 'Create Your Account',
      subtitle: 'Join Our Professional Network',
      description: 'Register now to join thousands of businesses who trust Almahbub International for their procurement and importation needs across the globe.'
    },
    {
      id: 2,
      image: '',
      title: 'Global Sourcing',
      subtitle: 'Access Worldwide Markets',
      description: 'Connect with trusted suppliers from over 50 countries. Get competitive quotes, track shipments, and manage all your procurement in one place.'
    },
    {
      id: 3,
      image: '',
      title: 'Secure & Fast',
      subtitle: 'Transactions You Can Trust',
      description: 'Experience secure payment processing, transparent pricing, and reliable delivery services backed by our satisfaction guarantee.'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      return formData.firstName && formData.lastName && formData.email && formData.phone;
    } else if (step === 2) {
      return formData.companyName && formData.companyType && formData.address && formData.city && formData.state && formData.country;
    } else if (step === 3) {
      return formData.password && formData.confirmPassword && formData.agreeToTerms && formData.password === formData.confirmPassword;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.companyType) newErrors.companyType = 'Please select a company type';
    if (!formData.address.trim()) newErrors.address = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State/Province is required';
    if (!formData.country) newErrors.country = 'Please select a country';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      // Show toast for first error
      const firstError = Object.values(newErrors)[0];
      toast({
        title: 'Please fix the errors',
        description: firstError,
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.companyName,
        companyType: formData.companyType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        password: formData.password,
      });

      toast({
        title: 'Account Created Successfully!',
        description: 'Please check your email to verify your account before logging in.',
        variant: 'default',
      });

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        companyType: '',
        address: '',
        city: '',
        state: '',
        country: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
      });

      navigate('/login');
    } catch (error: any) {
      // Handle backend validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const backendErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: { field?: string; message: string }) => {
          if (err.field) {
            backendErrors[err.field] = err.message;
          } else {
            backendErrors.general = err.message;
          }
        });
        setErrors(backendErrors);
        toast({
          title: 'Please fix the errors below',
          description: error.response.data.message || 'There were validation errors',
          variant: 'destructive',
        });
      } else if (error.response?.data?.message?.includes('already exists')) {
        setErrors({ email: 'An account with this email already exists. Please login or use a different email.' });
        toast({
          title: 'Registration Failed',
          description: 'An account with this email already exists',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Failed',
          description: error.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Company Details' },
    { number: 3, title: 'Security' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-gray-50">
      {/* Main Card Container */}
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side - Auth Slider */}
        <div className="hidden lg:flex lg:w-[45%] relative h-[700px] lg:h-[800px] xl:h-[900px]">
          <AuthSlider 
            slides={registerSlides} 
            variant="register"
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
          />
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-[55%] p-8 lg:p-12 xl:p-16 flex flex-col justify-center bg-white">
          {/* Mobile Logo - Visible only on small screens */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-[#0F4C5C] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Almahbub International</h1>
            <p className="text-gray-500 text-sm mt-1">Create your account</p>
          </div>

          {/* Form Header */}
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-[#0F4C5C] hover:text-[#0a3d4a] font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center items-center mb-8">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.number 
                        ? 'bg-[#E3B505] text-white' 
                        : currentStep === step.number 
                          ? 'bg-[#0F4C5C] text-white' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-[#E3B505]' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error Message */}
              {errors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                        }}
                        className={`h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.firstName ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.lastName) {
                            const { lastName, ...rest } = errors;
                            setErrors(rest);
                          }
                        }}
                        className={`h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.lastName ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.email) {
                            const { email, ...rest } = errors;
                            setErrors(rest);
                          }
                        }}
                        className={`pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.phone) {
                            const { phone, ...rest } = errors;
                            setErrors(rest);
                          }
                        }}
                        className={`pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.phone ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Company Information */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-gray-700 font-medium">Company Name</Label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="Enter your company name"
                        value={formData.companyName}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.companyName) setErrors({ ...errors, companyName: undefined });
                        }}
                        className={`pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.companyName ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.companyName && <p className="text-sm text-red-500">{errors.companyName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyType" className="text-gray-700 font-medium">Company Type</Label>
                    <Select
                      value={formData.companyType}
                      onValueChange={(value) => {
                        handleSelectChange('companyType', value);
                        if (errors.companyType) setErrors({ ...errors, companyType: undefined });
                      }}
                    >
                      <SelectTrigger className={`h-12 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 rounded-lg ${
                        errors.companyType ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Select company type" className="text-gray-400" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg">
                        <SelectItem value="individual" className="text-gray-900 hover:bg-gray-50">Individual</SelectItem>
                        <SelectItem value="small-business" className="text-gray-900 hover:bg-gray-50">Small Business</SelectItem>
                        <SelectItem value="corporation" className="text-gray-900 hover:bg-gray-50">Corporation</SelectItem>
                        <SelectItem value="non-profit" className="text-gray-900 hover:bg-gray-50">Non-Profit</SelectItem>
                        <SelectItem value="government" className="text-gray-900 hover:bg-gray-50">Government</SelectItem>
                        <SelectItem value="other" className="text-gray-900 hover:bg-gray-50">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.companyType && <p className="text-sm text-red-500">{errors.companyType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-gray-700 font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      Street Address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Enter street address"
                      value={formData.address}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.address) setErrors({ ...errors, address: undefined });
                      }}
                      className={`h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                        errors.address ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-700 font-medium">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.city) setErrors({ ...errors, city: undefined });
                        }}
                        className={`h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.city ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-gray-700 font-medium">State/Province</Label>
                      <Input
                        id="state"
                        name="state"
                        placeholder="State/Province"
                        value={formData.state}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.state) setErrors({ ...errors, state: undefined });
                        }}
                        className={`h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.state ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-gray-700 font-medium">Country</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => {
                        handleSelectChange('country', value);
                        if (errors.country) setErrors({ ...errors, country: undefined });
                      }}
                    >
                      <SelectTrigger className={`h-12 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 rounded-lg ${
                        errors.country ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Select country" className="text-gray-400" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg max-h-60">
                        <SelectItem value="NG" className="text-gray-900 hover:bg-gray-50">Nigeria</SelectItem>
                        <SelectItem value="US" className="text-gray-900 hover:bg-gray-50">United States</SelectItem>
                        <SelectItem value="GB" className="text-gray-900 hover:bg-gray-50">United Kingdom</SelectItem>
                        <SelectItem value="CA" className="text-gray-900 hover:bg-gray-50">Canada</SelectItem>
                        <SelectItem value="AU" className="text-gray-900 hover:bg-gray-50">Australia</SelectItem>
                        <SelectItem value="CN" className="text-gray-900 hover:bg-gray-50">China</SelectItem>
                        <SelectItem value="IN" className="text-gray-900 hover:bg-gray-50">India</SelectItem>
                        <SelectItem value="DE" className="text-gray-900 hover:bg-gray-50">Germany</SelectItem>
                        <SelectItem value="FR" className="text-gray-900 hover:bg-gray-50">France</SelectItem>
                        <SelectItem value="OTHER" className="text-gray-900 hover:bg-gray-50">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                  </div>
                </div>
              )}

              {/* Step 3: Security */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create password (min 6 characters)"
                        value={formData.password}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        className={`pl-12 pr-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0F4C5C] transition-colors" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        className={`pl-12 pr-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0F4C5C]/10 transition-all rounded-lg ${
                          errors.confirmPassword ? 'border-red-500' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, agreeToTerms: checked as boolean });
                        if (errors.agreeToTerms) setErrors({ ...errors, agreeToTerms: undefined });
                      }}
                      className={`mt-1 border-gray-300 data-[state=checked]:bg-[#0F4C5C] data-[state=checked]:border-[#0F4C5C] ${
                        errors.agreeToTerms ? 'border-red-500' : ''
                      }`}
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                      I agree to the{' '}
                      <Link to="/terms" className="text-[#0F4C5C] hover:text-[#0a3d4a] font-medium transition-colors">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-[#0F4C5C] hover:text-[#0a3d4a] font-medium transition-colors">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.agreeToTerms && <p className="text-sm text-red-500">{errors.agreeToTerms}</p>}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex space-x-4 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="flex-1 h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-colors"
                  >
                    Previous
                  </Button>
                )}
                
                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!validateStep(currentStep)}
                    className="flex-1 h-12 bg-[#0F4C5C] hover:bg-[#0a3d4a] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Next
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading || !validateStep(currentStep)}
                    className="flex-1 h-12 bg-[#0F4C5C] hover:bg-[#0a3d4a] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                )}
              </div>

              {/* Divider */}
              {/* <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div> */}

              {/* Social Buttons */}
              {/* <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple
                </Button>
              </div> */}
            </form>

            {/* Social Media Links */}
            <div className="mt-8 text-center">
              <div className="flex justify-center space-x-6 mb-4">
                <a 
                  href="https://www.facebook.com/almahbubinternational" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#0F4C5C] transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.tiktok.com/@almahbubinternational" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                  title="TikTok"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/almahbubimport"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#E3B505] transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
