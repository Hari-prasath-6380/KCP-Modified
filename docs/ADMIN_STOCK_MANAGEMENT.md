# Admin Stock Management Instructions

## Quick Start: Adding a Product with Stock

### Step 1: Open Product Form
1. Go to **Admin Dashboard** → Click **Products**
2. Click **"+ Add Product"** button (top right)

### Step 2: Fill Basic Information
```
Product Name *      → Murugai Honey
Category *          → Honey
Base Price (₹)      → 325
Stock (units)       → 100    (← This is the default/fallback stock)
Description *       → Product benefits, uses, why KCP Organics
```

### Step 3: Add Product Units (Critical!)
Each product can have multiple sizes/units with different prices and individual stock.

**Example:** Murugai Honey
```
Unit 1:
  Type      → ml (Millilitre)
  Quantity  → 250
  Price     → ₹325
  Stock     → 50     (← Individual stock for 250ml)

Unit 2:
  Type      → ml
  Quantity  → 500
  Price     → ₹650
  Stock     → 75     (← Individual stock for 500ml)
```

**How to add:**
1. Click **"+ Add Unit"** button
2. Select Unit Type from dropdown (kg, litre, ml, g, piece)
3. Enter Quantity (e.g., 250 for 250ml)
4. Enter Price (in ₹)
5. Enter individual Stock for this unit size
6. Repeat for each size variation

**TIP:** Stock field in each unit is **optional**. If you leave it blank or 0, the base stock will be used as fallback.

### Step 4: Upload Image
- Click on image upload area
- Select PNG, JPG, or GIF (max 5MB)
- Wait for upload to complete (you'll see preview)

### Step 5: Save
Click **"Save Product"** button

---

## How Stock Works

### Three Levels of Stock:

```
1. BASE STOCK (General Inventory)
   └─ Set in: "Stock (units)" field
   └─ Used as: Default/fallback for all units
   └─ Updated when: Order is completed

2. UNIT-LEVEL STOCK (Size-Specific)
   └─ Set in: Each unit's "Stock" field
   └─ Used when: Customer adds specific size to cart
   └─ Can be: Different for each size
   └─ Overrides: Base stock if set > 0

3. CART/ADD OPERATION
   └─ Checks: Unit stock first (if available)
   └─ Falls back: To base stock if unit stock is 0
   └─ Decrements: Unit stock when added to cart
```

### Stock Workflow Example:

**Creating Product:**
```
Product: "Murugai Honey"
Base Stock: 100 units

250ml unit:
  Price: ₹325
  Stock: 50   (only 50 units of 250ml available)

500ml unit:
  Price: ₹650
  Stock: 75   (75 units of 500ml available)
```

**When User Adds to Cart:**
```
User selects 250ml variant
↓
System checks: "250ml stock = 50"
↓
User adds 1 unit
↓
250ml stock: 50 → 49 (decremented)
↓
Cart shows 1x Murugai Honey (250ml)
```

**When Order is Completed:**
```
Order contains: 1x Honey (250ml)
↓
Both decremented:
  - Unit stock: 49 → 48
  - Base stock: 100 → 99
↓
Stock updated in MongoDB automatically
```

---

## Updating an Existing Product

### Quick Stock Update (Fastest Way)
1. Go to **Admin Dashboard** → **Products**
2. Find the product in the list
3. Click **"Stock"** button (green button)
4. Enter new stock number
5. Click OK
6. Updates instantly! ✅

### Full Product Edit
1. Go to **Admin Dashboard** → **Products**
2. Find the product
3. Click **"Edit"** button
4. Modify any field (name, price, stock, units, image)
5. Update individual unit stocks if needed
6. Click **"Save Product"**

---

## Stock Status Badges

Admin can see stock status by color:

| Badge | Stock Level | Color | Meaning |
|-------|-------------|-------|---------|
| ✅ 50 in stock | > 20 | Green | Good inventory |
| ⚠️ Only 15 left! | 1-20 | Yellow | Low stock warning |
| ❌ Out of Stock | 0 | Red | Not available |

---

## Common Scenarios

### Scenario 1: Product Received in Warehouse
```
Current Stock: 10 units
Received: 50 units
Action: Click "Stock" button → Enter 60
Result: Stock updated to 60 ✅
```

### Scenario 2: Product Out of Stock
```
Current Stock: 5 units
Sold out: Yes
Action: Click "Stock" button → Enter 0
Result: Badge shows "❌ Out of Stock"
        Add to Cart button disabled for customers
```

### Scenario 3: Multiple Sizes with Different Stock Levels
```
Product: Rice (2kg packs)

Edit Product:
┌─────────────────────────────────────┐
│ Product: Basmati Rice               │
│ Base Stock: 200                     │
│                                     │
│ Units:                              │
│ ┌─────────────────────────────────┐ │
│ │ Type: kg | Qty: 2 | Price: 299  │ │
│ │ Stock: 100 (only 100 2kg packs) │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Type: kg | Qty: 5 | Price: 699  │ │
│ │ Stock: 150 (150 5kg packs)      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Save → Stock levels are independent ✅
```

### Scenario 4: New Product Launch
```
New Product: "Organic Turmeric"
Category: Spices
Base Stock: 0 (not yet in inventory)

Add units:
- 100g: Price ₹120, Stock 0
- 250g: Price ₹250, Stock 0

Save → Product appears but shows "❌ Out of Stock"

When inventory arrives:
- Click "Stock" button → Enter base stock
- OR Edit product → Update each unit's stock individually
```

---

## Best Practices

### ✅ DO:
- Set realistic stock numbers based on actual inventory
- Update stock when new inventory arrives
- Use individual unit stock for different pack sizes
- Set to 0 when completely out of stock
- Check stock regularly before shipments

### ❌ DON'T:
- Leave stock as 0 for available products
- Forget to update stock after orders
- Use same stock for all sizes if they differ
- Ignore low stock warnings (yellow badge)
- Create products without at least one unit

---

## Stock Calculation Example

### Complete Workflow:

**Day 1: Create Product**
```
Murugai Honey
├─ Base Stock: 100
├─ 250ml (Price ₹325, Stock 50)
└─ 500ml (Price ₹650, Stock 75)
```

**Day 2: Customer Orders**
```
Order #001:
  Customer: John
  Items: 1x Murugai Honey 250ml

Stock After Order:
├─ Base Stock: 100 → 99 ✅
├─ 250ml Stock: 50 → 49 ✅
└─ 500ml Stock: 75 (unchanged)
```

**Day 3: Another Order**
```
Order #002:
  Customer: Sarah
  Items: 2x Murugai Honey 500ml

Stock After Order:
├─ Base Stock: 99 → 97 ✅
├─ 250ml Stock: 49 (unchanged)
└─ 500ml Stock: 75 → 73 ✅
```

**Day 4: Manual Update**
```
New Inventory Received: 50 units Murugai Honey

Admin Action: Click Stock Button
  Current: 97
  Enter: 147 (97 + 50)

Stock Now: 147 ✅
```

---

## Troubleshooting

### Problem: "Stock field not saving"
**Solution:** Ensure you clicked "Save Product" button, not just closed the modal

### Problem: "Insufficient unit stock" error for customers
**Solution:** 
1. Go to Products
2. Click "Stock" button
3. Increase stock value
4. Customer can now add to cart

### Problem: Can't see products after creation
**Solution:**
1. Refresh the page (F5)
2. Check if "isActive" checkbox was enabled during creation
3. Verify product has at least one unit with price

### Problem: Unit stock not updating
**Solution:**
1. Make sure you filled in the stock field in the unit
2. Use at least one unit with a stock value > 0
3. Save product completely (wait for success message)

---

## API Integration (For Developers)

### Product Creation with Stock:
```bash
POST /api/products
{
  "name": "Murugai Honey",
  "category": "Honey",
  "stock": 100,
  "price": 325,
  "description": "...",
  "units": [
    {
      "unit": "ml",
      "quantity": 250,
      "price": 325,
      "stock": 50
    },
    {
      "unit": "ml",
      "quantity": 500,
      "price": 650,
      "stock": 75
    }
  ]
}
```

### Update Stock:
```bash
PUT /api/products/{productId}
{
  "stock": 150
}
```

### Decrement on Cart Add:
```bash
POST /api/products/{productId}/decrement
{
  "quantity": 1,
  "unitIndex": 0
}
```

---

## Monitoring Dashboard Indicators

On the **Admin Dashboard**, you can see:

- **Total Products**: Count of all products
- **Stock Levels**: Color-coded badges for each product
- **Low Stock Alerts**: Yellow badges for products with 1-20 units
- **Out of Stock**: Red badges for 0 stock items

---

## Email/Notification on Stock Issues

The system automatically notifies:
- ✅ Admin when order is placed
- ✅ Customer when order status changes
- ✅ System logs stock decrements

---

**Last Updated:** March 8, 2026  
**Version:** 2.0 (Enhanced with Individual Unit Stock)  
**Status:** ✅ Ready for Production
