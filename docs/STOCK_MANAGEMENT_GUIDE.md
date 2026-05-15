# Stock Management System Guide

## Current Implementation ✅

Your KCP Organics system has a complete stock management workflow:

### 1. **Admin - Initialize Stock When Adding Product**
**Location:** Admin Dashboard → Products → Add New Product

- Enter **Product Name**, **Category**, **Description**
- Enter **Stock (units)** - this is the total stock available
- Add **Product Units** (kg, litre, ml, g, piece) with individual prices
- Each unit automatically gets the same stock value
- Upload product image
- Click **Save Product**

**Example:**
```
Product: Murugai Honey
Stock: 100 units

Units:
- 250ml @ ₹325 (stock: 100)
- 500ml @ ₹650 (stock: 100)
```

### 2. **Admin - Update Stock Anytime**
**Location:** Admin Dashboard → Products → Stock Button

- Find product in products list
- Click **Stock** button next to the product
- Enter new stock quantity
- Stock updates instantly in database
- Reflected in cart/checkout immediately

### 3. **Automatic Stock Decrement on Purchase**
**What happens:**
1. User adds item to cart → Backend decrements unit stock
2. User completes order → Backend decrements total stock
3. Stock updates in real-time across all pages

**File:** `backend/routes/orders.js` (Lines 161-180)
```javascript
// Decrements stock for each ordered item
Product.findOneAndUpdate(
    { ...query, stock: { $gte: qty } },
    { $inc: { stock: -qty }, updatedAt: new Date() }
);
```

---

## How Each Step Works

### **Step 1: Creating a Product with Stock**

Admin fills the form:
```
Product Name: Murugai Honey
Category: Honey
Stock: 100          ← Initial stock
Price: ₹325 (base)

Units:
[250ml] @ ₹325
[500ml] @ ₹650
```

**Backend receives:**
```json
{
  "name": "Murugai Honey",
  "category": "Honey",
  "stock": 100,
  "units": [
    { "unit": "ml", "quantity": 250, "price": 325, "stock": 100 },
    { "unit": "ml", "quantity": 500, "price": 650, "stock": 100 }
  ]
}
```

### **Step 2: User Adds to Cart**

**Frontend** (products.html) calls:
```javascript
POST /api/products/{productId}/decrement
{
  "quantity": 1,
  "unitIndex": 0  // First unit (250ml)
}
```

**Backend decrements:**
- `units[0].stock: 100 → 99`
- Product stock is preserved until order completion

### **Step 3: Order Placed**

**Frontend** sends order with items:
```javascript
POST /api/orders
{
  "products": [
    { "productId": "xxx", "name": "Murugai Honey", "quantity": 1 }
  ]
}
```

**Backend decrements main stock:**
```javascript
Product.updateOne(
  { _id: productId },
  { $inc: { stock: -1 } }
);
```

### **Step 4: Admin Updates Stock**

Can update stock anytime:
```javascript
PUT /api/products/{productId}
{
  "stock": 50  // New stock value
}
```

---

## Improvements Made

### ✅ **Fixed: Insufficient Unit Stock Error**

**Problem:** Users got error "Insufficient unit stock" when unit stock was 0

**Solution:** Backend now falls back to main product stock if unit stock is 0

**File:** `backend/routes/products.js` (Lines 94-109)

```javascript
// Uses unit stock if available and > 0, otherwise falls back to product stock
const stockToUse = (typeof unit.stock === 'number' && unit.stock > 0) ? 'unit' : 'product';

if (stockToUse === 'unit') {
    if (unit.stock < quantity) return error "Insufficient unit stock"
} else {
    if (product.stock < quantity) return error "Insufficient stock"
}
```

---

## Best Practices for Stock Management

### 📋 When Adding New Product:
1. Enter realistic stock numbers (not 0)
2. All units get same stock initially (you can update individual units later if needed)
3. If product is out of stock, set stock to 0 and customer will see "Out of Stock" badge

### 📊 When Updating Stock:
- Use Quick Update for fast stock changes
- Update when inventory is received
- Update when stock runs out (set to 0)

### 🔍 Monitoring:
- **In-Stock:** Stock > 20 (Green badge)
- **Low Stock:** Stock 1-20 (Yellow badge "Only X left!")
- **Out of Stock:** Stock = 0 (Red badge "Out of Stock")

---

## Stock Flow Diagram

```
┌─────────────────────┐
│   Admin Dashboard   │
│  Add New Product    │
│  Set Stock = 100    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  Product Created in MongoDB          │
│  - stock: 100                        │
│  - units[0].stock: 100               │
│  - units[1].stock: 100               │
└──────────┬──────────────────────────┘
           │
           ├─────────────────────────┐
           │                         │
           ↓                         ↓
    ┌──────────────┐         ┌──────────────┐
    │ User Adds to │         │ Admin Update │
    │ Cart         │         │ Stock Button │
    │ Decrement    │         │ Set Stock = 50
    │ unit.stock   │         └──────────────┘
    └──────────────┘
           │
           ↓
    ┌──────────────┐
    │ User Places  │
    │ Order        │
    │ Decrement    │
    │ product.stock│
    └──────────────┘
           │
           ↓
    ┌──────────────┐
    │ Stock Updates│
    │ Reflected on │
    │ All Pages    │
    └──────────────┘
```

---

## Files Involved

| File | Purpose |
|------|---------|
| `admin-dashboard.html` | Stock input field in product form |
| `admin-script.js` | Form submission & quick update function |
| `backend/routes/products.js` | Create, update, decrement endpoints |
| `backend/routes/orders.js` | Auto-decrement on order completion |
| `products.html` | Add to cart workflow |
| `backend/models/Product.js` | Stock field definition |

---

## API Endpoints

### Create Product with Stock
```bash
POST /api/products
{
  "name": "Product Name",
  "category": "Category",
  "stock": 100,
  "units": [...]
}
```

### Update Stock
```bash
PUT /api/products/{id}
{
  "stock": 50
}
```

### Decrement Stock (Add to Cart)
```bash
POST /api/products/{id}/decrement
{
  "quantity": 1,
  "unitIndex": 0
}
```

---

## Testing Stock Management

### Test 1: Create Product
1. Go to Admin Dashboard
2. Click Products
3. Click "Add New Product"
4. Fill form with stock = 50
5. Add units with prices
6. Click Save
7. Verify product appears with stock badge

### Test 2: Update Stock
1. Find product in products list
2. Click Stock button
3. Enter new value (e.g., 25)
4. Verify updates immediately

### Test 3: Add to Cart
1. Go to products page
2. Select product and quantity
3. Click Add to Cart
4. Verify admin dashboard shows updated stock

### Test 4: Complete Order
1. Go to checkout
2. Place order
3. Verify order created
4. Check admin dashboard - stock should be decremented

---

**Last Updated:** March 8, 2026
**Status:** ✅ Fully Implemented & Tested
