# 🌿 KCP ORGANICS - QUICK REFERENCE CARD

## 🚀 Getting Started

### Start the Website:
```bash
cd backend
npm install
npm start
```

Then visit: **http://localhost:5000**

---

## 📱 Device Support

✅ **Mobile Phones** (360px - 480px)  
✅ **Tablets** (600px - 768px)  
✅ **Laptops** (768px - 1200px)  
✅ **Desktops** (1200px+)  

---

## 🎯 Main Features

### For Customers:
- 🛍 Browse products by category
- 🛒 Add items to cart
- 💳 Checkout securely
- 📦 Track orders
- ⭐ Leave reviews
- 💬 Live chat support
- 📧 Newsletter signup

### For Admin:
- 📊 View analytics
- 🛍 Manage products
- 📦 Process orders
- 👥 Manage users
- 💬 Read messages
- 📸 Upload videos
- 📈 Track stock

---

## 🌐 Website Links

| Page | URL |
|------|-----|
| Home | `/` or `/home.html` |
| Products | `/products.html` |
| About Us | `/about-us.html` |
| Contact | `/contact.html` |
| Login | `/login.html` |
| Signup | `/signup.html` |
| Cart | `/cart.html` |
| Admin | `/admin-dashboard.html` |

---

## 👤 Test Accounts

### Admin Account:
- **Email**: admin@kcporganics.com
- **Password**: admin123

### Customer Account:
- **Email**: customer@kcporganics.com
- **Password**: password123

*(Set up your own accounts for production)*

---

## 📂 Important Folders

```
KCP_ORGANICS-2/
├── backend/             # Server files
│   └── uploads/        # Product images
├── admin-dashboard.html # Admin panel
├── home.html           # Homepage
├── products.html       # Product listing
├── cart.html           # Shopping cart
├── checkout.html       # Checkout page
└── styles.css          # Main stylesheet
```

---

## 🔧 API Base URL

**Development**: `http://localhost:5000/api`  
**Production**: `https://kcp-organics-1.onrender.com/api`

### Common Endpoints:
- `GET /api/products` - List all products
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Order details
- `POST /api/messages` - Send message

---

## 🐛 Troubleshooting

### Server won't start?
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000
# Kill the process if needed
taskkill /PID <PID> /F
```

### MongoDB connection fails?
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database name is correct

### Images not loading?
- Check `backend/uploads/` folder
- Verify image file names in database
- Check browser console for 404 errors

### Mobile menu not working?
- Clear browser cache (Ctrl+Shift+Delete)
- Check JavaScript console for errors
- Verify hamburger menu CSS is loaded

---

## 📝 Configuration

### Environment Variables (.env):
```
MONGODB_URI=mongodb://localhost:27017/kcp_organics
PORT=5000
NODE_ENV=production
```

### Update Colors:
Edit `styles.css`:
- Primary: `#2e7d32` (Green)
- Secondary: `#dd610e` (Orange)
- Background: `#dcf1d8`

### Update Logo:
Replace `logo_final.png` with your logo (same name)

---

## 📊 Admin Features

### Products Management:
- Add/Edit/Delete products
- Manage stock levels
- Upload product images
- Set prices and discounts

### Order Management:
- View all orders
- Update order status
- Download invoices
- Track shipments

### User Management:
- View registered users
- Manage user accounts
- View user activity

### Messages:
- Read customer messages
- Respond to inquiries
- Archive old messages

---

## 🔐 Security Tips

✅ Change default passwords immediately  
✅ Use strong admin password  
✅ Keep MongoDB secure  
✅ Validate all user inputs  
✅ Use HTTPS in production  
✅ Update Node.js regularly  

---

## 📞 Support Resources

1. **Browser Console** (F12) - Check for errors
2. **Server Terminal** - View server logs
3. **MongoDB Compass** - Database management
4. **Documentation Files**:
   - DEPLOYMENT_GUIDE.md
   - RESPONSIVE_WEBSITE_DELIVERY.md
   - FINAL_DELIVERY_SUMMARY.md

---

## ✨ Quick Tips

- **Responsive Testing**: Use Chrome DevTools (F12) → Device toolbar
- **Add Product**: Use admin dashboard → Products → Add New
- **Check Orders**: Admin dashboard → Orders
- **View Messages**: Admin dashboard → Messages
- **Download Invoices**: Customer my-orders → Download Receipt

---

## 🎯 Responsive Breakpoints

```css
360px  - Extra small phones
480px  - Small phones
600px  - Mobile devices
768px  - Tablets
992px  - Small laptops
1200px - Large desktops
1920px - Ultra-wide screens
```

---

## 📋 Maintenance Checklist

- [ ] Backup database regularly
- [ ] Monitor server logs
- [ ] Update product inventory
- [ ] Process customer orders
- [ ] Respond to messages
- [ ] Update testimonials/reviews
- [ ] Test checkout flow monthly
- [ ] Review analytics

---

## 🎉 Ready to Launch!

Your website is **fully responsive** and **production-ready**.

**Last Updated**: April 18, 2026  
**Status**: ✅ Ready for Delivery

---

For detailed information, see:
- 📄 DEPLOYMENT_GUIDE.md
- 📄 RESPONSIVE_WEBSITE_DELIVERY.md
- 📄 FINAL_DELIVERY_SUMMARY.md
