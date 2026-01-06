import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, ExternalLink } from 'lucide-react';
import { Facebook, Instagram, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

// WhatsApp configuration
const WHATSAPP_NUMBER = '2348074454081'; // Format: Country code + number (without +)
const WHATSAPP_MESSAGE = 'Hello Almahbub International, I need assistance with my inquiry.';

// Company address for map
const COMPANY_ADDRESS = 'Graceland Junction, Tanke Road, University Road, Ilorin, Kwara State, Nigeria, 240102';

// Company coordinates for more reliable map display
const COMPANY_LAT = 8.4799;
const COMPANY_LNG = 4.5418;

// OpenStreetMap embed URL (more reliable, no API key needed)
const OSM_MAP_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${COMPANY_LNG - 0.01},${COMPANY_LAT - 0.01},${COMPANY_LNG + 0.01},${COMPANY_LAT + 0.01}&layer=mapnik&marker=${COMPANY_LAT},${COMPANY_LNG}`;

// Static map image URL - more reliable than iframe
const STATIC_MAP_URL = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${COMPANY_LNG},${COMPANY_LAT}&size=800,400&z=16&l=map&pt=${COMPANY_LNG},${COMPANY_LAT},pm2rdm`;

// WhatsApp URL generator
const getWhatsAppUrl = (number: string, message: string) => {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.post('/contact', formData);
      toast({
        title: 'Message Sent',
        description: 'Thank you for your message. We\'ll get back to you within 24 hours.',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6 text-cyan-600" />,
      title: 'Phone',
      details: ['08074454081', '07033546666'],
    },
    {
      icon: <Mail className="h-6 w-6 text-cyan-600" />,
      title: 'Email',
      details: ['almahbubinternational@gmail.com'],
    },
    {
      icon: <MapPin className="h-6 w-6 text-cyan-600" />,
      title: 'Office Address',
      details: ['Graceland Junction', 'Tanke Road, University Road', 'Ilorin 240102, Kwara State, Nigeria'],
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-cyan-600" />,
      title: 'WeChat',
      details: ['Mujahid768832'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Almahbub International</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Need assistance with importing from China, USA, Korea, Malaysia, Japan, or Thailand? 
            Contact our procurement experts for professional service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Get in Touch</CardTitle>
                <CardDescription>
                  Multiple ways to reach our team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 bg-cyan-100 rounded-lg">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{info.title}</h3>
                      {info.details.map((detail, detailIndex) => (
                        <p key={detailIndex} className="text-gray-600 text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Contact Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="tel:08074454081" className="w-full">
                  <Button className="w-full justify-start" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </a>
                <a href="mailto:almahbubinternational@gmail.com" className="w-full">
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </a>
                <Link to="/chat" className="w-full">
                  <Button className="w-full justify-start" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Live Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Inquiry Type *</Label>
                      <Select onValueChange={(value) => handleSelectChange('inquiryType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="Enter the subject of your message"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Enter your message here..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Response Time:</strong> We typically respond to inquiries within 24 hours during business days. 
                      For urgent matters, please call us directly.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-brand hover:opacity-90"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">
                Our support team is available around the clock to assist you with any urgent issues.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600 text-sm">
                We guarantee a response to all inquiries within 24 hours, often much sooner.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 text-sm">
                Chat with our team in real-time for instant support and quick answers.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Links */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us on Social Media</h3>
          <div className="flex justify-center space-x-6">
            <a 
              href="https://www.facebook.com/almahbubinternational" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Facebook className="h-6 w-6" />
              <span className="text-sm font-medium">Facebook</span>
            </a>
            <a 
              href="https://www.tiktok.com/@almahbubinternational" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
              <span className="text-sm font-medium">TikTok</span>
            </a>
            <a 
              href="https://www.instagram.com/almahbubinternational" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-pink-600 hover:text-pink-800 transition-colors"
            >
              <Instagram className="h-6 w-6" />
              <span className="text-sm font-medium">Instagram</span>
            </a>
          </div>
        </div>

        {/* WhatsApp QR Code and Location Map */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* WhatsApp QR Code Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </h3>
              <p className="text-white/90 text-sm mt-1">Scan the QR code to start a conversation</p>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                {/* QR Code Image */}
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-[#25D366] mb-4">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getWhatsAppUrl(WHATSAPP_NUMBER, WHATSAPP_MESSAGE))}`}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Scan with your phone to open WhatsApp chat
                </p>
                
                {/* Direct Link Button */}
                <a 
                  href={getWhatsAppUrl(WHATSAPP_NUMBER, WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Open WhatsApp
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Response time: Usually within a few minutes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location Map Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 p-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                Our Location
              </h3>
              <p className="text-white/90 text-sm mt-1">Visit our office for in-person assistance</p>
            </div>
            <CardContent className="p-0">
              {/* Static Map Image - More reliable than iframe */}
              <div className="relative w-full h-64 bg-gray-100">
                <img
                  src={STATIC_MAP_URL}
                  alt="Office Location Map"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to OpenStreetMap static image if Yandex fails
                    const target = e.target as HTMLImageElement;
                    target.src = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${COMPANY_LNG},${COMPANY_LAT}&size=800,400&z=16&l=map&pt=${COMPANY_LNG},${COMPANY_LAT},pm2rdm`;
                  }}
                />
                {/* Location marker overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-full p-2 shadow-lg">
                    <MapPin className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </div>
              
              {/* Address info below map */}
              <div className="p-4 bg-gray-50 border-t">
                <p className="text-sm text-gray-600 mb-3 font-medium">{COMPANY_ADDRESS}</p>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_ADDRESS)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Google Maps
                  </a>
                  <a 
                    href={`https://www.openstreetmap.org/?mlat=${COMPANY_LAT}&mlon=${COMPANY_LNG}#map=17/${COMPANY_LAT}/${COMPANY_LNG}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in OpenStreetMap
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;