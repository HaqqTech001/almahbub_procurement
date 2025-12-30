import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  FileText, 
  Book, 
  MessageSquare,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const HelpPage: React.FC = () => {
  const faqs = [
    {
      question: 'How do I create a procurement request?',
      answer: 'Navigate to "Create Request" from your dashboard or the requests page. Fill in the required details, add items with specifications, upload any reference documents, and submit your request.',
      category: 'Getting Started',
    },
    {
      question: 'How long does it take to get a quote?',
      answer: 'Our team typically reviews and responds to new requests within 24 business hours. Complex requests may take longer, but we will keep you updated on progress.',
      category: 'Requests',
    },
    {
      question: 'Can I modify my request after submission?',
      answer: 'Yes, you can modify requests that are still in "received" or "reviewing" status. Go to your request details and look for the edit option, or contact support for assistance.',
      category: 'Requests',
    },
    {
      question: 'How do I track my order delivery?',
      answer: 'Go to "My Requests" and click on the request you want to track. The request detail page includes a timeline showing the current status and estimated delivery date.',
      category: 'Delivery',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept bank transfers, credit cards, and corporate account payments. Payment terms can be discussed during the quoting process.',
      category: 'Payments',
    },
    {
      question: 'How do I upload documents to my request?',
      answer: 'When creating or editing a request, you will see an upload section where you can drag and drop files or click to browse. Supported formats include PDF, images, and office documents.',
      category: 'Getting Started',
    },
  ];

  const categories = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Learn the basics of using our platform',
      articles: 5,
    },
    {
      icon: FileText,
      title: 'Requests & Quotes',
      description: 'Everything about creating and managing requests',
      articles: 8,
    },
    {
      icon: MessageSquare,
      title: 'Communication',
      description: 'Chat, calls, and collaboration features',
      articles: 6,
    },
    {
      icon: Package,
      title: 'Orders & Delivery',
      description: 'Tracking and managing your deliveries',
      articles: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-teal-600" />
            Help Center
          </h1>
          <p className="text-gray-600">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Live Chat</h3>
                <p className="text-sm text-gray-500">Chat with our team</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Email Support</h3>
                <p className="text-sm text-gray-500">Get help via email</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Phone className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Phone Support</h3>
                <p className="text-sm text-gray-500">Call us directly</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </CardContent>
          </Card>
        </div>

        {/* Help Categories */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card key={category.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                    <category.icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                  <Badge variant="secondary">{category.articles} articles</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="mb-2">
                      {faq.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
                <p className="text-teal-100">
                  Our support team is available 24/7 to assist you with any questions or concerns.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" asChild>
                  <Link to="/contact">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Us
                  </Link>
                </Button>
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  <Phone className="w-4 h-4 mr-2" />
                  1-800-ALMAHBUB
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Additional Resources</h3>
              <p className="text-sm text-gray-500">
                Explore our documentation and API guides for developers
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                API Documentation
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                User Guide
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
