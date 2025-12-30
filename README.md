---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304402205778746a82530fedc26b1cd00cc5507fc608627f7284402c9f61ed87b4a4687d02204a674228e02d4129ccb457dd0dd3999a7dcb947cc48832d438be2b9e00c28f77
    ReservedCode2: 30450220279bcbc2ab53c4dc7e5df45171b080e32ef6059512340e1c32592779d5157eea022100819b73a16bce8eb7e8fbe267ebd82634ee74867571d8befab3cc5ce6396b9a45
---

# Almahbub International Procurement & Service Management Platform

A comprehensive, production-ready full-stack procurement platform with real-time chat, AI auto-responder, and complete order management system.

## 🏗️ Project Architecture

### Backend (Node.js + Express + MySQL)
- **Authentication System**: JWT-based with email verification and password reset
- **Real-time Chat**: Socket.IO for instant messaging between users and admins
- **AI Auto-responder**: Intelligent response system using knowledge base and contextual responses
- **Order Management**: Complete CRUD operations for procurement orders
- **File Uploads**: Support for images and documents
- **Email Integration**: Google SMTP for notifications and verification
- **Database**: MySQL with optimized schemas and relationships

### Admin Dashboard (React + Vite + Tailwind + ShadCN)
- **Modern UI**: Clean, responsive design with Almahbub branding
- **Dashboard Analytics**: Real-time statistics and charts
- **Order Management**: Complete order tracking and status updates
- **User Management**: Admin controls for user accounts
- **Chat Interface**: Real-time communication with customers
- **AI Assistant**: Knowledge base management and statistics
- **System Settings**: Configuration and administration tools

### Client Frontend (React + Vite + Tailwind)
- **Customer Portal**: User-facing procurement interface
- **Order Creation**: Easy-to-use order submission forms
- **Order Tracking**: Real-time order status monitoring
- **Live Chat**: Direct communication with support team
- **Responsive Design**: Mobile-first approach for all devices

## 🎨 Brand Identity

### Color Palette
- **Primary Teal**: #205562 (Deep professional teal)
- **Rich Black**: #0D0D0D (Premium dark accent)
- **Golden Highlight**: #FCD693 (Warm gold for accents)
- **Neutral Light**: #F5F7F8 (Clean background)
- **Neutral Dark**: #1B1B1B (Dark mode support)

### Design System
- **Typography**: Modern, clean fonts with excellent readability
- **Icons**: Lucide React icon set for consistency
- **Animations**: Smooth transitions and micro-interactions
- **Responsiveness**: Mobile-first design approach
- **Accessibility**: WCAG compliant with proper contrast ratios

## 📦 Project Structure

```
almahbub-procurement/
├── backend/                    # Node.js + Express API Server
│   ├── config/                # Database and app configuration
│   ├── routes/                # API route handlers
│   ├── middleware/            # Custom middleware (auth, error handling)
│   ├── services/              # Business logic (email, AI, etc.)
│   ├── socket/                # Socket.IO chat handlers
│   ├── utils/                 # Utility functions
│   ├── scripts/               # Database seeding and migrations
│   └── uploads/               # File upload storage
├── admin-dashboard/           # React Admin Interface
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Application pages
│   │   ├── stores/           # Zustand state management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React contexts
│   │   └── lib/              # Utilities and API client
├── client-frontend/          # React Customer Portal
└── shared/                   # Shared utilities and types
```

## 🚀 Features

### Core Functionality
- ✅ **Authentication & Authorization**: JWT-based with role management
- ✅ **Email Verification**: Google SMTP integration for account verification
- ✅ **Password Reset**: Secure password recovery system
- ✅ **Real-time Chat**: Socket.IO powered messaging
- ✅ **AI Auto-responder**: Intelligent customer support
- ✅ **Order Management**: Complete procurement workflow
- ✅ **File Uploads**: Support for images and documents
- ✅ **Order Tracking**: Real-time status updates
- ✅ **User Management**: Admin controls for user accounts
- ✅ **Notifications**: In-app and email notifications
- ✅ **Announcements**: Admin-controlled public announcements
- ✅ **FAQ System**: Self-service customer support
- ✅ **Analytics Dashboard**: Real-time business metrics

### Technical Features
- ✅ **Responsive Design**: Mobile-first, works on all devices
- ✅ **Dark/Light Mode**: Complete theme switching
- ✅ **Production Ready**: Optimized builds and error handling
- ✅ **Security**: Rate limiting, input validation, CORS
- ✅ **Performance**: Optimized queries and caching
- ✅ **Real-time Updates**: Live chat and notifications
- ✅ **File Handling**: Secure upload and storage
- ✅ **API Documentation**: RESTful API with proper status codes

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd almahbub-procurement/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:5173
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=almahbub_procurement
   
   JWT_SECRET=your-super-secret-jwt-key
   
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=your-app-password
   ```

4. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE almahbub_procurement;"
   
   # Run seed script
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

### Admin Dashboard Setup

1. **Navigate to admin dashboard directory**
   ```bash
   cd almahbub-procurement/admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Access at: http://localhost:5174

### Client Frontend Setup

1. **Navigate to client frontend directory**
   ```bash
   cd almahbub-procurement/client-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Access at: http://localhost:5173

## 🔐 Default Credentials

### Admin Account
- **Email**: admin@almahbub.com
- **Password**: admin123456

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/admin/login` - Admin login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/verify-email/:token` - Email verification
- `POST /api/v1/auth/forgotpassword` - Password reset request
- `POST /api/v1/auth/resetpassword/:token` - Password reset

### Orders
- `GET /api/v1/orders` - Get orders (admin gets all, users get own)
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/:id` - Get specific order
- `PUT /api/v1/orders/:id` - Update order (admin only)
- `DELETE /api/v1/orders/:id` - Delete order (admin only)

### Chat
- `GET /api/v1/chat/conversations` - Get conversation list
- `GET /api/v1/chat/conversation/:userId` - Get messages with user
- `POST /api/v1/chat/send` - Send message
- `PUT /api/v1/chat/markread/:userId` - Mark messages as read

### Categories & Products
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get specific product

### AI Assistant
- `POST /api/v1/ai/auto-respond` - Get AI response
- `GET /api/v1/ai/knowledge` - Get knowledge base
- `POST /api/v1/ai/knowledge` - Add knowledge base entry

## 🎯 Usage Examples

### Creating an Order
1. **User Registration/Login**: Create account or login
2. **Browse Categories**: View available procurement categories
3. **Submit Request**: Fill out order form with requirements
4. **File Upload**: Attach relevant documents or images
5. **Track Progress**: Monitor order status in real-time

### Admin Order Management
1. **Dashboard Overview**: View all orders and statistics
2. **Order Processing**: Update order status and add notes
3. **Customer Communication**: Use chat for direct communication
4. **Track Management**: Add tracking information for orders

### AI Assistant
1. **Automatic Responses**: AI handles common questions
2. **Knowledge Base**: Admin adds answers to improve AI
3. **Learning System**: AI learns from admin responses
4. **Confidence Scoring**: AI provides response confidence levels

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

DB_HOST=localhost
DB_USER=almahbub_user
DB_PASSWORD=secure_password
DB_NAME=almahbub_procurement

JWT_SECRET=your-jwt-secret-key

GMAIL_USER=noreply@almahbub.com
GMAIL_PASS=app-specific-password

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

#### Admin Dashboard
```env
VITE_API_URL=http://localhost:5000/api/v1
```

#### Client Frontend
```env
VITE_API_URL=http://localhost:5000/api/v1
```

## 📊 Database Schema

### Key Tables
- **users**: User accounts and authentication
- **categories**: Product/service categories
- **products**: Available products and services
- **orders**: Customer procurement orders
- **chat_messages**: Real-time chat history
- **announcements**: Admin announcements
- **faqs**: Frequently asked questions
- **notifications**: System notifications
- **ai_knowledge**: AI assistant knowledge base

## 🚀 Deployment

### Production Build

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Admin Dashboard
```bash
cd admin-dashboard
npm run build
# Serve dist/ directory with nginx or similar
```

#### Client Frontend
```bash
cd client-frontend
npm run build
# Serve dist/ directory with nginx or similar
```

### Docker Deployment
```yaml
# docker-compose.yml example
version: '3.8'
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: almahbub_procurement
      MYSQL_USER: almahbub_user
      MYSQL_PASSWORD: userpassword
    
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=db
      - DB_USER=almahbub_user
      - DB_PASSWORD=userpassword
      - DB_NAME=almahbub_procurement
    
  admin-dashboard:
    build: ./admin-dashboard
    ports:
      - "5174:80"
      
  client-frontend:
    build: ./client-frontend
    ports:
      - "5173:80"
```

## 🔍 Testing

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@almahbub.com","password":"admin123456"}'

# Test order creation
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Order","description":"Test description"}'
```

### Socket.IO Testing
```javascript
// Connect to chat
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

// Send message
socket.emit('send_message', {
  receiverId: 1,
  message: 'Hello from client!'
});
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin request security
- **File Upload Security**: Type and size validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **Password Hashing**: bcrypt for secure storage

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connections
- **Caching Strategy**: Redis integration ready
- **Code Splitting**: Lazy loading for better performance
- **Image Optimization**: Automatic image compression
- **CDN Ready**: Static asset optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@almahbub.com
- Documentation: [Project Wiki]
- Issues: [GitHub Issues]

## 🎉 Acknowledgments

- Built with modern web technologies
- Designed for scalability and performance
- Production-ready with comprehensive error handling
- Mobile-first responsive design
- Accessibility compliant
- Security focused

---

**Built with ❤️ by MiniMax Agent**

*Almahbub International - Connecting Businesses Through Intelligent Procurement*