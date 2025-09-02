# TindiBandi - Food Delivery System Architecture

## System Overview
TindiBandi is a full-stack web application for food delivery service built using Node.js, Express.js, MongoDB, and Socket.IO for real-time features.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Web Pages (Static HTML/CSS/JS)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   Customer  │ │    Admin    │ │  Real-time  │               │
│  │  Interface  │ │   Panel     │ │  Features   │               │
│  │             │ │             │ │             │               │
│  │ • Home      │ │ • Dashboard │ │ • Order     │               │
│  │ • Menu      │ │ • Menu Mgmt │ │   Tracking  │               │
│  │ • Cart      │ │ • Orders    │ │ • Live Chat │               │
│  │ • Profile   │ │ • Analytics │ │             │               │
│  │ • Orders    │ │             │ │             │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                            │
                     HTTP/HTTPS │ WebSocket
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                      Node.js Server                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                Express.js Framework                     │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │  │ Middleware  │ │ API Routes  │ │  Socket.IO      │   │   │
│  │  │             │ │             │ │  Real-time      │   │   │
│  │  │ • CORS      │ │ • Auth      │ │                 │   │   │
│  │  │ • Auth      │ │ • Menu      │ │ • Order Status  │   │   │
│  │  │ • Static    │ │ • Order     │ │ • Live Updates  │   │   │
│  │  │   Files     │ │ • Admin     │ │ • Notifications │   │   │
│  │  │ • JSON      │ │ • Chatbot   │ │                 │   │   │
│  │  │   Parser    │ │             │ │                 │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                         MongoDB │ Connection
                            │
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                    MongoDB Database                            │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   Users     │ │ Menu Items  │ │   Orders    │               │
│  │ Collection  │ │ Collection  │ │ Collection  │               │
│  │             │ │             │ │             │               │
│  │ • Profile   │ │ • Name      │ │ • Order ID  │               │
│  │ • Auth      │ │ • Category  │ │ • User Info │               │
│  │ • History   │ │ • Price     │ │ • Items     │               │
│  │             │ │ • Images    │ │ • Status    │               │
│  │             │ │ • Metadata  │ │ • Payment   │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Client Layer
**Frontend Web Pages** - Static HTML pages with JavaScript for dynamic functionality
- **Customer Interface**: Home, Menu Browse, Shopping Cart, User Profile, Order History
- **Admin Panel**: Dashboard, Menu Management, Order Processing
- **Real-time Features**: Live order tracking, notifications

### 2. Application Layer
**Node.js Server** running on Express.js framework

#### Core Components:
- **HTTP Server**: Handles REST API requests
- **WebSocket Server**: Manages real-time communications
- **Authentication System**: JWT-based user authentication
- **Route Handlers**: Modular API endpoints

#### API Routes:
```
/api/auth     - User authentication (login/register)
/api/menu     - Menu items management
/api/order    - Order processing and management  
/api/admin    - Administrative functions
/api/chatbot  - Customer service chatbot
```

#### Middleware Stack:
- CORS for cross-origin requests
- JWT authentication middleware
- JSON body parser
- Static file serving
- Error handling

### 3. Data Layer
**MongoDB Database** with three main collections:

#### Database Schema:
```javascript
Users {
  username: String,
  firstName: String,
  lastName: String,
  email: String,
  passwordHash: String,
  profile: Object,
  timestamps: Date
}

MenuItems {
  name: String,
  category: String,
  price: Number,
  image: String,
  veg: Boolean,
  available: Boolean,
  timestamps: Date
}

Orders {
  orderId: Number,
  userId: ObjectId,
  cart: Array,
  total: Number,
  status: String,
  deliveryAddress: Object,
  timestamps: Date
}
```

## Key Features

### Real-time Functionality
- **Order Tracking**: Live status updates using Socket.IO
- **Admin Notifications**: Instant new order alerts
- **Customer Updates**: Real-time delivery status

### Security Features
- **Authentication**: JWT token-based authentication
- **Password Security**: Bcrypt hashing
- **Data Validation**: Mongoose schema validation
- **CORS Protection**: Cross-origin request filtering

### Scalability Features
- **Database Indexing**: Optimized query performance
- **Modular Architecture**: Separated concerns and routes
- **Environment Configuration**: Development/Production settings

## Data Flow

### User Registration/Login
1. Client submits credentials → Auth API
2. Server validates → Database query
3. JWT token generated → Client receives token
4. Token used for authenticated requests

### Order Processing
1. Client adds items to cart → Menu API
2. Checkout initiated → Order API
3. Order stored in database → Order ID generated
4. Real-time updates sent via WebSocket
5. Admin receives order notification

### Menu Management (Admin)
1. Admin authenticates → Admin API
2. CRUD operations on menu items
3. Database updates reflected immediately
4. Client sees updated menu

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO
- **Security**: bcryptjs for password hashing

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Communication**: Fetch API for REST, Socket.IO client

### Development Tools
- **Environment Management**: dotenv
- **Cross-Origin**: CORS middleware
- **Debugging**: Built-in debugging tools

## Deployment Architecture

### Environment Configuration
- **Development**: Local MongoDB, localhost server
- **Production**: Cloud MongoDB (Atlas), cloud hosting
- **Environment Variables**: Database URLs, JWT secrets, API keys

### Server Configuration
- **Port**: Configurable (default: 3001)
- **Host**: 0.0.0.0 for cloud deployment
- **Static Files**: Served from public directory
- **API Base**: /api/* for all backend routes

## Security Considerations
- Password hashing with bcrypt
- JWT token expiration and validation
- Input sanitization and validation
- CORS configuration for secure origins
- Environment-based configuration management

## Performance Optimizations
- Database indexing for frequently queried fields
- Static file caching
- Connection pooling for MongoDB
- Efficient query patterns with Mongoose

This architecture provides a robust, scalable foundation for a food delivery application with real-time features and secure user management.
