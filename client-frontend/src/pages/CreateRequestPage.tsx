import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Minus, FileText, Package, MapPin, Clock, Upload, Image as ImageIcon, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';

interface CategoryInfo {
  id?: number;
  name: string;
  slug?: string;
  image?: string;
  description?: string;
}

interface RequestItem {
  id: number;
  name: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deliveryLocation: string;
  requiredDate: string;
  specifications: string;
}

interface DeliveryAddressInfo {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface RequesterInfo {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
}

interface BudgetInfo {
  currency: string;
  amount: number | null;
}

const CreateRequestPage: React.FC = () => {
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [requesterInfo, setRequesterInfo] = useState<RequesterInfo>({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
  });
  const [budget, setBudget] = useState<BudgetInfo>({
    currency: 'NGN',
    amount: null,
  });
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressInfo>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
  });
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [urgency, setUrgency] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    // Load user data if available
    if (user) {
      setRequesterInfo(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email || '',
        companyName: user.company || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    // Check if category info was passed from CategoryDetailPage
    const categoryState = location.state?.category as CategoryInfo | undefined;
    if (categoryState && categoryState.name) {
      setSelectedCategory(categoryState);
      
      // Set category image preview if available
      if (categoryState.image) {
        const imageUrl = categoryState.image.startsWith('http') 
          ? categoryState.image 
          : apiClient.getFileUrl(categoryState.image);
        setCategoryImagePreview(imageUrl);
      }
      
      // Pre-fill first request item with category info
      const initialItem: RequestItem = {
        id: Date.now(),
        name: '',
        category: categoryState.slug || '',
        description: categoryState.description || '',
        quantity: 1,
        unit: 'pcs',
        priority: 'medium',
        deliveryLocation: '',
        requiredDate: '',
        specifications: '',
      };
      setRequestItems([initialItem]);
      
      toast({
        title: 'Category Selected',
        description: `Creating request for: ${categoryState.name}`,
      });
      
      // Clear the location state to prevent re-using on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  const addRequestItem = () => {
    const newItem: RequestItem = {
      id: Date.now(),
      name: '',
      category: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      priority: 'medium',
      deliveryLocation: '',
      requiredDate: '',
      specifications: '',
    };
    setRequestItems([...requestItems, newItem]);
  };

  const removeRequestItem = (id: number) => {
    setRequestItems(requestItems.filter(item => item.id !== id));
  };

  const updateRequestItem = (id: number, field: keyof RequestItem, value: any) => {
    setRequestItems(requestItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = [...referenceFiles];
    const newPreviews = [...imagePreviews];

    files.forEach((file) => {
      // Add file to the list
      newFiles.push(file);

      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string);
            setImagePreviews([...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    setReferenceFiles(newFiles);
  };

  const removeFile = (index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateRequestItems = (): string | null => {
    for (let i = 0; i < requestItems.length; i++) {
      const item = requestItems[i];
      if (!item.name || item.name.trim() === '') {
        return `Item ${i + 1}: Item/Service Name is required`;
      }
      if (item.quantity < 1) {
        return `Item ${i + 1}: Quantity must be at least 1`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requestItems.length === 0) {
      toast({
        title: 'Missing Items',
        description: 'Please add at least one item to your procurement request.',
        variant: 'destructive',
      });
      return;
    }

    const itemValidationError = validateRequestItems();
    if (itemValidationError) {
      toast({
        title: 'Invalid Item',
        description: itemValidationError,
        variant: 'destructive',
      });
      return;
    }

    if (!requesterInfo.fullName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your full name.',
        variant: 'destructive',
      });
      return;
    }

    if (!requesterInfo.email.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!requesterInfo.companyName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your company name.',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryAddress.street.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a street address for delivery.',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryAddress.city.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a city for delivery.',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryAddress.state.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a state for delivery.',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryAddress.country.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a country for delivery.',
        variant: 'destructive',
      });
      return;
    }

    if (!urgency) {
      toast({
        title: 'Missing Information',
        description: 'Please select an urgency level.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsDescription = requestItems.map((item, index) => {
        return `${index + 1}. ${item.name || 'Unnamed Item'} (Qty: ${item.quantity} ${item.unit}) - ${item.category || 'No category'}${item.description ? '\n   Description: ' + item.description : ''}${item.specifications ? '\n   Specs: ' + item.specifications : ''}`;
      }).join('\n');

      const title = selectedCategory 
        ? `${selectedCategory.name} - ${requesterInfo.companyName}`
        : `Procurement Request - ${requesterInfo.companyName}`;

      let description = `Category: ${selectedCategory?.name || 'General Procurement'}\n\n`;
      description += `Items Requested:\n${itemsDescription}\n\n`;
      if (specialRequirements) {
        description += `Special Requirements: ${specialRequirements}\n`;
      }
      description += `Total Items: ${requestItems.length}`;

      const requestData = {
        title: title,
        description: description,
        quantity: requestItems.reduce((sum, item) => sum + item.quantity, 1),
        priority: urgency || 'medium',
        deliveryStreet: deliveryAddress.street,
        deliveryCity: deliveryAddress.city,
        deliveryState: deliveryAddress.state,
        deliveryZipCode: deliveryAddress.zipCode,
        deliveryCountry: deliveryAddress.country,
        budgetCurrency: budget.currency,
        budgetAmount: budget.amount,
        files: referenceFiles,
      };

      console.log('Submitting procurement request to /api/v1/requests:', requestData);
      
      const response = await apiClient.createOrder(requestData);
      console.log('Order created successfully:', response);
      
      const createdRequestId = response?.data?.request?.id || response?.data?.order?.id;
      
      toast({
        title: 'Success',
        description: 'Your procurement request has been submitted successfully. You will receive a confirmation email shortly.',
      });

      if (createdRequestId) {
        navigate(`/request/${createdRequestId}`);
      } else {
        navigate('/my-requests');
      }
    } catch (error: any) {
      console.error('Create order error:', error);
      let errorMessage = error.message || 'Failed to submit procurement request. Please try again.';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Your session has expired. Please log in again and try submitting your request.';
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        errorMessage = 'The service is temporarily unavailable. Please try again later or contact support.';
      } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
        errorMessage = 'Our server is having issues. Please wait a moment and try again.';
      }
      
      toast({
          title: 'Submission Failed',
          description: errorMessage,
          variant: 'destructive',
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Banner - Show when category is selected */}
        {selectedCategory && (
          <Card className="mb-6 bg-gradient-to-r from-[#0e7490] to-[#164e63] text-white border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {categoryImagePreview ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={categoryImagePreview} 
                      alt={selectedCategory.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-10 w-10 text-white/80" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-white/80 mb-1">Creating request for category:</p>
                  <h2 className="text-2xl font-bold">{selectedCategory.name}</h2>
                  {selectedCategory.description && (
                    <p className="text-sm text-white/90 mt-1 line-clamp-2">{selectedCategory.description}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryImagePreview(null);
                    setRequestItems([]);
                  }}
                  className="flex-shrink-0"
                >
                  Change Category
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="mb-8 tour-form-header">
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedCategory ? `Request ${selectedCategory.name}` : 'Create Procurement Request'}
          </h1>
          <p className="mt-2 text-gray-600">
            {selectedCategory 
              ? `Submit your procurement request for ${selectedCategory.name}. Our team will review and respond with quotes and availability.`
              : 'Submit your procurement request for goods and services. Our team will review and respond with quotes and availability.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Requester Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Requester Information
              </CardTitle>
              <CardDescription>
                Please provide your contact and project details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={requesterInfo.fullName}
                    onChange={(e) => setRequesterInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={requesterInfo.email}
                    onChange={(e) => setRequesterInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={requesterInfo.companyName}
                    onChange={(e) => setRequesterInfo(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter your company name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={requesterInfo.phone}
                    onChange={(e) => setRequesterInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Request Items */}
          <Card className="tour-item-list">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Request Items
              </CardTitle>
              <CardDescription>
                Add items or services you need to procure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {requestItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequestItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Item/Service Name *</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateRequestItem(item.id, 'name', e.target.value)}
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select 
                        value={item.category} 
                        onValueChange={(value) => updateRequestItem(item.id, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iphones-gadgets">iPhones & Gadgets</SelectItem>
                          <SelectItem value="medical-equipments">Medical Equipments</SelectItem>
                          <SelectItem value="home-garden-wares">Home & Garden Wares</SelectItem>
                          <SelectItem value="machineries">Machineries</SelectItem>
                          <SelectItem value="general-procurement">General Procurement</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                                        <div>
                      <Label>Quantity *</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => updateRequestItem(item.id, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          className="text-center h-10 w-20 shrink-0"
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (parseInt(val) > 0 && /^\d+$/.test(val))) {
                              updateRequestItem(item.id, 'quantity', val === '' ? 1 : parseInt(val));
                            }
                          }}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => updateRequestItem(item.id, 'quantity', (item.quantity || 1) + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateRequestItem(item.id, 'unit', e.target.value)}
                        placeholder="e.g., pcs, kg, hours"
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select onValueChange={(value) => updateRequestItem(item.id, 'priority', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateRequestItem(item.id, 'description', e.target.value)}
                      placeholder="Provide detailed description of the item/service"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Delivery Location</Label>
                      <Input
                        value={item.deliveryLocation}
                        onChange={(e) => updateRequestItem(item.id, 'deliveryLocation', e.target.value)}
                        placeholder="Enter delivery address"
                      />
                    </div>
                    <div>
                      <Label>Required Date</Label>
                      <Input
                        type="date"
                        value={item.requiredDate}
                        onChange={(e) => updateRequestItem(item.id, 'requiredDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Specifications</Label>
                    <Textarea
                      value={item.specifications}
                      onChange={(e) => updateRequestItem(item.id, 'specifications', e.target.value)}
                      placeholder="Provide specific technical requirements or specifications"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addRequestItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Additional Information
              </CardTitle>
              <CardDescription>
                Provide additional details about your request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deliveryStreet">Street Address *</Label>
                <Input
                  id="deliveryStreet"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Enter street address"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryCity">City *</Label>
                  <Input
                    id="deliveryCity"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryState">State *</Label>
                  <Input
                    id="deliveryState"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter state"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryZipCode">Zip Code</Label>
                  <Input
                    id="deliveryZipCode"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="Enter zip code"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryCountry">Country *</Label>
                  <Input
                    id="deliveryCountry"
                    value={deliveryAddress.country}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>
              
              {/* Budget Information */}
              <Card className="bg-gray-50 border-2 border-dashed border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Budget Information (Optional)
                  </CardTitle>
                  <CardDescription>
                    Set an estimated budget for this procurement request. This helps us provide you with accurate quotes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgetCurrency">Currency</Label>
                      <Select 
                        value={budget.currency} 
                        onValueChange={(value) => setBudget(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                                                <SelectContent>
                          <SelectItem value="NGN">NGN (₦) - Nigerian Naira</SelectItem>
                          <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                          <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                          <SelectItem value="CNY">CNY (¥) - Chinese Yuan</SelectItem>
                          <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                          <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                          <SelectItem value="GHS">GHS (₵) - Ghanaian Cedi</SelectItem>
                          <SelectItem value="KES">KES (KSh) - Kenyan Shilling</SelectItem>
                          <SelectItem value="ZAR">ZAR (R) - South African Rand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="budgetAmount">Estimated Budget Amount</Label>
                      <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {budget.currency === 'NGN' ? '₦' : 
                           budget.currency === 'USD' ? '$' : 
                           budget.currency === 'EUR' ? '€' : 
                           budget.currency === 'GBP' ? '£' : 
                           budget.currency === 'CNY' || budget.currency === 'JPY' ? '¥' : 
                           budget.currency === 'CAD' ? 'C$' : 
                           budget.currency === 'AUD' ? 'A$' : 
                           budget.currency === 'GHS' ? '₵' : 
                           budget.currency === 'KES' ? 'KSh' : 
                           budget.currency === 'ZAR' ? 'R' : 
                           '$'}
                        </span>
                        <Input
                          id="budgetAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={budget.amount || ''}
                          onChange={(e) => setBudget(prev => ({ 
                            ...prev, 
                            amount: e.target.value ? parseFloat(e.target.value) : null 
                          }))}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Leave blank if you don't have a budget in mind</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div>
                <Label htmlFor="urgency">Urgency Level *</Label>
                <Select onValueChange={setUrgency} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait 2-4 weeks</SelectItem>
                    <SelectItem value="medium">Medium - Needed within 1-2 weeks</SelectItem>
                    <SelectItem value="high">High - Needed within 1 week</SelectItem>
                    <SelectItem value="urgent">Urgent - Needed immediately</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Any special requirements, certifications, or delivery instructions"
                  rows={3}
                />
              </div>
              
              <div className="tour-upload-section">
                <Label htmlFor="referenceFiles">Reference Files (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload specifications, drawings, or reference documents
                  </p>
                  <input
                    id="referenceFiles"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('referenceFiles')?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
                
                {referenceFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {referenceFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="border rounded-lg p-2 bg-gray-50">
                          {/* Image Preview */}
                          {imagePreviews[index] && (
                            <div className="mb-2">
                              <img
                                src={imagePreviews[index]}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded"
                              />
                            </div>
                          )}
                          
                          {/* File Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-red-500">×</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {requestItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span>{requestItems.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Request Status:</span>
                    <span className="text-green-600">Ready to Submit</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="tour-submit-btn">
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Procurement Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestPage;