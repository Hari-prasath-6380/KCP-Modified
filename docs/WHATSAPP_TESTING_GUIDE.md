# WhatsApp Notifications Testing Guide

## 🎯 Overview
This guide will help you verify that WhatsApp notifications are working correctly alongside Telegram notifications.

---

## ✅ Pre-Testing Checklist

Before you start testing, ensure:
- [ ] Node.js and required packages are installed (`npm install` in backend folder)
- [ ] MongoDB connection is working (you should see connection logs)
- [ ] `.wwebjs_auth` folder doesn't exist yet (or is empty) if first-time linking
- [ ] Your WhatsApp account is set up on your phone
- [ ] You have access to both the admin phone (6380442089) and a test account

---

## 🚀 Step 1: Start the Backend Server

```bash
cd backend
node server.js
```

### Expected Console Output:

```
╔════════════════════════════════════════════════════════╗
║    📱 INITIALIZING NOTIFICATION SERVICES              ║
╚════════════════════════════════════════════════════════╝

✅ WhatsApp module loaded - Check above for QR code if device not linked
📝 Note: WhatsApp may take 20-30 seconds to initialize
================================================================

🔧 Connecting to MongoDB...
✅ MongoDB connected successfully
🌐 Server running on http://localhost:5000

[After 20-30 seconds]

╔════════════════════════════════════════════════════════╗
║    📱 WHATSAPP: SCAN QR CODE TO LINK DEVICE            ║
╚════════════════════════════════════════════════════════╝

[QR CODE WILL APPEAR HERE]

➡️  STEPS TO LINK:
   1. Open WhatsApp on your phone
   2. Tap MENU (⋮) → Linked Devices → Link a Device
   3. Point camera at the QR code above

💡 Note: Scan QR code only once. Session will be saved.
================================================================

[After scanning QR code]

═══════════════════════════════════════════════════════════════
✅ [WhatsApp] CLIENT READY AND CONNECTED
✅ Notifications will be sent to: +91 6380442089
═══════════════════════════════════════════════════════════════
```

---

## 📱 Step 2: Link Your WhatsApp Device (First Time Only)

**⚠️ IMPORTANT**: You need to scan the QR code with **another phone** (not the admin phone).

### Linking Process:

1. **On your laptop/computer console**: Look for the QR code box in the output above
2. **On your secondary phone**:
   - Open WhatsApp
   - Tap the **MENU** button (three dots ⋮)
   - Select **Linked Devices**
   - Tap **Link a Device**
   - Point your phone's camera at the QR code
3. **Confirmation**: After scanning, the console should show:
   ```
   🔐 [WhatsApp] Device authenticated — session saved
   ```

### 💾 Session Persistence

After linking once, the session is saved in the `.wwebjs_auth/` folder. You won't need to scan the QR code again unless you:
- Delete the `.wwebjs_auth` folder
- Unlink the device from WhatsApp
- Run the server on a different machine

---

## 🧪 Step 3: Test with Website Order

### Step 3a: Open the Website

1. Open your browser and navigate to: `http://localhost:3000` (or your website URL)
2. Browse and add products to the cart
3. Proceed to **Checkout**

### Step 3b: Place Test Order

1. Fill in the order form:
   ```
   Name: Test User
   Phone: (Any number, e.g., +91 9876543210)
   Address: Test Address, City, State, Zipcode
   Payment: Select any payment method
   ```
2. Click **Place Order** button

### Step 3c: Watch the Console

Look for these messages in the backend console:

```
📱 [WhatsApp] Sending notification with data: {
  "customerName": "Test User",
  "phone": "+919876543210",
  "items": [
    {
      "title": "Organic Honey 500g",
      "qty": 2,
      "price": 299.99
    }
  ],
  "totalAmount": 599.98,
  "paymentMethod": "Card",
  "shippingAddress": {
    "address": "Test Address",
    "city": "City",
    "pincode": "123456"
  }
}
✅ WhatsApp order notification sent successfully
```

### Debug: If you see warning messages instead:

```
⚠️  WhatsApp client not ready yet - notification will be skipped
```
- **Cause**: Order placed before WhatsApp finished initializing
- **Solution**: Wait 30 seconds after server starts, then place order

```
⚠️  WhatsApp client not ready yet - notification will be skipped
💡 Tip: WhatsApp client may still be initializing. Check server logs for QR code.
```
- **Cause**: QR code not scanned yet
- **Solution**: Scroll up in console to find QR code and scan it

---

## 📲 Step 4: Check Admin WhatsApp

On the **admin phone** with WhatsApp number **6380442089**:

1. Open WhatsApp
2. Go to **Chats** tab
3. Look for a message from the **Linked Device**
4. You should see an order notification like:

```
🛒 *New Order from KCP Organics*
────────────────────────
📦 Order Items:
  • Organic Honey 500g (Qty: 2) - ₹299.99 each
────────────────────────
💰 Total: ₹599.98
💳 Payment: Card

👤 Customer: Test User
📞 Phone: +91 9876543210
📍 Shipping:
  Test Address, City - 123456
────────────────────────
🕐 Time: [timestamp]
```

---

## 🔍 Troubleshooting

### ❌ "WhatsApp module error" on startup

**Solution**:
```bash
cd backend
npm install whatsapp-web.js qrcode-terminal puppeteer
```

Then restart the server.

---

### ❌ QR Code not appearing

**Solution 1**: The QR code should appear 20-30 seconds after server starts
- Scroll up in the console output
- Look for: `📱 WHATSAPP: SCAN QR CODE TO LINK DEVICE`

**Solution 2**: If still not visible, delete the auth folder and restart:
```bash
# In backend folder
rm -r .wwebjs_auth
node server.js
```

---

### ❌ QR Code scanned but still says "not ready"

**Cause**: Scanning took too long, or WhatsApp session not authenticated

**Solution**:
1. Delete the `.wwebjs_auth` folder
2. Restart the server
3. Scan the new QR code quickly (within 30 seconds)
4. Watch for: `🔐 [WhatsApp] Device authenticated — session saved`

---

### ❌ Order placed but no WhatsApp notification

**Check these in order**:

1. **Is Telegram working?**
   - Check if you receive Telegram notifications
   - If no: Issue is with notification service generally
   - If yes: Issue is WhatsApp-specific

2. **Check console for readiness**:
   - Look for: `✅ [WhatsApp] CLIENT READY AND CONNECTED`
   - If not present: Client never connected, see "QR Code not appearing"

3. **Check data format** is being sent:
   - Look for: `📱 [WhatsApp] Sending notification with data: {...}`
   - If not present: See notification skipped warnings above

4. **Check if message sent**:
   - Look for: `✅ WhatsApp order notification sent successfully`
   - If not present: Check error line below it

5. **Check admin phone**:
   - Open WhatsApp Linked Devices list
   - Confirm device is still linked (connection might have dropped)
   - Try sending a test message from another contact first

---

### ❌ Notification sent but admin didn't receive it

**Possible causes**:

| Cause | Solution |
|-------|----------|
| Linked device was unlinked in WhatsApp | Re-scan QR code and relink |
| Network connection dropped | Check internet connectivity |
| Admin phone without WhatsApp connected | Open WhatsApp on admin phone |
| Message was marked as spam | Check WhatsApp filters/muted chats |
| Timeout during send (>30s after server start) | Messages sent too early, order placed before WhatsApp ready |

---

## 📊 Expected Notification Flow

```
Website Order Form
       ↓
    [Submit]
       ↓
Server receives POST to /api/orders
       ↓
       ├─→ [Telegram] sendOrderTelegram()
       │   └─→ ✅ Message sent to Telegram
       │
       └─→ [WhatsApp] sendOrderWhatsApp()
           ├─→ Check: isClientReady() == true?
           │   └─→ YES: Format data & send
           │   └─→ NO: Skip with warning
           └─→ ⚠️ Or send to admin WhatsApp

Admin Receives Both Notifications
```

---

## ✨ Success Indicators

You'll know everything is working when:

✅ Server starts without WhatsApp errors  
✅ QR code appears in console during startup  
✅ QR code successfully scanned → authenticated message  
✅ Console shows: `✅ [WhatsApp] CLIENT READY AND CONNECTED`  
✅ Order placed → console shows: `📱 [WhatsApp] Sending notification with data:`  
✅ Admin receives WhatsApp order notification on phone  
✅ Notification contains correct customer name, products, total amount  

---

## 📝 Testing Log Template

Use this to record your testing results:

```
Date: ___________
Server Start Time: ___________
QR Code Scanned: [ ] YES [ ] NO
Authentication Time: ___________

Test Order Details:
- Product: ___________
- Quantity: ___________
- Total: ___________

Results:
[ ] Telegram notification received
[ ] WhatsApp notification received
[ ] Order details match in notifications
[ ] Admin received both notifications

Issues Found:
_________________________________
_________________________________
```

---

## 🆘 Getting More Details

If you encounter issues, check these log locations:

1. **Console Output** (while server running):
   - Look for 📱, ✅, ❌ messages
   - JSON data structure for what's being sent

2. **Session Files**:
   ```bash
   ls -la backend/.wwebjs_auth/
   ```
   Should show `Default/` folder with session cache

3. **Network Activity**:
   - Check if WhatsApp Web connection is stable
   - May need to disable VPN if using one

---

## 📞 Contact Info

For further assistance:
- Check server console for specific error messages
- Verify MongoDB is running
- Ensure both Telegram and WhatsApp APIs are accessible
- Check that node_modules is properly installed

---

**Last Updated**: Latest version with readiness checks and data format validation
**Status**: ✅ Ready for testing
