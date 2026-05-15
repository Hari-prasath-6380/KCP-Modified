# Quick Start Guide - Video Sections

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB running
- Server running (`node server.js`)

### Step 1: Start the Server
```bash
cd backend
node server.js
```

✅ Expected output:
```
🚀 Server running on 5000
✅ MongoDB connected
```

### Step 2: View the Pages

#### Home Page with Videos
Open browser: `http://localhost:5000/home.html`
- Scroll to **"Our Journey & Stories"** section
- Videos load automatically (if available in database)

#### About Us Page with Video Management
Open browser: `http://localhost:5000/about-us.html`
- Scroll to **"Why Choose KCP Organics"** section
- Videos display in grid format

### Step 3: Add Videos (Admin Only)

**Login as Admin:**
1. Go to `http://localhost:5000/login.html`
2. Use admin credentials
3. Return to `http://localhost:5000/about-us.html`

**Add a Video:**
1. Click **"+ Add Video"** button (top of video section)
2. Fill in the form:
   - **Title:** "Our Farm Tour" (required)
   - **Video URL:** Copy-paste YouTube/Vimeo link (required)
   - **Description:** "Beautiful organic farm overview" (optional)
   - **Thumbnail:** Leave empty for auto-detection (optional)
   - **Active:** Keep checked ✓
3. Click **"Add Video"**
4. Video appears in grid immediately! 🎉

### Example Video URLs

**YouTube (Full):**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**YouTube (Short):**
```
https://youtu.be/dQw4w9WgXcQ
```

**Vimeo:**
```
https://vimeo.com/123456
```

## 📱 Test Responsive Design

### Desktop View
- Open browser Developer Tools (F12)
- Videos show in 3-column grid
- Smooth animations and hover effects

### Tablet View
- Change width to 768px or less
- Videos show in 2-column grid
- Touch-friendly buttons

### Mobile View
- Change width to 480px or less
- Videos show in 1-column full-width
- Optimized for small screens

## ✅ Verify Everything Works

### Checklist:
- [ ] Home page loads without errors
- [ ] "Our Journey & Stories" section visible
- [ ] About Us page loads without errors
- [ ] "Why Choose KCP Organics" section visible
- [ ] YouTube video plays with controls
- [ ] Vimeo video plays correctly
- [ ] "+ Add Video" button visible when logged in as admin
- [ ] Videos load from database and display
- [ ] Mobile layout is responsive
- [ ] No console errors (F12 → Console)

## 🔧 Troubleshooting

### Server won't start?
```bash
# Make sure you're in the backend folder
cd c:\Users\User\Desktop\KCP_ORGANICS\backend
node server.js
```

### Videos not loading?
1. Check MongoDB is running
2. Refresh the page (Ctrl+Shift+R)
3. Check browser console (F12)
4. Verify API: `http://localhost:5000/api/videos`

### "+ Add Video" button not showing?
1. Make sure you're logged in
2. Make sure you logged in as **admin** (not regular user)
3. Check localStorage in DevTools
4. Reload the page

### Video playback failing?
1. Verify YouTube/Vimeo URL is correct
2. Make sure video is publicly available
3. Try a different video URL
4. Check browser console for errors

## 📚 Documentation Files

- **`VIDEO_SECTIONS_GUIDE.md`** - Complete feature documentation
- **`VIDEO_TESTING_CHECKLIST.md`** - Full testing procedures
- **`IMPLEMENTATION_COMPLETE.md`** - Implementation summary
- **`SETUP_AND_TESTING_GUIDE.md`** - Setup and testing guide
- **`ABOUT_US_FEATURE.md`** - Original About Us documentation

## 🎯 Key Features

### For Users
✅ Watch videos on About Us page
✅ Watch videos on Home page
✅ Responsive design on all devices
✅ Fullscreen video playback
✅ YouTube, Vimeo, and direct video support

### For Admin
✅ Add new videos with modal form
✅ Auto-detect video type (YouTube/Vimeo/Direct)
✅ Add optional description and thumbnail
✅ Toggle video visibility (Active/Inactive)
✅ Videos appear immediately after saving
✅ Manage videos by category (about-us, home)

### For Developers
✅ Clean, modular code
✅ Follows project conventions
✅ Well-documented functions
✅ RESTful API endpoints
✅ Easy to extend with new features

## 🎨 Colors & Styling

**Primary Color:** Green
- Dark: `#2e7d32`
- Light: `#558b2f`

**Secondary Color:** Orange
- Dark: `#dd610e`
- Light: `#ff8a50`

**Neutral:** Gray
- Text: `#333`
- Light: `#f8f9fa`

## 📊 API Quick Reference

**Get About Us Videos:**
```
GET http://localhost:5000/api/videos?category=about-us&active=true
```

**Get Home Videos:**
```
GET http://localhost:5000/api/videos?category=home&active=true
```

**Add Video (Admin Only):**
```
POST http://localhost:5000/api/videos
Authorization: Bearer YOUR_TOKEN
Body: {
    "title": "Video Title",
    "videoUrl": "https://youtube.com/...",
    "description": "Optional description",
    "category": "about-us",
    "isActive": true
}
```

## 🎬 Video Requirements

| Requirement | Details |
|-------------|---------|
| **Hosting** | YouTube, Vimeo, or your own server |
| **Format** | MP4, WebM for direct URLs |
| **Public** | Must be publicly available |
| **URL** | Must be valid and accessible |
| **Size** | No limit (hosted elsewhere) |

## ⚡ Performance Tips

1. **Use YouTube/Vimeo** - Better performance than direct URLs
2. **Add Thumbnail** - For direct video URLs
3. **Keep Description Short** - Faster rendering
4. **Test Responsiveness** - Different devices
5. **Monitor API Calls** - Check Network tab in DevTools

## 🔐 Security Notes

- Only authenticated users can manage videos
- Only admin users can add/edit/delete videos
- Regular users can only view videos
- API endpoints require authorization header
- CORS configured for same-origin requests

## 💡 Tips & Tricks

### YouTube Tips
- Use `youtu.be/VIDEO_ID` short links
- Videos load faster with modestbranding
- Full controls available for users

### Vimeo Tips
- Videos show quality selector
- Player customization available
- Professional appearance

### Admin Tips
- Refresh page after adding video to see it in list
- Use meaningful titles and descriptions
- Keep videos active to show them
- Test on mobile before publishing

## 🆘 Get Help

**Check Files:**
- `about-us.js` - About Us video functions
- `home.js` - Home page video functions
- `about-us.css` - Styling for modals and videos
- `home-videos.css` - Home page video styling
- `backend/routes/videos.js` - API endpoints

**API Issues:**
- Check `/api/videos` endpoint
- Verify authorization token
- Check MongoDB connection
- Review request/response in Network tab

**Display Issues:**
- Check CSS classes match HTML
- Verify JavaScript files loaded
- Clear browser cache
- Try different browser
- Check console for errors

## 📞 Contact

For issues or questions:
1. Check documentation files
2. Review code comments
3. Test in different browser
4. Check DevTools console
5. Review backend logs

---

**Ready to go?** 🎉

Start with:
```bash
cd backend && node server.js
```

Then open `http://localhost:5000/home.html` to see your new video sections in action!
