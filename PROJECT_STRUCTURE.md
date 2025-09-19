# E-Commerce Furniture Website - Complete Project Structure

## Root Level Files
```
├── .env.local                          # Environment variables
├── .gitignore                          # Git ignore rules
├── eslint.config.mjs                   # ESLint configuration
├── generatePPT.js                      # PowerPoint presentation generator
├── next-env.d.ts                       # Next.js TypeScript declarations
├── next.config.ts                      # Next.js configuration
├── overview.md                         # Project overview documentation
├── package.json                        # Project dependencies and scripts
├── package-lock.json                   # Locked dependency versions
├── postcss.config.mjs                  # PostCSS configuration
├── README.md                           # Project documentation
├── tsconfig.json                       # TypeScript configuration
└── E-Commerce-Furniture-Website-Presentation.pptx  # Generated presentation
```

## Source Code Structure (`src/`)

### 📁 **App Directory (`src/app/`)**
Next.js 13+ App Router structure with file-based routing

#### Core App Files
```
src/app/
├── favicon.ico                         # Website favicon
├── globals.css                         # Global CSS styles
├── layout.tsx                          # Root layout component
└── page.tsx                            # Homepage component
```

#### Shop Routes (`src/app/(shop)/`)
Main e-commerce functionality grouped under shop route
```
src/app/(shop)/
├── [slug]/
│   └── page.tsx                        # Dynamic category pages
├── cart/
│   └── page.tsx                        # Shopping cart page
├── checkout/
│   ├── page.tsx                        # Checkout main page
│   └── payment/
│       └── page.tsx                    # Payment processing page
├── collections/
│   └── [slug]/
│       └── page.tsx                    # Dynamic collection pages
├── inspiration/
│   ├── page.tsx                        # Inspiration gallery page
│   └── [id]/
│       └── page.tsx                    # Individual inspiration page
├── order-success/
│   └── page.tsx                        # Order confirmation page
├── orders/
│   ├── page.tsx                        # Order history page
│   └── track/
│       └── page.tsx                    # Order tracking page
├── products/
│   ├── page.tsx                        # Products listing page
│   └── [id]/
│       └── page.tsx                    # Individual product page
├── search/
│   └── page.tsx                        # Search results page
└── wishlist/
    └── page.tsx                        # User wishlist page
```

#### Authentication (`src/app/auth/`)
```
src/app/auth/
└── signin/
    └── page.tsx                        # Sign-in page
```

#### User Profile (`src/app/profile/`)
```
src/app/profile/
├── layout.tsx                          # Profile layout wrapper
├── page.tsx                            # Profile main page
└── address/
    └── page.tsx                        # Address management page
```

#### API Routes (`src/app/api/`)
Backend API endpoints using Next.js API routes

##### Address Management
```
src/app/api/address/
├── route.ts                            # CRUD operations for addresses
└── [id]/
    └── route.ts                        # Individual address operations
```

##### Authentication System
```
src/app/api/auth/
├── check-email-exists/
│   └── route.js                        # Email existence validation
├── google/
│   └── route.js                        # Google OAuth integration
├── login/
│   └── route.js                        # User login endpoint
├── logout/
│   └── route.js                        # User logout endpoint
├── me/
│   └── route.js                        # Current user info
├── refresh/
│   └── route.js                        # Token refresh endpoint
├── register/
│   └── route.js                        # User registration endpoint
├── reset-password/
│   └── route.js                        # Password reset endpoint
├── send-reset-code/
│   └── route.js                        # Send password reset code
└── verify-reset-code/
    └── route.js                        # Verify reset code
```

##### Shopping Cart
```
src/app/api/cart/
├── route.ts                            # Cart CRUD operations
└── check/
    └── route.ts                        # Cart validation
```

##### Product Categories
```
src/app/api/categories/
├── route.ts                            # Category management
└── [slug]/
    └── route.ts                        # Individual category operations
```

##### Checkout Process
```
src/app/api/checkout/
└── route.ts                            # Checkout processing
```

##### Inspiration Content
```
src/app/api/inspirations/
├── route.ts                            # Inspiration CRUD operations
├── [slug]/
│   └── route.ts                        # Individual inspiration
└── relatedProduct/
    └── route.ts                        # Related products for inspiration
```

##### Order Management
```
src/app/api/orders/
├── route.ts                            # Order CRUD operations
├── [id]/
│   ├── route.ts                        # Individual order operations
│   ├── cancel/                         # Order cancellation
│   └── status/                         # Order status updates
└── number/
    └── [orderNumber]/                  # Order lookup by number
```

##### Payment Processing
```
src/app/api/payment/
└── route.ts                            # Payment processing
```

##### Product Management
```
src/app/api/products/
├── route.ts                            # Product CRUD operations
├── [id]/
│   └── route.ts                        # Individual product operations
└── showcase/
    ├── route.ts                        # Featured products
    └── [id]/                           # Individual showcase product
```

##### Review System
```
src/app/api/reviews/
├── route.ts                            # Review CRUD operations
├── [reviewId]/
│   └── route.ts                        # Individual review operations
├── report/
│   └── route.ts                        # Review reporting
└── vote/
    └── route.ts                        # Review voting system
```

##### Search Functionality
```
src/app/api/search/
└── route.ts                            # Product search endpoint
```

##### Subcategories
```
src/app/api/subcategories/
└── route.ts                            # Subcategory management
```

##### File Upload
```
src/app/api/upload/
└── route.ts                            # File upload handling
```

##### User Management
```
src/app/api/user/
└── profile/
    └── route.ts                        # User profile management
```

##### Wishlist
```
src/app/api/wishlist/
├── route.ts                            # Wishlist CRUD operations
└── check/
    └── route.ts                        # Wishlist item validation
```

### 📁 **Components (`src/components/`)**
Reusable UI components organized by functionality

#### Collections
```
src/components/collections/
└── CategoryGrid.tsx                    # Category grid display
```

#### Debug Tools
```
src/components/debugs/
└── DebugCheckoutFlow.tsx               # Checkout flow debugging
```

#### Filtering
```
src/components/filter/
└── FilterSidebar.tsx                   # Product filtering sidebar
```

#### Event Handlers
```
src/components/handler/
└── ScrollHandler.tsx                   # Scroll behavior management
```

#### Homepage Components
```
src/components/homepage/
├── CategoryGrid.tsx                    # Homepage category grid
├── HeroBanner.tsx                      # Main hero banner
├── NewsletterSignup.tsx                # Newsletter subscription
├── ProductShowcase.tsx                 # Featured products display
└── RoomInspiration.tsx                 # Room inspiration section
```

#### Inspiration Components
```
src/components/inspiration/
├── CategoryGrid.tsx                    # Inspiration category grid
├── InspirationBanner.tsx               # Inspiration page banner
├── MoreInspirationIdeas.tsx            # Additional inspiration ideas
├── NewArrivals.tsx                     # New arrival products
└── RelatedProducts.tsx                 # Related product suggestions
```

#### Modal Components
```
src/components/models/
├── AuthModal.jsx                       # Authentication modal
└── CancelOrderModal.tsx                # Order cancellation modal
```

#### Product Components
```
src/components/product/
├── ProductCard.tsx                     # Individual product card
├── ProductDetails.tsx                  # Product detail view
├── ProductGrid.tsx                     # Product grid layout
├── ProductImageGallery.tsx             # Product image carousel
└── ProductReviews.tsx                  # Product review section
```

#### Skeleton Loaders
```
src/components/sceleton/
└── GridSkeleton.tsx                    # Grid loading skeleton
```

#### Search Components
```
src/components/search/
├── SearchBar.tsx                       # Search input component
└── SearchModal.jsx                     # Search modal overlay
```

#### State Components
```
src/components/state/
├── EmptyState.tsx                      # Empty state display
└── SearchEmptyState.tsx                # Search no results state
```

#### UI Components
```
src/components/ui/
├── Avatar.jsx                          # User avatar component
├── ConfettiEffect.tsx                  # Celebration animation
├── ErrorMessage.jsx                    # Error display component
├── Footer.tsx                          # Website footer
├── Header.jsx                          # Website header/navigation
├── InputField.jsx                      # Form input component
├── PriceSummaryCard.tsx                # Price breakdown card
├── Sidebar.jsx                         # Navigation sidebar
└── UserDropdown.jsx                    # User menu dropdown
```

### 📁 **Context (`src/context/`)**
React Context providers for global state management
```
src/context/
├── AuthContext.js                      # Authentication context
└── Providers.js                        # Combined context providers
```

### 📁 **Hooks (`src/hooks/`)**
Custom React hooks for reusable logic
```
src/hooks/
└── useCurrentUser.js                   # Current user data hook
```

### 📁 **Library (`src/lib/`)**
Utility libraries and configurations

#### Core Libraries
```
src/lib/
├── auth.js                             # Authentication utilities
├── cacheManager.js                     # Cache management
├── cloudinary.js                       # Image upload service
├── dbConnect.ts                        # Database connection
├── didumean.js                         # Search suggestions
├── firebase.js                         # Firebase configuration
├── searchService.js                    # Search functionality
├── suggestions.js                      # Search suggestions
└── synonyms.js                         # Search synonyms
```

#### Middleware
```
src/lib/middleware/
└── auth.ts                             # Authentication middleware
```

### 📁 **Models (`src/models/`)**
Database schema definitions using Mongoose
```
src/models/
├── Address.ts                          # User address schema
├── Cart.ts                             # Shopping cart schema
├── category.ts                         # Product category schema
├── CategoryImage.js                    # Category image schema
├── Checkout.ts                         # Checkout process schema
├── Inspiration.ts                      # Inspiration content schema
├── new.txt                             # Notes for new models
├── Order.ts                            # Order management schema
├── Payment.ts                          # Payment processing schema
├── product.ts                          # Product catalog schema
├── Review.ts                           # Product review schema
├── subcategory.ts                      # Product subcategory schema
├── User.ts                             # User account schema
├── UserVote.ts                         # Review voting schema
└── Wishlist.ts                         # User wishlist schema
```

### 📁 **Providers (`src/provider/`)**
React context and state providers
```
src/provider/
├── StoreProvider.tsx                   # Zustand store provider
└── ToastProvider.jsx                   # Toast notification provider
```

### 📁 **Stores (`src/stores/`)**
Zustand state management stores
```
src/stores/
├── addressStore.ts                     # Address management state
├── cartStore.ts                        # Shopping cart state
├── checkoutStore.ts                    # Checkout process state
├── globalStoreManager.ts               # Global state coordination
├── homeStore.ts                        # Homepage state
├── orderStore.ts                       # Order management state
├── productStore.ts                     # Product catalog state
├── profileStore.ts                     # User profile state
├── reviewStore.ts                      # Review system state
├── searchStore.ts                      # Search functionality state
└── wishlistStore.ts                    # Wishlist management state
```

### 📁 **Types (`src/types/`)**
TypeScript type definitions
```
src/types/
├── Product.ts                          # Product-related types
└── props.ts                            # Component prop types
```

### 📁 **Utils (`src/utils/`)**
Utility functions and helpers
```
src/utils/
├── fetchWithCredentials.ts             # Authenticated API calls
├── formatters.js                       # Data formatting utilities
├── handleAuthError.js                  # Authentication error handling
├── orderUtils.ts                       # Order processing utilities
├── useMediaQuery.js                    # Responsive design hook
└── validators.js                       # Form validation utilities
```

## 📁 **Public Assets (`public/`)**
Static files served directly by Next.js
```
public/
├── file.svg                            # File icon
├── globe.svg                           # Globe icon
├── logo.png                            # Website logo
├── next.svg                            # Next.js logo
├── offer.jpeg                          # Promotional image
├── user.png                            # Default user avatar
├── vercel.svg                          # Vercel logo
├── window.svg                          # Window icon
└── homepage/
    └── baner/                          # Homepage banner images
```

## 📁 **Documentation (`overview/`)**
Project documentation and content
```
overview/
├── 01_title_page.txt                   # Project title page
├── 02_proforma_approval.txt             # Approval documentation
├── 03_index.txt                        # Table of contents
├── 04_introduction.txt                 # Project introduction
├── 05_objectives.txt                   # Project objectives
├── 06_problem_definition.txt           # Problem statement
├── 07_proposed_system.txt              # System proposal
├── 08_requirements.txt                 # System requirements
├── 09_system_architecture.txt          # Architecture documentation
├── 10_database_design.txt              # Database design
├── 11_ui_design.txt                    # UI/UX design
├── 12_implementation.txt               # Implementation details
├── 13_testing_security.txt             # Testing and security
├── 14_expected_outcome.txt             # Expected outcomes
├── 15_references_conclusion.txt        # References and conclusion
└── all.txt                             # Combined documentation
```

## Technology Stack Summary

### Frontend
- **Next.js 15.4.6** - React framework with SSR
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Zustand** - State management
- **Framer Motion** - Animations

### Backend
- **Node.js** - Server runtime
- **Next.js API Routes** - Backend API
- **MongoDB 8.17.1** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication

### Additional Tools
- **Cloudinary** - Image management
- **Firebase** - Additional services
- **bcrypt** - Password hashing
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## Key Features Implemented
- ✅ User Authentication & Authorization
- ✅ Product Catalog Management
- ✅ Shopping Cart & Checkout
- ✅ Order Management & Tracking
- ✅ User Profile & Address Management
- ✅ Product Reviews & Ratings
- ✅ Wishlist Functionality
- ✅ Search & Filtering
- ✅ Responsive Design
- ✅ Admin Dashboard Features
- ✅ Payment Processing
- ✅ Image Upload & Management
- ✅ Room Inspiration Gallery

This structure represents a complete, production-ready e-commerce furniture website built with modern web technologies and best practices.