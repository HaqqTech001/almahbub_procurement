import React from 'react';
import { Shield, Eye, Lock, Database, Globe, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPage: React.FC = () => {
  const lastUpdated = 'December 12, 2025';

  const sections = [
    {
      icon: <Eye className="h-6 w-6 text-teal-600" />,
      title: 'Information We Collect',
      content: [
        'Personal identification information (name, email, phone number)',
        'Company information (company name, type, address)',
        'Payment and billing information',
        'Order history and preferences',
        'Website usage data and analytics',
        'Communication records with our support team'
      ]
    },
    {
      icon: <Lock className="h-6 w-6 text-teal-600" />,
      title: 'How We Use Your Information',
      content: [
        'Process and fulfill your orders',
        'Provide customer support and assistance',
        'Send order updates and notifications',
        'Improve our services and website functionality',
        'Send marketing communications (with your consent)',
        'Comply with legal obligations'
      ]
    },
    {
      icon: <Database className="h-6 w-6 text-teal-600" />,
      title: 'Data Storage and Security',
      content: [
        'We use industry-standard encryption to protect your data',
        'Your information is stored on secure servers',
        'Regular security audits and updates',
        'Access controls and authentication measures',
        'Backup and disaster recovery procedures',
        'Compliance with international security standards'
      ]
    },
    {
      icon: <Globe className="h-6 w-6 text-teal-600" />,
      title: 'Information Sharing',
      content: [
        'We do not sell your personal information',
        'We may share data with trusted service providers',
        'Legal compliance and law enforcement requests',
        'Business transfers (mergers, acquisitions)',
        'Your explicit consent for specific purposes',
        'Aggregate, non-identifiable information only'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Introduction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-gray-600">
              <p>
                Almahbub International ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our procurement and service management platform.
              </p>
              <p>
                By using our services, you consent to the data practices described in this policy. 
                If you do not agree with this policy, please do not use our services.
              </p>
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

        {/* Your Rights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Rights and Choices</CardTitle>
            <CardDescription>
              You have several rights regarding your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Access Rights</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Request access to your personal data</li>
                  <li>• Receive a copy of your information</li>
                  <li>• Correct inaccurate information</li>
                  <li>• Delete your account and data</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Communication Rights</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Opt-out of marketing emails</li>
                  <li>• Control notification preferences</li>
                  <li>• Withdraw consent at any time</li>
                  <li>• File complaints with authorities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p>
                We retain your personal information for as long as necessary to provide our services 
                and fulfill the purposes outlined in this policy. When we no longer need your information, 
                we will securely delete or anonymize it.
              </p>
              <ul className="mt-4 space-y-1">
                <li>• <strong>Account data:</strong> Retained while your account is active</li>
                <li>• <strong>Order information:</strong> Retained for 7 years for legal compliance</li>
                <li>• <strong>Communication records:</strong> Retained for 3 years</li>
                <li>• <strong>Marketing data:</strong> Retained until you opt-out</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cookies and Tracking */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Cookies and Tracking Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p>
                We use cookies and similar technologies to enhance your browsing experience, 
                analyze website traffic, and personalize content. You can control cookie 
                preferences through your browser settings.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Types of Cookies</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Essential cookies (required for site functionality)</li>
                    <li>• Analytics cookies (help us improve our services)</li>
                    <li>• Marketing cookies (for personalized advertising)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Managing Cookies</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Browser settings and preferences</li>
                    <li>• Our cookie preference center</li>
                    <li>• Third-party opt-out tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* International Transfers */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data during international transfers, 
                including:
              </p>
              <ul className="mt-4 space-y-1">
                <li>• Adequacy decisions by relevant authorities</li>
                <li>• Standard contractual clauses</li>
                <li>• Binding corporate rules</li>
                <li>• Other legally recognized transfer mechanisms</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">
              <p>
                We may update this Privacy Policy from time to time. When we make changes, 
                we will notify you by posting the updated policy on our website and updating 
                the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-teal-50 border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-teal-600" />
              <span>Contact Us</span>
            </CardTitle>
            <CardDescription>
              Have questions about this Privacy Policy?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> privacy@almahbub.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Business Avenue, Suite 456, New York, NY 10001</p>
              <p className="text-sm mt-4">
                If you have any concerns about how we handle your personal information, 
                please don't hesitate to contact us. We will respond to your inquiry promptly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPage;