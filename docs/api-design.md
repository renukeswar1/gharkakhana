# 🔌 API Design - GharKaKhana

## API Architecture

We use **AWS API Gateway** with **Lambda** functions for a serverless API.

```
API Gateway (REST)
├── /auth             # Authentication endpoints
├── /users            # User management
├── /chefs            # Chef management
├── /menus            # Menu management
├── /orders           # Order management
├── /search           # Search endpoints
├── /reviews          # Review management
└── /admin            # Admin endpoints

API Gateway (WebSocket)
└── /ws               # Real-time updates
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user (customer or chef)

**Request:**
```json
{
  "email": "user@email.com",
  "phone": "+91XXXXXXXXXX",
  "password": "securePassword123",
  "name": "User Name",
  "role": "CUSTOMER" | "CHEF"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@email.com",
    "role": "CUSTOMER",
    "token": "jwt-token"
  }
}
```

### POST /auth/login
Login user

**Request:**
```json
{
  "email": "user@email.com",
  "password": "securePassword123"
}
```

### POST /auth/verify-otp
Verify phone number with OTP

### POST /auth/forgot-password
### POST /auth/reset-password

---

## User Endpoints

### GET /users/me
Get current user profile

### PUT /users/me
Update user profile

### POST /users/me/addresses
Add delivery address

**Request:**
```json
{
  "label": "Home",
  "line1": "123 Street Name",
  "line2": "Apartment 4B",
  "city": "Hyderabad",
  "state": "Telangana",
  "pincode": "500001",
  "latitude": 17.385044,
  "longitude": 78.486671,
  "isDefault": true
}
```

### PUT /users/me/addresses/:addressId
### DELETE /users/me/addresses/:addressId

---

## Chef Endpoints

### POST /chefs/register
Register as a home chef

**Request:**
```json
{
  "businessName": "Amma's Kitchen",
  "bio": "Cooking authentic Andhra meals for 20+ years",
  "specialties": ["South Indian", "Andhra", "Biryani"],
  "cuisines": ["Indian", "South Indian"],
  "address": {
    "line1": "456 Chef Street",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500001",
    "latitude": 17.385044,
    "longitude": 78.486671
  },
  "serviceRadius": 5
}
```

### GET /chefs/me
Get chef profile (for logged in chef)

### PUT /chefs/me
Update chef profile

### POST /chefs/me/verification
Submit verification documents

**Request (multipart/form-data):**
```
aadhaar: File
pan: File
fssai: File (optional)
kitchenPhotos: File[]
cookingVideo: File (optional)
```

### GET /chefs/me/verification
Get verification status

### PUT /chefs/me/availability
Update availability status

**Request:**
```json
{
  "isAvailable": true,
  "workingHours": {
    "monday": { "open": "09:00", "close": "21:00" },
    "tuesday": { "open": "09:00", "close": "21:00" }
  }
}
```

### GET /chefs/:chefId
Get chef public profile

**Response:**
```json
{
  "success": true,
  "data": {
    "chefId": "uuid",
    "businessName": "Amma's Kitchen",
    "profileImage": "https://...",
    "bio": "Cooking authentic Andhra meals...",
    "specialties": ["South Indian", "Andhra"],
    "rating": 4.5,
    "totalReviews": 125,
    "totalOrders": 500,
    "isAvailable": true,
    "distance": 2.5,
    "address": {
      "city": "Hyderabad",
      "area": "Madhapur"
    }
  }
}
```

### GET /chefs/:chefId/menus
Get chef's menus (with optional date filter)

**Query Parameters:**
- `date`: YYYY-MM-DD (default: today)
- `mealType`: LUNCH | DINNER

### GET /chefs/:chefId/reviews
Get chef reviews

**Query Parameters:**
- `limit`: number (default: 10)
- `lastKey`: pagination key

---

## Menu Endpoints

### POST /menus
Create daily menu (Chef only)

**Request:**
```json
{
  "date": "2024-01-15",
  "mealType": "LUNCH",
  "items": [
    {
      "name": "Hyderabadi Chicken Biryani",
      "description": "Authentic dum biryani with tender chicken",
      "category": "Main Course",
      "cuisine": "Hyderabadi",
      "price": 250,
      "discountedPrice": 220,
      "quantity": 20,
      "unit": "plate",
      "servingSize": "1 person",
      "isVeg": false,
      "spiceLevel": "Medium",
      "allergens": ["Dairy", "Nuts"],
      "images": ["base64-or-presigned-url"],
      "preparationTime": 30,
      "availableFrom": "12:00",
      "availableTill": "15:00"
    }
  ],
  "orderCutoffTime": "11:00",
  "deliveryStartTime": "12:00",
  "deliveryEndTime": "14:00",
  "packagingType": "STEEL_BOX",
  "packagingDeposit": 50,
  "minimumOrderAmount": 150,
  "deliveryFee": 30,
  "freeDeliveryAbove": 500
}
```

### GET /menus/:menuId
Get menu details

### PUT /menus/:menuId
Update menu

### DELETE /menus/:menuId
Delete menu (soft delete)

### PUT /menus/:menuId/items/:itemId/availability
Update item availability

**Request:**
```json
{
  "isAvailable": false,
  "remainingQuantity": 0
}
```

### GET /menus/my
Get all my menus (Chef only)

**Query Parameters:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `status`: ACTIVE | COMPLETED | CANCELLED

---

## Search Endpoints

### GET /search/chefs
Search nearby chefs

**Query Parameters:**
- `lat`: latitude (required)
- `lng`: longitude (required)
- `radius`: km (default: 5)
- `cuisine`: filter by cuisine
- `isVeg`: true/false
- `rating`: minimum rating
- `sortBy`: distance | rating | orders

**Response:**
```json
{
  "success": true,
  "data": {
    "chefs": [
      {
        "chefId": "uuid",
        "businessName": "Amma's Kitchen",
        "profileImage": "https://...",
        "rating": 4.5,
        "totalReviews": 125,
        "distance": 1.2,
        "cuisines": ["South Indian", "Andhra"],
        "isAvailable": true,
        "todaysMenuAvailable": true,
        "minimumOrderAmount": 150
      }
    ],
    "total": 15,
    "hasMore": true
  }
}
```

### GET /search/menus
Search menus/dishes

**Query Parameters:**
- `q`: search query (dish name)
- `lat`: latitude (required)
- `lng`: longitude (required)
- `radius`: km (default: 5)
- `date`: YYYY-MM-DD (default: today)
- `mealType`: LUNCH | DINNER
- `isVeg`: true/false
- `maxPrice`: maximum price
- `sortBy`: relevance | price | rating | distance

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "menuId": "uuid",
        "itemId": "uuid",
        "name": "Hyderabadi Chicken Biryani",
        "description": "Authentic dum biryani...",
        "price": 220,
        "originalPrice": 250,
        "image": "https://...",
        "isVeg": false,
        "chef": {
          "chefId": "uuid",
          "businessName": "Amma's Kitchen",
          "rating": 4.5,
          "distance": 1.2
        },
        "remainingQuantity": 15,
        "availableTill": "15:00"
      }
    ],
    "total": 25,
    "hasMore": true
  }
}
```

### GET /search/suggestions
Get search suggestions

**Query Parameters:**
- `q`: partial query

**Response:**
```json
{
  "success": true,
  "data": {
    "dishes": ["Biryani", "Butter Chicken", "Butter Naan"],
    "chefs": ["Amma's Kitchen", "Annapurna Foods"],
    "cuisines": ["North Indian", "South Indian"]
  }
}
```

---

## Order Endpoints

### POST /orders
Create new order

**Request:**
```json
{
  "menuId": "uuid",
  "items": [
    { "itemId": "uuid", "quantity": 2 },
    { "itemId": "uuid", "quantity": 1 }
  ],
  "deliveryAddressId": "uuid",
  "deliverySlot": {
    "date": "2024-01-15",
    "startTime": "12:30",
    "endTime": "13:00"
  },
  "specialInstructions": "Less spicy please",
  "paymentMethod": "UPI"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "GKK-20240115-001234",
    "status": "PENDING_PAYMENT",
    "pricing": {
      "subtotal": 520,
      "packagingDeposit": 100,
      "deliveryFee": 30,
      "taxes": 26,
      "total": 676
    },
    "paymentDetails": {
      "razorpayOrderId": "order_xxx",
      "amount": 67600,
      "currency": "INR"
    }
  }
}
```

### POST /orders/:orderId/confirm-payment
Confirm payment after Razorpay success

**Request:**
```json
{
  "razorpayPaymentId": "pay_xxx",
  "razorpayOrderId": "order_xxx",
  "razorpaySignature": "signature"
}
```

### GET /orders
Get my orders (Customer or Chef)

**Query Parameters:**
- `status`: ACTIVE | COMPLETED | CANCELLED
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `limit`: number
- `lastKey`: pagination key

### GET /orders/:orderId
Get order details

### PUT /orders/:orderId/status
Update order status (Chef only)

**Request:**
```json
{
  "status": "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED"
}
```

### POST /orders/:orderId/cancel
Cancel order

**Request:**
```json
{
  "reason": "Changed my mind"
}
```

### POST /orders/:orderId/steel-box-return
Mark steel box as returned

---

## Review Endpoints

### POST /reviews
Create review

**Request:**
```json
{
  "orderId": "uuid",
  "rating": 5,
  "foodRating": 5,
  "hygieneRating": 5,
  "packagingRating": 4,
  "deliveryRating": 5,
  "title": "Amazing home-cooked taste!",
  "comment": "The biryani was absolutely delicious...",
  "images": ["base64-or-presigned-url"]
}
```

### GET /reviews/:reviewId
### PUT /reviews/:reviewId
### DELETE /reviews/:reviewId

### POST /reviews/:reviewId/response
Chef responds to review

**Request:**
```json
{
  "comment": "Thank you so much!"
}
```

### POST /reviews/:reviewId/helpful
Mark review as helpful

---

## Upload Endpoints

### POST /uploads/presigned-url
Get presigned URL for file upload

**Request:**
```json
{
  "fileType": "image/jpeg",
  "purpose": "PROFILE_IMAGE" | "MENU_IMAGE" | "REVIEW_IMAGE" | "VERIFICATION_DOC"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "fileUrl": "https://cdn.gharkakhana.com/...",
    "expiresIn": 3600
  }
}
```

---

## Admin Endpoints

### GET /admin/chefs/pending-verification
Get chefs pending verification

### PUT /admin/chefs/:chefId/verify
Verify/reject chef

**Request:**
```json
{
  "action": "APPROVE" | "REJECT",
  "notes": "Kitchen photos show good hygiene"
}
```

### GET /admin/orders
Get all orders (with filters)

### GET /admin/analytics
Get platform analytics

---

## WebSocket API

### Connection
```
wss://api.gharkakhana.com/ws?token=jwt-token
```

### Events

**Server → Client:**
```json
{
  "type": "ORDER_STATUS_UPDATE",
  "data": {
    "orderId": "uuid",
    "status": "PREPARING",
    "timestamp": "2024-01-15T11:00:00Z"
  }
}
```

```json
{
  "type": "NEW_ORDER",
  "data": {
    "orderId": "uuid",
    "customerName": "John",
    "items": [...],
    "total": 676
  }
}
```

```json
{
  "type": "MENU_ITEM_SOLD_OUT",
  "data": {
    "menuId": "uuid",
    "itemId": "uuid",
    "itemName": "Chicken Biryani"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not authorized |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| /auth/* | 10 requests/minute |
| /search/* | 60 requests/minute |
| /orders | 30 requests/minute |
| Other | 100 requests/minute |

---

## Pagination

All list endpoints support cursor-based pagination:

**Request:**
```
GET /orders?limit=10&lastKey=encoded-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "lastKey": "encoded-key-for-next-page",
    "hasMore": true
  }
}
```
