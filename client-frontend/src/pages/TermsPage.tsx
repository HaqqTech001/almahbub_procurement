import React from 'react';
import { FileText, Scale, Users, Truck, CreditCard, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TermsPage: React.FC = () => {
  const lastUpdated = 'December 12, 2025';

  const sections = [
    {
      icon: <Users className="h-6 w-6 text-teal-600" />,
      title: 'User Accounts and Registration',
      content: [
        'You must provide accurate and complete information when creating an account',
        'You are responsible for maintaining the security of your account credentials',
        'You must notify us immediately of any unauthorized access to your account',
        'We reserve the right to suspend or terminate accounts that violate these terms',
        'One person may not maintain multiple accounts without permission'
      ]
    },
    {
      icon: <CreditCard className="h-6 w-6 text-teal-600" />,
      title: 'Orders and Payments',
      content: [
        'All orders are subject to acceptance and availability',
        'Prices are subject to change without notice',
        'Payment must be received before orders are processed',
        'We accept various payment methods as listed on our website',
        'Refunds and cancellations are subject to our refund policy',
        'Late payments may result in account suspension'
      ]
    },
    {
      icon: <Truck className="h-6 w-6 text-teal-600" />,
      title: 'Shipping and Delivery',
      content: [
        'Delivery times are estimates and not guaranteed',
        'Risk of loss passes to you upon delivery to the shipping address',
        'You are responsible for providing accurate shipping information',
        'International shipments may be subject to customs delays',
        'Additional fees may apply for expedited shipping'
      ]
    },
    {
      icon: <Scale className="h-6 w-6 text-teal-600" />,
      title: 'Intellectual Property',
      content: [
        'All content on our website is protected by copyright and other intellectual property laws',
        'You may not reproduce, distribute, or create derivative works without permission',
        'Our trademarks and logos may not be used without written consent',
        'You grant us a license to use content you submit for our services',
        'We respect the intellectual property rights of others'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            These terms govern your use of our procurement and service management platform.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-600">
              <p>
                Welcome to Almahbub International. These Terms of Service ("Terms") govern your use 
                of our website, services, and platform operated by Almahbub International ("we," "us," or "our").
              </p>
              <p>
                By accessing or using our service, you agree to be bound by these Terms. If you disagree 
                with any part of these terms, then you may not access the service.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Please read these terms carefully before using our services.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  {section.icon}
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Conduct */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>User Conduct and Responsibilities</CardTitle>
            <CardDescription>
              Guidelines for acceptable use of our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Permitted Uses</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Use our services for legitimate business purposes</li>
                  <li>• Access your own account and information</li>
                  <li>• Contact our support team for assistance</li>
                  <li>• Share feedback about our services</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Prohibited Uses</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Violate any applicable laws or regulations</li>
                  <li>• Transmit harmful or malicious content</li>
                  <li>• Attempt to gain unauthorized access to our systems</li>
                  <li>• Use automated systems to access our services</li>
                  <li>• Interfere with the proper functioning of our platform</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Availability */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Service Availability and Modifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p className="mb-4">
                We strive to provide reliable service, but we cannot guarantee uninterrupted access. 
                Our services may be temporarily unavailable due to maintenance, updates, or circumstances 
                beyond our control.
              </p>
              <ul className="space-y-1">
                <li>• Scheduled maintenance will be announced in advance when possible</li>
                <li>• We reserve the right to modify or discontinue services at any time</li>
                <li>• We are not liable for service interruptions or data loss</li>
                <li>• Emergency maintenance may be performed without notice</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p className="mb-4">
                To the maximum extent permitted by law, Almahbub International shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages, including without limitation, 
                loss of profits, data, use, goodwill, or other intangible losses.
              </p>
              <p>
                Our total liability for any claims arising from your use of the service shall not exceed 
                the amount you paid us in the twelve (12) months preceding the claim.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p className="mb-4">
                Any disputes arising from these Terms or your use of our services will be resolved through 
                binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
              <ul className="space-y-1">
                <li>• Disputes will be resolved in New York, NY</li>
                <li>• Class action lawsuits are waived</li>
                <li>• Small claims court remains available for appropriate disputes</li>
                <li>• Both parties waive the right to a jury trial</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Termination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p className="mb-4">
                Either party may terminate this agreement at any time. We may also suspend or terminate 
                your access immediately, without prior notice or liability, for any reason whatsoever.
              </p>
              <p>
                Upon termination, your right to use the service will cease immediately. All provisions 
                which by their nature should survive termination shall survive termination.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will try to provide at least 30 days notice prior to any new terms taking effect. 
                What constitutes a material change will be determined at our sole discretion.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p>
                These Terms shall be interpreted and governed by the laws of the State of New York, 
                United States, without regard to its conflict of law provisions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-teal-50 border-teal-200">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Questions about these Terms of Service?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> legal@almahbub.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Business Avenue, Suite 456, New York, NY 10001</p>
              <p className="text-sm mt-4">
                For urgent legal matters, please contact our legal department. 
                For general inquiries, please use our contact form.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;