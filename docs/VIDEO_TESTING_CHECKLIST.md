# Video Sections - Testing Checklist

## Quick Start

**Server Status:** ✅ Running on `http://localhost:5000`
**Backend:** ✅ Node.js + MongoDB connected
**Frontend:** ✅ HTML5 + CSS3 + Vanilla JS

## Pages to Test

### 1. About Us Page
**URL:** `http://localhost:5000/about-us.html`

**Visual Checks:**
- [ ] Page loads without errors
- [ ] "Why Choose KCP Organics" section visible
- [ ] Video grid displays properly
- [ ] "No videos available" message shows (if no videos in DB)
- [ ] Responsive on mobile/tablet/desktop

**Admin Features (Login as Admin First):**
- [ ] "+ Add Video" button appears
- [ ] Click button opens modal form
- [ ] Form has fields: Title, URL, Description, Thumbnail, Active checkbox
- [ ] Submit button works
- [ ] Cancel button closes modal

**Add Test Videos:**
1. Click "+ Add Video"
2. Fill in:
   - Title: "Farm Tour"
   - URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Description: "See our organic farming process"
   - Active: ✓ checked
3. Click "Add Video"
4. Video should appear in grid immediately

### 2. Home Page
**URL:** `http://localhost:5000/home.html`

**Visual Checks:**
- [ ] Page loads without errors
- [ ] "Our Journey & Stories" section visible
- [ ] Video grid displays properly with 3 columns on desktop
- [ ] Responsive layout on tablet (2 columns)
- [ ] Responsive layout on mobile (1 column)
- [ ] "No videos available" message shows (if no videos in DB)

**Add Test Videos for Home:**
1. Admin Dashboard → Videos section
2. Add video with category: "home"
3. Videos should appear on home page automatically

### 3. Video Playback Tests

**YouTube Video Playback:**
- [ ] Video displays with player controls
- [ ] Play/pause button works
- [ ] Volume control works
- [ ] Fullscreen button works
- [ ] Video title visible above player

**Vimeo Video Playback:**
- [ ] Video displays with player controls
- [ ] Play/pause button works
- [ ] Fullscreen works
- [ ] Quality selector appears

**Direct Video URL:**
- [ ] Thumbnail displays if provided
- [ ] Placeholder shows if no thumbnail
- [ ] Video info (title, description) displays

## Video Format Tests

### YouTube URLs to Test:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
```

### Vimeo URLs to Test:
```
https://vimeo.com/123456
```

## Responsive Design Tests

### Desktop (1920px+)
- [ ] Video grid shows 3 columns
- [ ] Proper spacing between items
- [ ] Hover effects work
- [ ] No horizontal scroll

### Tablet (768px)
- [ ] Video grid shows 2 columns
- [ ] Content centers properly
- [ ] Touch interactions work
- [ ] Modal displays correctly

### Mobile (480px)
- [ ] Video grid shows 1 column
- [ ] Full width videos
- [ ] Form inputs accessible
- [ ] Keyboard appears for text inputs

## Authentication Tests

### Not Logged In:
- [ ] Videos load and play
- [ ] "+ Add Video" button NOT visible on About Us
- [ ] Can view but not modify videos

### Logged In as Admin:
- [ ] "+ Add Video" button visible on About Us
- [ ] Can add new videos
- [ ] Videos appear immediately after saving
- [ ] Logout button works

### Logged In as Regular User:
- [ ] Videos load and play
- [ ] "+ Add Video" button NOT visible
- [ ] Cannot modify videos

## Error Handling Tests

### Missing Required Fields:
- [ ] Submit empty form → Shows error alert
- [ ] Submit without Title → Shows error
- [ ] Submit without URL → Shows error

### Invalid URLs:
- [ ] Add invalid YouTube URL → Shows error or placeholder
- [ ] Add invalid Vimeo URL → Shows error or placeholder

### Network Issues:
- [ ] Turn off internet
- [ ] Refresh page
- [ ] Should show "No videos available" gracefully
- [ ] No JS errors in console

## Performance Tests

- [ ] Page loads in < 2 seconds
- [ ] Videos load asynchronously (page doesn't block)
- [ ] Smooth animations (no stuttering)
- [ ] No memory leaks (check DevTools)

## Browser Compatibility

- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Console Tests

Open DevTools (F12) → Console tab:
- [ ] No JavaScript errors
- [ ] No 404 errors for resources
- [ ] Video API calls successful (200 status)
- [ ] No CORS errors

## File Structure Verification

**New Files Created:**
```
✅ about-us.js (Updated with admin functions)
✅ home.js (New video loading for home page)
✅ home-videos.css (New styling for home videos)
✅ VIDEO_SECTIONS_GUIDE.md (This documentation)
```

**Updated Files:**
```
✅ home.html (Added video section + CSS/JS links)
✅ about-us.html (Added modal form + admin button)
✅ about-us.css (Added modal & video styling)
```

## Verification Checklist

**Before Launch:**
- [ ] Server is running (`node server.js` in backend)
- [ ] MongoDB is connected
- [ ] All files are in correct locations
- [ ] No console errors in browser
- [ ] Videos play correctly
- [ ] Admin can add/edit/delete videos
- [ ] Regular users see read-only videos
- [ ] Responsive design works on all devices
- [ ] All buttons and forms work as expected

## Quick Test Script

```javascript
// Run in browser console to test API

// Test About Us videos API
fetch('http://localhost:5000/api/videos?category=about-us&active=true')
  .then(r => r.json())
  .then(d => console.log('About Us Videos:', d));

// Test Home videos API
fetch('http://localhost:5000/api/videos?category=home&active=true')
  .then(r => r.json())
  .then(d => console.log('Home Videos:', d));
```

## Known Limitations

- Videos require YouTube/Vimeo account or direct URL hosting
- Direct video URLs must support CORS
- Admin actions require authentication
- Thumbnail URLs must be accessible
- Large video files may take time to load

## Support & Troubleshooting

### Videos not loading:
1. Check MongoDB connection
2. Verify API endpoint: `GET /api/videos`
3. Check browser console for errors
4. Verify video category matches (about-us, home)
5. Check `isActive` flag is true

### Playback issues:
1. Verify YouTube/Vimeo URL is correct
2. Check if video is publicly available
3. Try different browser
4. Clear browser cache
5. Check CORS settings on backend

### Admin button not showing:
1. Login required
2. Must have `role: 'admin'`
3. Check localStorage for `userRole`

### Form not submitting:
1. Check required fields are filled
2. Verify authentication token
3. Check API endpoint: `POST /api/videos`
4. Check browser console for errors
5. Verify admin permissions

## Contact

For issues or questions, check:
- API documentation: `ABOUT_US_FEATURE.md`
- Setup guide: `SETUP_AND_TESTING_GUIDE.md`
- Backend routes: `backend/routes/videos.js`
