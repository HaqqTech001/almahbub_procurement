import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, LayoutDashboard, Settings } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative inline-block">
              <span className="text-9xl font-bold text-gray-300 select-none">4</span>
              <div className="absolute -inset-4 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-teal-600">?</span>
                </div>
              </div>
              <span className="text-9xl font-bold text-gray-300 select-none">4</span>
            </div>
          </div>

          {/* Error Message */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="pt-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Page Not Found
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                The page you're looking for doesn't exist or has been moved.
                Don't worry, let's get you back on track.
              </p>

              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Link to="/">
                  <Button variant="outline" className="w-full h-12">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button variant="outline" className="w-full h-12">
                    <Home className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                </Link>
                <Link to="/requests">
                  <Button variant="outline" className="w-full h-12">
                    <Settings className="mr-2 h-4 w-4" />
                    Requests
                  </Button>
                </Link>
                <Link to="/notifications">
                  <Button variant="outline" className="w-full h-12">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Notifications
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
              If you think this is an error, please contact the administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-sm text-gray-400 border-t border-gray-200 bg-white">
        <p>&copy; {new Date().getFullYear()} Almahbub Admin Panel. All rights reserved.</p>
      </div>
    </div>
  );
};

export default NotFoundPage;
