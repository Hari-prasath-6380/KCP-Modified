# Stock Management Testing Checklist

## Pre-Testing Requirements

- [ ] Backend server running: `npm start` (in `backend` folder)
- [ ] MongoDB Atlas connected
- [ ] Admin logged in
- [ ] Browser console open (F12) to check for errors

---

## Test 1: Create Product with Base Stock

### Setup:
```
Go to: Admin Dashboard → Products → + Add Product
```

### Test Case:
```
[ ] Fill Form:
    - Product Name: "Organic Turmeric Powder"
    - Category: "Spices"
    - Base Price: ₹250
    - Stock (units): 50
    - Description: "100% organic turmeric powder from Kerala"

[ ] Add Units:
    Unit 1:
    - Type: g (Grams)
    - Quantity: 100
    - Price: ₹120
    - Stock: (leave blank or 0)
    
    Unit 2:
    - Type: g
    - Quantity: 500
    - Price: ₹500
    - Stock: (leave blank or 0)

[ ] Upload Image: Select any valid image file

[ ] Click "Save Product"

[ ] Expected Result:
    - Success message appears
    - Product appears in Products list
    - Stock badge shows: "✅ 50 in stock" (green)
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 2: Create Product with Individual Unit Stock

### Setup:
```
Same as Test 1, but with individual unit stock
```

### Test Case:
```
[ ] Fill Form:
    - Product Name: "Premium Basmati Rice"
    - Category: "Rice"
    - Base Price: ₹299
    - Stock (units): 100
    - Description: "Premium quality 1121 Basmati Rice"

[ ] Add Units:
    Unit 1:
    - Type: kg
    - Quantity: 2
    - Price: ₹299
    - Stock: 50  ← Set individual stock
    
    Unit 2:
    - Type: kg
    - Quantity: 5
    - Price: ₹699
    - Stock: 75  ← Different stock level

[ ] Upload Image: Select image

[ ] Click "Save Product"

[ ] Expected Result:
    - Success message
    - Product shows stock badge
    - Both units saved with their own stock levels

[ ] Verify in MongoDB:
    - Connect to your database
    - Check products collection
    - Confirm: units[0].stock = 50, units[1].stock = 75
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 3: Quick Stock Update

### Setup:
```
Product from Test 1 or 2 exists in Products list
```

### Test Case:
```
[ ] Find "Organic Turmeric Powder" in Products table
[ ] Click "Stock" button (green button)
[ ] Prompt appears with current stock
[ ] Enter new value: 75
[ ] Click OK

[ ] Expected Result:
    - Stock updates immediately
    - Badge changes from "✅ 50 in stock" to "✅ 75 in stock"
    - No page refresh needed
    - Database updated automatically

[ ] Verify: 
    - Stock badge still shows correct value after page refresh
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 4: Full Product Edit

### Setup:
```
Product exists in Products list
```

### Test Case:
```
[ ] Find "Premium Basmati Rice" product
[ ] Click "Edit" button
[ ] Modal opens with product data pre-filled

[ ] Verify Fields Populated:
    [ ] Product Name: "Premium Basmati Rice"
    [ ] Category: "Rice"
    [ ] Price: "299"
    [ ] Stock: "100"
    [ ] Description: Shows full text
    [ ] Units section shows 2 units with:
        - Unit 1: kg, 2, ₹299, Stock: 50
        - Unit 2: kg, 5, ₹699, Stock: 75

[ ] Make Changes:
    - Stock (base): Change 100 → 120
    - Unit 2 Stock: Change 75 → 90
    
[ ] Click "Save Product"

[ ] Expected Result:
    - Success message
    - Product list updates
    - Badge reflects new stock value
    - Both base and unit stocks updated
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 5: Add to Cart (Stock Decrement)

### Setup:
```
Product from Test 2 exists
User is logged in
```

### Test Case:
```
[ ] Go to Products/Shop page
[ ] Find "Premium Basmati Rice" product
[ ] Current stock in badge: "✅ 100 in stock"

[ ] Click on product card/view details
[ ] Select variant: "2kg (₹299)"
[ ] Enter quantity: 1
[ ] Click "Add to Cart"

[ ] Expected Result:
    - Item added to cart successfully
    - Stock badge updates to "✅ 99 in stock"
    - Cart shows: 1x Basmati Rice (2kg)

[ ] Verify "5kg" unit:
    - Stock should still show from Unit 2 (75 or whatever)
    - Not affected by adding 2kg variant

[ ] Check Admin Dashboard:
    - Product stock shows: 99 units
    - Unit 1 (2kg) stock decremented
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 6: Low Stock Warning Badge

### Setup:
```
Product has stock between 1-20 units
```

### Test Case:
```
[ ] Quick update stock to: 15
[ ] Go to Products page
[ ] Find the product

[ ] Expected Result:
    - Badge shows: "⚠️ Only 15 left!" (yellow)
    - Not green, not red
    - Matches low stock color scheme

[ ] Add to cart multiple times until stock = 1:
[ ] Badge shows: "⚠️ Only 1 left!" (yellow)

[ ] Stock set to: 0
[ ] Expected Result:
    - Badge shows: "❌ Out of Stock" (red)
    - "Add to Cart" button becomes disabled/grayed out
    - Button text changes to "Out of Stock"
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 7: Order Completion (Stock Decrement)

### Setup:
```
Product exists with stock > 0
User has items in cart
```

### Test Case:
```
[ ] Go to Cart
[ ] Verify product: "Premium Basmati Rice (2kg)", Qty: 1
[ ] Current product stock in admin: 99

[ ] Proceed to Checkout
[ ] Fill order details:
    - Name, Email, Phone
    - Address
    - Payment Method: COD

[ ] Review Order:
    - Items: 1x Basmati Rice (2kg) @ ₹299
    - Total: ₹299

[ ] Place Order

[ ] Expected Result:
    - Order confirmation appears
    - Order ID generated
    - Email sent to customer
    - SMS notification (if configured)

[ ] Go to Admin Dashboard → Orders:
    [ ] New order appears in list
    [ ] Order shows "pending" or "confirmed" status
    [ ] Customer details match

[ ] Go to Admin Dashboard → Products:
    [ ] "Premium Basmati Rice" stock: 99 → 98
    [ ] Correct unit stock was decremented

[ ] Verify Notifications:
    [ ] Check if admin received order notification
    [ ] Check if customer received order email
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 8: Zero Stock Fallback

### Setup:
```
Create product with:
- Base Stock: 50
- Unit 1: Stock 0 (empty)
- Unit 2: Stock 0 (empty)
```

### Test Case:
```
[ ] Create Product:
    - Name: "Test Rice"
    - Category: "Rice"
    - Base Stock: 50
    - Unit 1: kg, 2, ₹300, Stock: (leave blank/0)
    - Unit 2: kg: 5, ₹700, Stock: (leave blank/0)

[ ] Save Product

[ ] Go to Shop and add to cart:
    [ ] Select Unit 1 (2kg)
    [ ] Add to cart
    
[ ] Expected Result:
    - Item added successfully (no error)
    - Falls back to base stock: 50 → 49
    - Works because unit stock is 0

[ ] Verify:
    - Customer can add to cart
    - Stock decrements from base stock
    - No "Insufficient unit stock" error
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 9: Multiple Concurrent Orders

### Setup:
```
Product stock: 5 units
Two users in different browsers/devices
```

### Test Case:
```
User 1:
[ ] Adds product (qty: 2) to cart
[ ] Stock becomes: 3

User 2:
[ ] Simultaneously adds product (qty: 2) to cart
[ ] Stock becomes: 1

[ ] Both complete orders

[ ] Expected Result:
    - Both orders created successfully
    - Final stock: -1 or 0 (or error if validation applied)
    - Both customers receive confirmation
    - Orders show in admin dashboard
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 10: Stock Validation

### Setup:
```
Product stock: 10 units
```

### Test Case:
```
[ ] Try to add: 15 units to cart
    (More than available)

[ ] Expected Result:
    - Error message: "Insufficient stock"
    - Cannot add more than available
    - Cart unchanged

[ ] Add: 10 units (exactly available)
    
[ ] Expected Result:
    - Item added successfully
    - Stock: 10 → 0
    - Product marked "Out of Stock"

[ ] Try to add more: 1 unit
    
[ ] Expected Result:
    - Cannot add (button disabled)
    - Error if tried to add anyway
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 11: Admin Permissions

### Setup:
```
Admin user logged in
Test with non-admin user if possible
```

### Test Case:
```
Admin User:
[ ] Can access Admin Dashboard: YES
[ ] Can create product: YES
[ ] Can update stock: YES
[ ] Can edit product: YES
[ ] Can view orders: YES

Non-Admin User:
[ ] Cannot access Admin Dashboard: YES
[ ] Redirect to home: YES

[ ] Expected Result:
    - Only admin can manage stock
    - Regular users see products only
    - Security working correctly
```

**Result:** ✅ PASS / ❌ FAIL

---

## Test 12: Database Consistency

### Setup:
```
5-10 products with different stock levels
Multiple orders completed
```

### Test Case:
```
[ ] Connect to MongoDB Atlas
[ ] Check products collection

For each product, verify:
[ ] stock field matches admin dashboard display
[ ] units[n].stock matches each unit's value
[ ] All values are numbers (not strings)
[ ] No negative stock values (unless allowed)

[ ] Check orders collection

For each order, verify:
[ ] items with quantity match decremented stock
[ ] order date is correct
[ ] customer details saved
[ ] payment status recorded

[ ] Expected Result:
    - All database values consistent
    - No gaps between admin interface and database
    - Data types correct
    - No orphaned records
```

**Result:** ✅ PASS / ❌ FAIL

---

## Summary Report

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 1. Base Stock Creation | [ ] | [ ] | |
| 2. Individual Unit Stock | [ ] | [ ] | |
| 3. Quick Stock Update | [ ] | [ ] | |
| 4. Full Product Edit | [ ] | [ ] | |
| 5. Add to Cart | [ ] | [ ] | |
| 6. Low Stock Badges | [ ] | [ ] | |
| 7. Order Completion | [ ] | [ ] | |
| 8. Zero Stock Fallback | [ ] | [ ] | |
| 9. Concurrent Orders | [ ] | [ ] | |
| 10. Stock Validation | [ ] | [ ] | |
| 11. Admin Permissions | [ ] | [ ] | |
| 12. Database Consistency | [ ] | [ ] | |

**Overall Status:** [ ] READY FOR PRODUCTION | [ ] NEEDS FIXES

**Failed Tests to Fix:**
```
1. ...
2. ...
3. ...
```

---

**Test Date:** _______________  
**Tester Name:** _______________  
**Browser/OS:** _______________  
**Backend Version:** _______________  

---

## Common Issues & Fixes

### Issue: Stock doesn't update
```
Fix:
1. Check backend server is running
2. Verify MongoDB connection
3. Check browser console for errors (F12)
4. Restart server: npm start
```

### Issue: "Insufficient stock" error when stock available
```
Fix:
1. Make sure unit stock is set (not 0)
2. Update quick stock to ensure value is saved
3. Refresh page and try again
4. Check MongoDB that stock value is gt 0
```

### Issue: Products not appearing
```
Fix:
1. Ensure isActive = true
2. Check at least one unit is added
3. Verify product has price > 0
4. Refresh admin products list
```

---

**Last Updated:** March 8, 2026  
**Version:** 2.0  
**Released:** Ready for Testing ✅
