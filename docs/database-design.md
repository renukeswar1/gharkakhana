# 📊 Database Design - GharKaKhana

## DynamoDB Table Design

DynamoDB is a NoSQL database that requires careful access pattern analysis. We use a **Single Table Design** for efficiency.

## Access Patterns Analysis

| # | Access Pattern | Operation |
|---|---------------|-----------|
| 1 | Get user by ID | Query PK=USER#userId |
| 2 | Get chef by ID | Query PK=CHEF#chefId |
| 3 | Get chef's verification status | Query PK=CHEF#chefId, SK=VERIFICATION |
| 4 | Get all menus by chef for a day | Query PK=CHEF#chefId, SK begins_with MENU#date |
| 5 | Get menu item details | Query PK=MENU#menuId |
| 6 | Search chefs by location (geohash) | Query GSI1 PK=GEO#geohash |
| 7 | Search menus by dish name | OpenSearch (full-text) |
| 8 | Get orders by customer | Query GSI2 PK=CUSTOMER#customerId |
| 9 | Get orders by chef | Query GSI3 PK=CHEF#chefId |
| 10 | Get order details | Query PK=ORDER#orderId |
| 11 | Get reviews for chef | Query PK=CHEF#chefId, SK begins_with REVIEW# |
| 12 | Get daily menus in area | Query GSI1 PK=GEO#geohash, SK begins_with date |

---

## Main Table: `GharKaKhana`

### Primary Key Structure
- **PK (Partition Key)**: Entity identifier
- **SK (Sort Key)**: Sub-entity or metadata

### Global Secondary Indexes (GSIs)

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| GSI1 | GSI1PK | GSI1SK | Geo-location queries |
| GSI2 | GSI2PK | GSI2SK | Customer orders |
| GSI3 | GSI3PK | GSI3SK | Chef orders + menus by date |
| GSI4 | GSI4PK | GSI4SK | Menu search by dish name |

---

## Entity Schemas

### 1. User Entity (Customer)

```json
{
  "PK": "USER#<userId>",
  "SK": "PROFILE",
  "entityType": "USER",
  "userId": "uuid",
  "email": "user@email.com",
  "phone": "+91XXXXXXXXXX",
  "name": "Customer Name",
  "profileImage": "s3://bucket/users/userId/profile.jpg",
  "addresses": [
    {
      "addressId": "uuid",
      "label": "Home",
      "line1": "123 Street Name",
      "line2": "Apartment 4B",
      "city": "Hyderabad",
      "state": "Telangana",
      "pincode": "500001",
      "latitude": 17.385044,
      "longitude": 78.486671,
      "geohash": "tdr1yp",
      "isDefault": true
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  
  "GSI2PK": "USER#<userId>",
  "GSI2SK": "PROFILE"
}
```

### 2. Chef Entity (Home Chef)

```json
{
  "PK": "CHEF#<chefId>",
  "SK": "PROFILE",
  "entityType": "CHEF",
  "chefId": "uuid",
  "userId": "uuid (links to USER entity)",
  "email": "chef@email.com",
  "phone": "+91XXXXXXXXXX",
  "name": "Chef Name",
  "businessName": "Amma's Kitchen",
  "profileImage": "s3://bucket/chefs/chefId/profile.jpg",
  "coverImage": "s3://bucket/chefs/chefId/cover.jpg",
  "bio": "Cooking authentic Andhra meals for 20+ years",
  "specialties": ["South Indian", "Andhra", "Biryani"],
  "cuisines": ["Indian", "South Indian"],
  "address": {
    "line1": "456 Chef Street",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500001",
    "latitude": 17.385044,
    "longitude": 78.486671,
    "geohash": "tdr1yp"
  },
  "serviceRadius": 5,
  "rating": 4.5,
  "totalReviews": 125,
  "totalOrders": 500,
  "status": "ACTIVE",
  "verificationStatus": "VERIFIED",
  "isAvailable": true,
  "workingHours": {
    "monday": { "open": "09:00", "close": "21:00" },
    "tuesday": { "open": "09:00", "close": "21:00" }
  },
  "bankDetails": {
    "accountNumber": "encrypted",
    "ifscCode": "encrypted",
    "accountHolderName": "Chef Name"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  
  "GSI1PK": "GEO#tdr1yp",
  "GSI1SK": "CHEF#<chefId>",
  "GSI3PK": "CHEF#<chefId>",
  "GSI3SK": "PROFILE"
}
```

### 3. Chef Verification Entity

```json
{
  "PK": "CHEF#<chefId>",
  "SK": "VERIFICATION",
  "entityType": "CHEF_VERIFICATION",
  "chefId": "uuid",
  "documents": [
    {
      "type": "AADHAAR",
      "documentUrl": "s3://bucket/chefs/chefId/docs/aadhaar.pdf",
      "status": "VERIFIED",
      "verifiedAt": "2024-01-02T00:00:00Z"
    },
    {
      "type": "PAN",
      "documentUrl": "s3://bucket/chefs/chefId/docs/pan.pdf",
      "status": "VERIFIED"
    },
    {
      "type": "FSSAI",
      "documentUrl": "s3://bucket/chefs/chefId/docs/fssai.pdf",
      "status": "PENDING"
    },
    {
      "type": "KITCHEN_PHOTOS",
      "documentUrl": "s3://bucket/chefs/chefId/docs/kitchen/",
      "status": "VERIFIED"
    },
    {
      "type": "COOKING_VIDEO",
      "documentUrl": "s3://bucket/chefs/chefId/docs/cooking-video.mp4",
      "status": "VERIFIED"
    }
  ],
  "overallStatus": "VERIFIED",
  "verifiedBy": "admin-userId",
  "verifiedAt": "2024-01-02T00:00:00Z",
  "notes": "Kitchen is clean and hygienic",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

### 4. Daily Menu Entity

```json
{
  "PK": "CHEF#<chefId>",
  "SK": "MENU#2024-01-15#<menuId>",
  "entityType": "DAILY_MENU",
  "menuId": "uuid",
  "chefId": "uuid",
  "date": "2024-01-15",
  "items": [
    {
      "itemId": "uuid",
      "name": "Hyderabadi Chicken Biryani",
      "description": "Authentic dum biryani with tender chicken",
      "category": "Main Course",
      "cuisine": "Hyderabadi",
      "price": 250,
      "discountedPrice": 220,
      "quantity": 20,
      "remainingQuantity": 15,
      "unit": "plate",
      "servingSize": "1 person",
      "isVeg": false,
      "spiceLevel": "Medium",
      "allergens": ["Dairy", "Nuts"],
      "images": ["s3://bucket/menus/item1.jpg"],
      "preparationTime": 30,
      "availableFrom": "12:00",
      "availableTill": "15:00",
      "isAvailable": true
    },
    {
      "itemId": "uuid",
      "name": "Dal Tadka",
      "description": "Yellow dal with ghee tempering",
      "category": "Main Course",
      "price": 80,
      "quantity": 30,
      "remainingQuantity": 28,
      "isVeg": true,
      "isAvailable": true
    }
  ],
  "mealType": "LUNCH",
  "orderCutoffTime": "11:00",
  "deliveryStartTime": "12:00",
  "deliveryEndTime": "14:00",
  "packagingType": "STEEL_BOX",
  "packagingDeposit": 50,
  "minimumOrderAmount": 150,
  "deliveryFee": 30,
  "freeDeliveryAbove": 500,
  "status": "ACTIVE",
  "totalOrders": 5,
  "createdAt": "2024-01-15T06:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z",
  
  "GSI1PK": "GEO#tdr1yp",
  "GSI1SK": "2024-01-15#MENU#<menuId>",
  "GSI3PK": "CHEF#<chefId>",
  "GSI3SK": "MENU#2024-01-15#<menuId>",
  "GSI4PK": "DISH#hyderabadi-chicken-biryani",
  "GSI4SK": "2024-01-15#CHEF#<chefId>"
}
```

### 5. Order Entity

```json
{
  "PK": "ORDER#<orderId>",
  "SK": "DETAILS",
  "entityType": "ORDER",
  "orderId": "GKK-20240115-001234",
  "customerId": "uuid",
  "customerName": "Customer Name",
  "customerPhone": "+91XXXXXXXXXX",
  "chefId": "uuid",
  "chefName": "Chef Name",
  "chefPhone": "+91XXXXXXXXXX",
  "menuId": "uuid",
  "menuDate": "2024-01-15",
  "items": [
    {
      "itemId": "uuid",
      "name": "Hyderabadi Chicken Biryani",
      "price": 220,
      "quantity": 2,
      "subtotal": 440
    },
    {
      "itemId": "uuid",
      "name": "Dal Tadka",
      "price": 80,
      "quantity": 1,
      "subtotal": 80
    }
  ],
  "deliveryAddress": {
    "line1": "123 Street Name",
    "city": "Hyderabad",
    "pincode": "500001",
    "latitude": 17.385044,
    "longitude": 78.486671
  },
  "pricing": {
    "subtotal": 520,
    "packagingFee": 0,
    "packagingDeposit": 100,
    "deliveryFee": 30,
    "taxes": 26,
    "discount": 0,
    "total": 676
  },
  "payment": {
    "method": "UPI",
    "status": "PAID",
    "transactionId": "razorpay_txn_id",
    "paidAt": "2024-01-15T10:30:00Z"
  },
  "status": "DELIVERED",
  "statusHistory": [
    { "status": "PLACED", "timestamp": "2024-01-15T10:30:00Z" },
    { "status": "CONFIRMED", "timestamp": "2024-01-15T10:35:00Z" },
    { "status": "PREPARING", "timestamp": "2024-01-15T11:00:00Z" },
    { "status": "READY", "timestamp": "2024-01-15T12:30:00Z" },
    { "status": "OUT_FOR_DELIVERY", "timestamp": "2024-01-15T12:35:00Z" },
    { "status": "DELIVERED", "timestamp": "2024-01-15T12:50:00Z" }
  ],
  "deliverySlot": {
    "date": "2024-01-15",
    "startTime": "12:30",
    "endTime": "13:00"
  },
  "specialInstructions": "Less spicy please",
  "packagingType": "STEEL_BOX",
  "steelBoxCount": 3,
  "steelBoxReturned": false,
  "estimatedDeliveryTime": "2024-01-15T12:45:00Z",
  "actualDeliveryTime": "2024-01-15T12:50:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:50:00Z",
  
  "GSI2PK": "CUSTOMER#<customerId>",
  "GSI2SK": "ORDER#2024-01-15#<orderId>",
  "GSI3PK": "CHEF#<chefId>",
  "GSI3SK": "ORDER#2024-01-15#<orderId>"
}
```

### 6. Review Entity

```json
{
  "PK": "CHEF#<chefId>",
  "SK": "REVIEW#2024-01-15#<reviewId>",
  "entityType": "REVIEW",
  "reviewId": "uuid",
  "orderId": "uuid",
  "customerId": "uuid",
  "customerName": "Customer Name",
  "chefId": "uuid",
  "rating": 5,
  "foodRating": 5,
  "hygieneRating": 5,
  "packagingRating": 4,
  "deliveryRating": 5,
  "title": "Amazing home-cooked taste!",
  "comment": "The biryani was absolutely delicious. Felt like eating at my grandma's place.",
  "images": ["s3://bucket/reviews/review1.jpg"],
  "itemsOrdered": ["Hyderabadi Chicken Biryani", "Dal Tadka"],
  "isVerifiedPurchase": true,
  "chefResponse": {
    "comment": "Thank you so much! Looking forward to serving you again.",
    "respondedAt": "2024-01-16T10:00:00Z"
  },
  "helpfulCount": 12,
  "createdAt": "2024-01-15T18:00:00Z",
  "updatedAt": "2024-01-16T10:00:00Z",
  
  "GSI2PK": "CUSTOMER#<customerId>",
  "GSI2SK": "REVIEW#2024-01-15#<reviewId>"
}
```

### 7. Steel Box Tracking Entity

```json
{
  "PK": "STEELBOX#<boxId>",
  "SK": "DETAILS",
  "entityType": "STEEL_BOX",
  "boxId": "GKK-BOX-001234",
  "chefId": "uuid",
  "size": "MEDIUM",
  "status": "WITH_CUSTOMER",
  "currentOrderId": "uuid",
  "currentCustomerId": "uuid",
  "depositAmount": 50,
  "issuedAt": "2024-01-15T12:50:00Z",
  "expectedReturnBy": "2024-01-16T12:50:00Z",
  "history": [
    {
      "action": "ISSUED",
      "orderId": "uuid",
      "customerId": "uuid",
      "timestamp": "2024-01-15T12:50:00Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 8. Notification Entity

```json
{
  "PK": "USER#<userId>",
  "SK": "NOTIFICATION#2024-01-15T12:50:00Z#<notificationId>",
  "entityType": "NOTIFICATION",
  "notificationId": "uuid",
  "userId": "uuid",
  "type": "ORDER_UPDATE",
  "title": "Order Delivered!",
  "message": "Your order from Amma's Kitchen has been delivered.",
  "data": {
    "orderId": "uuid",
    "action": "VIEW_ORDER"
  },
  "isRead": false,
  "createdAt": "2024-01-15T12:50:00Z"
}
```

---

## Geolocation Strategy

We use **Geohash** for location-based queries. Geohash converts latitude/longitude into a string that can be used for proximity searches.

### Geohash Precision

| Precision | Cell Size | Use Case |
|-----------|-----------|----------|
| 4 | ~39km × 19.5km | Regional |
| 5 | ~4.9km × 4.9km | City area |
| 6 | ~1.2km × 0.6km | Neighborhood |
| 7 | ~153m × 153m | Street level |

We use **precision 5** for searching chefs (covers ~5km radius).

### Search Algorithm

1. Calculate geohash for customer's location
2. Get the 8 neighboring geohashes
3. Query GSI1 for all 9 geohashes
4. Filter by exact distance calculation
5. Sort by distance

---

## OpenSearch for Menu Search

DynamoDB is not ideal for full-text search. We stream menu data to OpenSearch for searching dishes.

### OpenSearch Index Mapping

```json
{
  "mappings": {
    "properties": {
      "menuId": { "type": "keyword" },
      "chefId": { "type": "keyword" },
      "chefName": { "type": "text" },
      "date": { "type": "date" },
      "items": {
        "type": "nested",
        "properties": {
          "itemId": { "type": "keyword" },
          "name": { "type": "text", "analyzer": "standard" },
          "description": { "type": "text" },
          "category": { "type": "keyword" },
          "cuisine": { "type": "keyword" },
          "price": { "type": "float" },
          "isVeg": { "type": "boolean" },
          "isAvailable": { "type": "boolean" }
        }
      },
      "location": { "type": "geo_point" },
      "geohash": { "type": "keyword" }
    }
  }
}
```

### Sample Search Queries

**Search by dish name:**
```json
{
  "query": {
    "nested": {
      "path": "items",
      "query": {
        "bool": {
          "must": [
            { "match": { "items.name": "biryani" } },
            { "term": { "items.isAvailable": true } }
          ]
        }
      }
    }
  },
  "filter": {
    "geo_distance": {
      "distance": "5km",
      "location": { "lat": 17.385, "lon": 78.486 }
    }
  }
}
```

---

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  API Lambda  │────▶│   DynamoDB   │────▶│   DynamoDB   │
│              │     │    Table     │     │   Streams    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   Lambda     │
                                          │  (Indexer)   │
                                          └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │  OpenSearch  │
                                          │    Index     │
                                          └──────────────┘
```

---

## Capacity Planning

### DynamoDB
- **On-Demand** capacity mode (pay per request)
- Enable **Point-in-time Recovery**
- Enable **DynamoDB Streams** for OpenSearch sync

### Estimated Costs (10,000 users)
- DynamoDB: ~$50/month
- OpenSearch: ~$100/month (t3.small)
- S3: ~$10/month
- Lambda: ~$20/month
- Total: ~$180-250/month

---

## Indexes Summary

| Index | Purpose | Query Pattern |
|-------|---------|---------------|
| Main Table | Entity lookup | PK + SK |
| GSI1 | Geo queries | Location-based chef/menu search |
| GSI2 | Customer data | Customer orders, reviews |
| GSI3 | Chef data | Chef orders, menus by date |
| GSI4 | Dish search | Find chefs by dish name |
