import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'How do I create an account?',
      answer: 'To create an account, click on the "Register" button in the top navigation. Fill out the registration form with your personal and company information. You\'ll receive an email to verify your account before you can start using our services.',
      category: 'account',
    },
    {
      id: 2,
      question: 'How can I track my order?',
      answer: 'You can track your order by logging into your account and navigating to "My Orders" section. Click on any order to see its current status and tracking information. You\'ll also receive email updates about your order progress.',
      category: 'orders',
    },
    {
      id: 3,
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including credit cards (Visa, MasterCard, American Express), bank transfers, PayPal, and wire transfers. For large orders, we also offer payment terms for qualified business customers.',
      category: 'payment',
    },
    {
      id: 4,
      question: 'How long does delivery take?',
      answer: 'Delivery times vary depending on the products and destination. Standard delivery takes 7-14 business days for most locations. Express shipping options are available for urgent orders. Specific delivery times will be provided during the ordering process.',
      category: 'shipping',
    },
    {
      id: 5,
      question: 'Can I cancel or modify my order?',
      answer: 'Orders can be cancelled or modified within 24 hours of placement, provided the items haven\'t been processed or shipped. Contact our customer service team immediately if you need to make changes.',
      category: 'orders',
    },
    {
      id: 6,
      question: 'Do you offer international shipping?',
      answer: 'Yes, we ship worldwide to over 50 countries. Shipping costs and delivery times vary by destination. You can see available shipping options and costs during the checkout process.',
      category: 'shipping',
    },
    {
      id: 7,
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items in their original condition. Custom or personalized items may have different return terms. Please contact our support team to initiate a return.',
      category: 'returns',
    },
    {
      id: 8,
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page and enter your email address. You\'ll receive an email with instructions to reset your password. If you don\'t receive the email, check your spam folder or contact support.',
      category: 'account',
    },
    {
      id: 9,
      question: 'Are your products quality assured?',
      answer: 'Yes, all our products undergo rigorous quality control processes. We work with certified suppliers and conduct regular quality inspections to ensure products meet international standards.',
      category: 'products',
    },
    {
      id: 10,
      question: 'Do you offer bulk discounts?',
      answer: 'Yes, we offer competitive pricing for bulk orders. Contact our sales team with your requirements for a customized quote. We also have partnership programs for regular large-volume customers.',
      category: 'pricing',
    },
    {
      id: 11,
      question: 'How can I contact customer support?',
      answer: 'You can reach our customer support team via phone (+1-555-123-4567), email (support@almahbub.com), live chat, or by filling out our contact form. We\'re available Monday-Friday, 9 AM - 6 PM EST.',
      category: 'support',
    },
    {
      id: 12,
      question: 'Is my personal information secure?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your personal and financial information. We comply with international data protection regulations and never share your information with third parties without consent.',
      category: 'security',
    },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'account', label: 'Account & Registration' },
    { value: 'orders', label: 'Orders & Tracking' },
    { value: 'payment', label: 'Payment & Billing' },
    { value: 'shipping', label: 'Shipping & Delivery' },
    { value: 'returns', label: 'Returns & Refunds' },
    { value: 'products', label: 'Products & Quality' },
    { value: 'pricing', label: 'Pricing & Discounts' },
    { value: 'support', label: 'Customer Support' },
    { value: 'security', label: 'Security & Privacy' },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-6">
            <HelpCircle className="h-8 w-8 text-cyan-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our services, orders, and policies.
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredFAQs.length} of {faqs.length} questions
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse all categories
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-6 h-auto text-left hover:bg-gray-50"
                      onClick={() => toggleItem(faq.id)}
                    >
                      <span className="font-medium text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      {openItems.includes(faq.id) ? (
                        <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6">
                      <div className="border-t pt-4">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="mt-3">
                          <span className="inline-block bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full">
                            {categories.find(cat => cat.value === faq.category)?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-cyan-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-cyan-100 mb-6 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our customer support team is here to help you with any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/chat"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-cyan-600 transition-colors"
            >
              Live Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;