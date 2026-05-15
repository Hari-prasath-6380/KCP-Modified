# KCP ORGANICS - Deployment & Setup Guide

## Quick Start for Customer Delivery

### System Requirements
- Node.js (v14+)
- MongoDB
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## 🚀 Installation & Deployment

### 1. **Backend Setup**

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

**Expected Output:**
```
✅ MongoDB connected
✅ WhatsApp module loaded
✅ Notification services initialized
🚀 Server running on 5000
```

### 2. **Frontend Setup**

Frontend files are already in the root folder and automatically served by the backend.

Just visit: **http://localhost:5000**

---

## 📁 Project Structure

```
KCP_ORGANICS-2/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Dependencies
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── uploads/           # Product images
├── frontend/
│   └── users.html         # User management page
├── mongodb_data/          # Local database
├── home.html              # Home page
├── products.html          # Product listing
├── login.html             # Login page
├── signup.html            # Signup page
├── cart.html              # Shopping cart
├── checkout.html          # Checkout process
├── admin-dashboard.html   # Admin panel
├── styles.css             # Main styles (RESPONSIVE)
└── ... other pages
```

---

## ✅ Responsive Features Checklist

All pages are fully responsive for:
- ✅ 360px - Extra small phones
- ✅ 480px - Small phones
- ✅ 600px - Mobile devices
- ✅ 768px - Tablets
- ✅ 992px - Small laptops
- ✅ 1200px+ - Large desktops

### Tested Components:
- ✅ Hamburger menu (mobile navigation)
- ✅ Product grids (1-4 columns responsive)
- ✅ Shopping cart (mobile optimized)
- ✅ Checkout form (mobile-friendly)
- ✅ User authentication (responsive forms)
- ✅ Admin dashboard (adaptive layout)
- ✅ Carousels and videos
- ✅ All modals and popups

---

## 🔐 Admin Access

1. Visit: **http://localhost:5000/admin-dashboard.html**
2. Login with admin credentials
3. Manage:
   - Products & Stock
   - Orders & Deliveries
   - User Messages
   - Reviews & Ratings
   - Videos & Content

---

## 📱 Testing on Mobile

### Using Chrome DevTools:
1. Press `F12` to open DevTools
2. Click device icon (top-left of DevTools)
3. Select device or custom dimensions:
   - iPhone 12: 390px width
   - iPad: 768px width
   - Galaxy S21: 360px width

### Or test directly on phone:
1. Get your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On phone, visit: `http://<YOUR-IP>:5000`

---

## 🔧 Environment Variables

Create `.env` file in backend folder:
```
MONGODB_URI=mongodb://localhost:27017/kcp_organics
PORT=5000
NODE_ENV=production
```

---

## 📊 Database

### MongoDB Collections:
- `users` - Customer accounts
- `products` - Product catalog
- `orders` - Order history
- `messages` - Customer messages
- `reviews` - Product reviews
- `videos` - Media content
- `wishlists` - User wishlists
- `coupons` - Discount codes

### Reset Database:
```bash
# Remove old data
rm -rf mongodb_data/*

# Restart server to create fresh collections
npm start
```

---

## 🎨 Customization

### Colors:
Edit `styles.css`:
```css
--primary-color: #2e7d32  (Green)
--secondary-color: #dd610e (Orange)
--background: #dcf1d8
```

### Logo:
Replace `logo_final.png` with your logo

### Product Images:
Upload to `backend/uploads/` folder

---

## 📝 API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Add new product (admin)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id` - Update order

### Users
- `POST /user/signup` - Create account
- `POST /user/login` - User login
- `GET /api/users` - List users

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages` - Get all messages

Full API documentation in backend routes folder.

---

## 🐛 Troubleshooting

### Issue: Server won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Kill process if needed
taskkill /PID <PID> /F        # Windows
```

### Issue: MongoDB connection failed
```bash
# Make sure MongoDB is running
# Or create .env with correct URI
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/kcp_organics
```

### Issue: Images not loading
- Check `backend/uploads/` folder exists
- Ensure images are in correct format (jpg, png, webp, avif)
- Check browser console for 404 errors

### Issue: Mobile menu not working
- Check browser console (F12)
- Ensure JavaScript is enabled
- Clear browser cache

---

## ✨ Performance Tips

1. **Compression**: Enable gzip in production
2. **Caching**: Add cache headers for static files
3. **Images**: Optimize images before upload
4. **Database**: Add indexes to frequently queried fields
5. **CDN**: Use CDN for static files in production

---

## 📞 Support

### Files Updated for Responsiveness:
- ✅ `styles.css` - Main responsive styles
- ✅ `home.html` - Proper viewport meta tag
- ✅ `login.html` - Mobile form optimization  
- ✅ `signup.html` - Responsive signup
- ✅ `checkout.html` - Mobile-friendly checkout
- ✅ All product pages - Responsive grids
- ✅ All CSS files - Media queries

### For Issues:
1. Check browser console (F12)
2. Check server logs in terminal
3. Check MongoDB connection
4. Review error messages carefully

---

## 🎯 Next Steps

1. ✅ Start backend: `npm start`
2. ✅ Visit: `http://localhost:5000`
3. ✅ Test on mobile/tablet
4. ✅ Create test account
5. ✅ Add products via admin
6. ✅ Test checkout flow
7. ✅ Deploy to production

---

**Website is fully responsive and production-ready!** 🎉

Last Updated: April 18, 2026
