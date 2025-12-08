# 🍛 GharKaKhana - Home Cooked Food Delivery Platform

> "Ghar Ka Khana" means "Home Cooked Food" in Hindi

## 🎯 Vision

Connect home chefs (housewives) with customers who want fresh, hygienic, home-cooked food instead of restaurant food from Swiggy/Zomato.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMERS                                       │
│                    (Mobile App / Web Browser)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFRONT CDN                                     │
│                     (Static Assets + API Caching)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────────────┐
│         NEXT.JS APP           │   │         API GATEWAY                    │
│    (SSR + Static Pages)       │   │    (REST + WebSocket APIs)            │
│    - Customer Portal          │   └───────────────────────────────────────┘
│    - Chef Dashboard           │                   │
│    - Admin Panel              │                   ▼
└───────────────────────────────┘   ┌───────────────────────────────────────┐
                                    │         AWS LAMBDA                     │
                                    │    (Serverless Functions)              │
                                    │    - User Management                   │
                                    │    - Menu Management                   │
                                    │    - Order Processing                  │
                                    │    - Search & Discovery                │
                                    │    - Notifications                     │
                                    └───────────────────────────────────────┘
                                                    │
                    ┌───────────────┬───────────────┼───────────────┬─────────┐
                    ▼               ▼               ▼               ▼         ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ ┌────────┐
            │  DYNAMODB   │ │     S3      │ │ OPENSEARCH  │ │ COGNITO  │ │  SES   │
            │  (Primary   │ │  (Images,   │ │  (Menu      │ │  (Auth)  │ │(Email) │
            │   Data)     │ │   Docs)     │ │   Search)   │ │          │ │        │
            └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ └────────┘
```

## 📁 Project Structure

```
gharkakhana/
├── apps/
│   └── web/                    # Next.js Frontend Application
│       ├── app/                # App Router pages
│       ├── components/         # React components
│       ├── lib/                # Utility functions
│       └── styles/             # CSS/Tailwind styles
├── packages/
│   ├── api/                    # Lambda functions
│   ├── database/               # DynamoDB schema & utilities
│   └── shared/                 # Shared types and utilities
├── infrastructure/
│   └── cdk/                    # AWS CDK Infrastructure
├── docs/
│   ├── database-design.md      # Database schema documentation
│   ├── api-design.md           # API endpoints documentation
│   └── user-flows.md           # User journey documentation
└── scripts/                    # Utility scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

### Installation

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cd infrastructure/cdk && cdk bootstrap

# Deploy infrastructure
npm run deploy:infra

# Start development server
npm run dev
```

## 📋 Features

### For Home Chefs
- ✅ Registration with verification documents
- ✅ Daily menu publishing
- ✅ Order management
- ✅ Earnings dashboard
- ✅ Customer reviews

### For Customers
- ✅ Location-based chef discovery
- ✅ Search by dish or chef name
- ✅ View daily menus
- ✅ Place orders
- ✅ Track order status
- ✅ Rate and review

## 📖 Documentation

- [Database Design](./docs/database-design.md)
- [API Design](./docs/api-design.md)
- [User Flows](./docs/user-flows.md)

## 📄 License

MIT License
