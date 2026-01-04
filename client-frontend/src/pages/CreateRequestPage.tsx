import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Minus, FileText, Package, MapPin, Clock, Upload, Image as ImageIcon } from 'lucide-react';
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

interface RequesterInfo {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  budget: number;
}

const CreateRequestPage: React.FC = () => {
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [requesterInfo, setRequesterInfo] = useState<RequesterInfo>({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    budget: 0,
  });
  const [deliveryAddress, setDeliveryAddress] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requestItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to your procurement request.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build items description for the backend
      const itemsDescription = requestItems.map((item, index) => {
        return `${index + 1}. ${item.name || 'Unnamed Item'} (Qty: ${item.quantity} ${item.unit}) - ${item.category || 'No category'}${item.description ? '\n   Description: ' + item.description : ''}${item.specifications ? '\n   Specs: ' + item.specifications : ''}`;
      }).join('\n');

      // Build title with category info if selected
      const title = selectedCategory 
        ? `${selectedCategory.name} - ${requesterInfo.companyName}`
        : `Procurement Request - ${requesterInfo.companyName}`;

      // Build comprehensive description
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
      };

      console.log('Submitting procurement request:', requestData);
      
      const response = await apiClient.createOrder(requestData);
      
      toast({
        title: 'Success',
        description: 'Your procurement request has been submitted successfully. You will receive a confirmation email shortly.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit procurement request. Please try again.',
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
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateRequestItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
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
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Textarea
                  id="deliveryAddress"
                  className="tour-delivery-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter complete delivery address"
                  rows={3}
                  required
                />
              </div>
              
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
              {isSubmitting ?
              (
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