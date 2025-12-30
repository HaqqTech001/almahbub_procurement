const http = require('http');
const url = require('url');

// DEPENDENCY-FREE FALLBACK SERVER
// This is a minimal fallback for sandbox environments without npm dependencies
// For full functionality, install dependencies and use the Express server

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'development',
      database: 'Mock (dependency-free fallback)',
      message: 'Almahbub Procurement Platform Backend (Fallback Mode)',
      note: 'This is a minimal fallback server. For full functionality, install dependencies.'
    }));
    return;
  }

  // Route handlers for basic endpoints
  const handleRoute = (response, statusCode, data) => {
    res.writeHead(statusCode);
    res.end(JSON.stringify(data));
  };

  // Admin login endpoint
  if (pathname === '/api/v1/auth/admin/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        if (email === 'admin@almahbub.com' && password === 'admin123456') {
          handleRoute(res, 200, {
            success: true,
            message: 'Admin login successful',
            data: {
              user: { id: 1, email: 'admin@almahbub.com', firstName: 'Admin', lastName: 'User', role: 'admin', emailVerified: true },
              token: 'mock-jwt-token-for-demo'
            }
          });
        } else {
          handleRoute(res, 401, { error: 'Invalid admin credentials' });
        }
      } catch (error) {
        handleRoute(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // Registration endpoint
  if (pathname === '/api/v1/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { email, password, firstName, lastName, company, phone } = JSON.parse(body);
        if (!email || !password || !firstName || !lastName) {
          handleRoute(res, 400, { error: 'Missing required fields' });
          return;
        }
        handleRoute(res, 201, {
          success: true,
          message: 'User registered successfully',
          data: {
            user: { id: Date.now(), email, firstName, lastName, role: 'user', emailVerified: false, company: company || null, phone: phone || null },
            token: `mock-jwt-token-${Date.now()}`
          }
        });
      } catch (error) {
        handleRoute(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // Get current user endpoint
  if (pathname === '/api/v1/auth/me' && req.method === 'GET') {
    handleRoute(res, 200, {
      success: true,
      data: {
        user: {
          id: 1,
          email: 'admin@almahbub.com',
          first_name: 'Admin',
          last_name: 'User',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          email_verified: true,
          emailVerified: true,
          company: 'Almahbub International',
          phone: '+1234567890',
          avatar: '',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      }
    });
    return;
  }

  // Email verification endpoint
  if (pathname.startsWith('/api/v1/auth/verify-email/') && req.method === 'POST') {
    const token = pathname.split('/').pop();
    handleRoute(res, 200, {
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: 1,
          email: 'admin@almahbub.com',
          first_name: 'Admin',
          last_name: 'User',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          email_verified: true,
          emailVerified: true,
          company: 'Almahbub International',
          phone: '+1234567890',
          avatar: '',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      }
    });
    return;
  }

  // Update profile endpoint
  if (pathname === '/api/v1/auth/updatedetails' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const profileData = JSON.parse(body);
        handleRoute(res, 200, {
          success: true,
          message: 'Profile updated successfully',
          data: {
            user: {
              id: 1,
              email: profileData.email || 'admin@almahbub.com',
              first_name: profileData.firstName || 'Admin',
              last_name: profileData.lastName || 'User',
              firstName: profileData.firstName || 'Admin',
              lastName: profileData.lastName || 'User',
              role: 'admin',
              email_verified: true,
              emailVerified: true,
              company: profileData.companyName || 'Almahbub International',
              phone: profileData.phone || '+1234567890',
              avatar: '',
              created_at: '2024-01-01T00:00:00.000Z'
            }
          }
        });
      } catch (error) {
        handleRoute(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // Regular login endpoint
  if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        if (email === 'admin@almahbub.com' && password === 'admin123456') {
          handleRoute(res, 200, {
            success: true,
            message: 'Login successful',
            data: { user: { id: 1, email: 'admin@almahbub.com', firstName: 'Admin', lastName: 'User', role: 'admin', emailVerified: true }, token: 'mock-jwt-token-for-demo' }
          });
        } else {
          handleRoute(res, 401, { error: 'Invalid credentials' });
        }
      } catch (error) {
        handleRoute(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // Mock endpoints for orders, categories, products, users
  const mockEndpoints = {
    '/api/v1/orders': { 
      success: true, 
      data: { 
        orders: [
          { 
            id: 1, 
            title: 'Office Equipment Purchase', 
            description: 'Need laptops and monitors for new office setup',
            status: 'received',
            budget: 15000,
            quantity: 10,
            files: [],
            admin_notes: 'High priority order',
            created_at: '2024-12-10T10:00:00.000Z',
            updated_at: '2024-12-10T10:00:00.000Z',
            user_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@company.com',
            company: 'ABC Corporation',
            product_name: 'Laptops and Monitors'
          },
          { 
            id: 2, 
            title: 'Furniture Procurement', 
            description: 'Office desks and chairs for expansion',
            status: 'reviewing',
            budget: 8000,
            quantity: 15,
            files: [],
            admin_notes: '',
            created_at: '2024-12-12T14:30:00.000Z',
            updated_at: '2024-12-13T09:15:00.000Z',
            user_id: 2,
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@tech.com',
            company: 'Tech Solutions Ltd',
            product_name: 'Office Furniture'
          }
        ] 
      } 
    },
    '/api/v1/orders/1': { 
      success: true, 
      data: { 
        order: {
          id: 1,
          requestNumber: 'REQ-000001',
          title: 'Office Equipment Purchase',
          description: 'Need laptops and monitors for new office setup',
          status: 'received',
          totalAmount: 15000,
          currency: 'USD',
          subtotal: 15000,
          tax: 0,
          items: [
            {
              id: 1,
              productName: 'Dell Laptop',
              description: 'High-performance laptop for business use',
              specifications: '16GB RAM, 512GB SSD, Intel i7',
              quantity: 5,
              unitPrice: 2000,
              totalPrice: 10000,
              category: 'Electronics'
            },
            {
              id: 2,
              productName: '27-inch Monitor',
              description: 'Professional display monitor',
              specifications: '4K resolution, USB-C connectivity',
              quantity: 5,
              unitPrice: 1000,
              totalPrice: 5000,
              category: 'Electronics'
            }
          ],
          deliveryAddress: {
            fullName: 'John Doe',
            companyName: 'ABC Corporation',
            street: '123 Business Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
            phone: '+1-555-123-4567'
          },
          priority: 'high',
          expectedDeliveryDate: '2024-12-20',
          createdAt: '2024-12-10T10:00:00.000Z',
          updatedAt: '2024-12-10T10:00:00.000Z'
        }
      } 
    },
    '/api/v1/categories': { 
      success: true, 
      data: { 
        categories: [
          { 
            id: 1, 
            name: 'iPhones & Gadgets', 
            description: 'We source latest iPhones, smartphones, tablets, and electronic gadgets directly from manufacturers and authorized distributors worldwide.',
            image: '/images/categories/electronics.jpg',
            productCount: 5,
            slug: 'iphones-gadgets',
            isActive: true
          }, 
          { 
            id: 2, 
            name: 'Medical Equipments', 
            description: 'We source medical equipment, hospital furniture, diagnostic tools, and healthcare devices from certified manufacturers worldwide.',
            image: '/images/categories/medical.jpg',
            productCount: 5,
            slug: 'medical-equipments',
            isActive: true
          },
          { 
            id: 3, 
            name: 'Home & Garden Wares', 
            description: 'We source home furniture, kitchen appliances, garden equipment, and household items for residential and commercial use.',
            image: '/images/categories/home-garden.jpg',
            productCount: 5,
            slug: 'home-garden-wares',
            isActive: true
          },
          { 
            id: 4, 
            name: 'Machineries', 
            description: 'We source heavy machinery, industrial equipment, construction machinery, and specialized equipment for various industries.',
            image: '/images/categories/machinery.jpg',
            productCount: 5,
            slug: 'machineries',
            isActive: true
          },


        ] 
      } 
    },
    '/api/v1/categories/slug/iphones-gadgets': { 
      success: true, 
      data: { 
        category: {
          id: 1,
          name: 'iPhones & Gadgets',
          description: 'We source latest iPhones, smartphones, tablets, and electronic gadgets directly from manufacturers and authorized distributors worldwide.',
          image: '/images/categories/electronics.jpg',
          productCount: 5,
          slug: 'iphones-gadgets',
          isActive: true
        }
      } 
    },
    '/api/v1/categories/slug/medical-equipments': { 
      success: true, 
      data: { 
        category: {
          id: 2,
          name: 'Medical Equipments',
          description: 'We source medical equipment, hospital furniture, diagnostic tools, and healthcare devices from certified manufacturers worldwide.',
          image: '/images/categories/medical.jpg',
          productCount: 5,
          slug: 'medical-equipments',
          isActive: true
        }
      } 
    },
    '/api/v1/categories/slug/home-garden-wares': { 
      success: true, 
      data: { 
        category: {
          id: 3,
          name: 'Home & Garden Wares',
          description: 'We source home furniture, kitchen appliances, garden equipment, and household items for residential and commercial use.',
          image: '/images/categories/home-garden.jpg',
          productCount: 5,
          slug: 'home-garden-wares',
          isActive: true
        }
      } 
    },
    '/api/v1/categories/slug/machineries': { 
      success: true, 
      data: { 
        category: {
          id: 4,
          name: 'Machineries',
          description: 'We source heavy machinery, industrial equipment, construction machinery, and specialized equipment for various industries.',
          image: '/images/categories/machinery.jpg',
          productCount: 5,
          slug: 'machineries',
          isActive: true
        }
      } 
    },
    '/api/v1/categories/slug/general-procurement': { 
      success: true, 
      data: { 
        category: {
          id: 5,
          name: 'And Many More (General Procurement Requests)',
          description: 'We source medical equipment, hospital furniture, diagnostic tools, and healthcare devices from certified manufacturers worldwide.',
          image: '/images/categories/office-supplies.jpg',
          productCount: 5,
          slug: 'medical-equipments',
          isActive: true
        }
      } 
    },
    '/api/v1/categories/slug/home-garden-wares': { 
      success: true, 
      data: { 
        category: {
          id: 3,
          name: 'Home & Garden Wares',
          description: 'We source home furniture, kitchen appliances, garden equipment, and household items for residential and commercial use.',
          image: '/images/categories/industrial.jpg',
          productCount: 5,
          slug: 'home-garden-wares',
          isActive: true
        }
      } 
    },
    '/api/v1/categories/slug/general-procurement': { 
      success: true, 
      data: { 
        category: {
          id: 4,
          name: 'And Many More (General Procurement Requests)',
          description: 'General procurement requests for items not covered in specific categories. Submit any procurement need and we will source it for you.',
          image: '/images/categories/general.jpg',
          productCount: 999,
          slug: 'general-procurement',
          isActive: true
        }
      } 
    },
    '/api/v1/categories/slug/machineries': { 
      success: true, 
      data: { 
        category: {
          id: 3,
          name: 'Machineries',
          description: 'We source heavy machinery, industrial equipment, construction machinery, and specialized equipment for various industries.',
          image: '/images/categories/construction.jpg',
          productCount: 5,
          slug: 'machineries',
          isActive: true
        }
      } 
    },

    '/api/v1/categories/slug/transportation': { 
      success: true, 
      data: { 
        category: {
          id: 6,
          name: 'Transportation',
          description: 'Vehicles and transportation equipment',
          image: '/images/categories/transportation.jpg',
          productCount: 78,
          slug: 'transportation'
        }
      } 
    },
    '/api/v1/categories/1': { 
      success: true, 
      data: { 
        category: {
          id: 1,
          name: 'Electronics',
          description: 'Consumer electronics, gadgets, and tech equipment',
          image: '/images/categories/electronics.jpg',
          productCount: 150,
          slug: 'electronics'
        }
      } 
    },
    '/api/v1/categories/2': { 
      success: true, 
      data: { 
        category: {
          id: 2,
          name: 'Office Supplies',
          description: 'Professional office equipment and stationery',
          image: '/images/categories/office-supplies.jpg',
          productCount: 89,
          slug: 'office-supplies'
        }
      } 
    },
    '/api/v1/products': { 
      success: true, 
      data: { 
        products: [
          { id: 1, name: 'Latest iPhone Models', category: 'iPhones & Gadgets', description: 'iPhone 15 Pro, iPhone 15, iPhone 14 series' },
          { id: 2, name: 'Samsung Galaxy Series', category: 'iPhones & Gadgets', description: 'Galaxy S24, S24 Ultra, Note series smartphones' },
          { id: 3, name: 'Hospital Beds & Furniture', category: 'Medical Equipments', description: 'Electric hospital beds, examination tables' },
          { id: 4, name: 'Furniture & Furnishings', category: 'Home & Garden Wares', description: 'Home furniture, office furniture, outdoor furniture' },
          { id: 5, name: 'Heavy Machinery', category: 'Machineries', description: 'Construction equipment, excavators, bulldozers' },
          { id: 6, name: 'Custom Procurement', category: 'And Many More (General Procurement Requests)', description: 'Any item not covered in specific categories' }
        ] 
      } 
    },
    '/api/v1/categories/1/products': { 
      success: true, 
      data: { 
        products: [
          { id: 1, name: 'Dell Laptop', category: 'Electronics', price: 1200, description: 'High-performance business laptop' },
          { id: 7, name: 'iPhone 15', category: 'Electronics', price: 999, description: 'Latest smartphone' },
          { id: 8, name: 'Smart Watch', category: 'Electronics', price: 399, description: 'Fitness tracking smartwatch' }
        ] 
      } 
    },
    '/api/v1/categories/2/products': { 
      success: true, 
      data: { 
        products: [
          { id: 2, name: 'Office Chair', category: 'Office Supplies', price: 350, description: 'Ergonomic office chair' },
          { id: 9, name: 'Desk Organizer', category: 'Office Supplies', price: 25, description: 'Multi-compartment desk organizer' },
          { id: 10, name: 'Paper Shredder', category: 'Office Supplies', price: 120, description: 'Cross-cut paper shredder' }
        ] 
      } 
    },
    '/api/v1/users': { 
      success: true, 
      data: { 
        users: [
          { 
            id: 1, 
            email: 'admin@almahbub.com', 
            first_name: 'Admin', 
            last_name: 'User', 
            role: 'admin',
            email_verified: 1,
            company: 'Almahbub International',
            phone: '+1234567890',
            avatar: '',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          },
          { 
            id: 2, 
            email: 'john.doe@company.com', 
            first_name: 'John', 
            last_name: 'Doe', 
            role: 'user',
            email_verified: 1,
            company: 'ABC Corporation',
            phone: '+1987654321',
            avatar: '',
            created_at: '2024-01-15T00:00:00.000Z',
            updated_at: '2024-01-15T00:00:00.000Z'
          }
        ] 
      } 
    },
    '/api/v1/orders/admin/stats/overview': { 
      success: true, 
      data: { 
        overview: {
          total_orders: 25,
          pending_orders: 8,
          processing_orders: 5,
          approved_orders: 7,
          completed_orders: 5,
          today_orders: 3
        },
        weeklyData: [
          { date: '2024-12-09', count: 2 },
          { date: '2024-12-10', count: 4 },
          { date: '2024-12-11', count: 1 },
          { date: '2024-12-12', count: 3 },
          { date: '2024-12-13', count: 5 },
          { date: '2024-12-14', count: 2 },
          { date: '2024-12-15', count: 3 }
        ]
      } 
    }
  };

  if (req.method === 'GET' && mockEndpoints[pathname]) {
    handleRoute(res, 200, mockEndpoints[pathname]);
    return;
  }

  // 404 handler
  handleRoute(res, 404, {
    error: 'Route not found',
    availableEndpoints: ['GET /api/health', 'POST /api/v1/auth/admin/login', 'POST /api/v1/auth/login', 'POST /api/v1/auth/register', 'GET /api/v1/orders', 'GET /api/v1/categories', 'GET /api/v1/products', 'GET /api/v1/users']
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Almahbub Procurement Platform Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Admin Dashboard: http://localhost:5174`);
  console.log(`👤 Client Frontend: http://localhost:5173`);
  console.log('');
  console.log('🔑 Admin Credentials: admin@almahbub.com / admin123456');
  console.log('');
  console.log('⚠️  DEPENDENCY-FREE FALLBACK MODE');
  console.log('   This is a minimal server for sandbox environments.');
  console.log('   For full functionality with proper architecture:');
  console.log('   1. npm install (install dependencies)');
  console.log('   2. Use server.js with Express (proper MVC structure)');
  console.log('');
  console.log('✅ Available endpoints:');
  console.log('   GET  /api/health');
  console.log('   POST /api/v1/auth/admin/login');
  console.log('   POST /api/v1/auth/login');
  console.log('   POST /api/v1/auth/register');
  console.log('   GET  /api/v1/orders');
  console.log('   GET  /api/v1/categories');
  console.log('   GET  /api/v1/products');
  console.log('   GET  /api/v1/users');
});

module.exports = { server };