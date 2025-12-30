import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative inline-block">
              <span className="text-9xl font-bold text-gray-200 select-none">4</span>
              <div className="absolute -inset-4 flex items-center justify-center">
                <Compass className="h-16 w-16 text-teal-600 animate-spin-slow" style={{ animationDuration: '8s' }} />
              </div>
              <span className="text-9xl font-bold text-gray-200 select-none">4</span>
            </div>
          </div>

          {/* Error Message */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="pt-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Oops! Lost in Space
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                The page you're looking for has drifted into the void.
                It might have been moved, deleted, or never existed in the first place.
              </p>

              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full h-12">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" className="w-full h-12">
                    <Compass className="mr-2 h-4 w-4" />
                    Services
                  </Button>
                </Link>
                <Link to="/my-requests">
                  <Button variant="outline" className="w-full h-12">
                    <Search className="mr-2 h-4 w-4" />
                    My Requests
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="w-full h-12">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Contact Us
                  </Button>
                </Link>
              </div>

              {/* Back Button */}
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>

          {/* Decorative Elements */}
          <div className="mt-12 text-sm text-gray-400">
            <p>Error code: 404 - Page Not Found</p>
            <p className="mt-2">
              Need help?{' '}
              <Link to="/contact" className="text-teal-600 hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-sm text-gray-400 border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} Almahbub Procurement. All rights reserved.</p>
      </div>
    </div>
  );
};

export default NotFoundPage;
