# About Us Page - Feature Documentation

## Overview
The About Us page is a modern, professional page showcasing KCP Organics' story, mission, vision, certifications, team, and videos. It includes a comprehensive admin dashboard feature for managing videos that appear on the About Us page.

## Features

### Frontend Features

#### About Us Page (`about-us.html`)
- **Hero Section**: Eye-catching hero banner with company tagline
- **Company Story**: About KCP Organics with image and key highlights
- **Mission & Vision**: Three-card section displaying company values
- **Certifications**: 6 certification cards including FSSAI, Organic Certified, ISO 22000, Lab Tested, Fair Trade, and Eco-Friendly
- **Gallery**: 6-item gallery showcasing farms and facilities with hover effects
- **About Us Videos Section**: Dynamically loads videos from admin dashboard
- **Team Section**: Features company team members with profiles
- **Stats Section**: Displays key metrics (hectares, products, customers, years)
- **Call-to-Action**: Button linking to products page
- **Footer**: Complete footer with links and social media

#### Styling (`about-us.css`)
- Modern, responsive design
- Gradient backgrounds and smooth animations
- Hover effects on cards and images
- Mobile-responsive with breakpoints at 768px and 480px
- Professional color scheme (green #2e7d32, orange #dd610e)

#### JavaScript (`about-us.js`)
- Loads About Us category videos from API
- Supports YouTube, Vimeo, and direct video URLs
- Responsive video player embeds
- Cart functionality integration
- User authentication checks

### Admin Dashboard Features

#### Admin Dashboard Section: "About Us Videos"
Located in the admin panel sidebar under "About Us" section.

**Features:**
- View all About Us videos
- Add new videos
- Edit existing videos
- Toggle video visibility (active/inactive)
- Delete videos
- Change video display order
- See statistics: Total videos, Active videos, Total views

**Available Actions:**
1. **Add Video**: Opens a modal form to add a new video
2. **Edit Video**: Click edit button to modify video details
3. **Toggle Status**: Show/hide videos on the public page
4. **Delete Video**: Remove videos from the system

#### Admin Video Form Fields
- **Video Title** (Required): Name of the video
- **Video URL** (Required): YouTube, Vimeo, or direct video URL
- **Thumbnail URL** (Optional): Custom thumbnail image
- **Description** (Optional): Video description
- **Display Order**: Order in which videos appear (default: 0)
- **Active**: Checkbox to make video visible on public page

## API Endpoints

### Videos API
All endpoints are available at `https://kcp-organics-1.onrender.com/api/videos`

#### GET /api/videos
Get all active videos (filtered by category)
```
Parameters:
- active=true (default)
- limit=20 (default)
- category=about-us (to get About Us videos)

Example:
GET /api/videos?category=about-us&active=true
```

#### GET /api/videos/:id
Get a single video by ID (increments view count)

#### POST /api/videos
Create a new video
```json
{
    "title": "Video Title",
    "videoUrl": "https://youtube.com/watch?v=...",
    "thumbnailUrl": "https://...",
    "description": "Video description",
    "category": "about-us",
    "displayOrder": 0,
    "isActive": true
}
```

#### PATCH /api/videos/:id
Update a video
```json
{
    "title": "Updated Title",
    "description": "Updated description",
    "displayOrder": 1,
    "isActive": true
}
```

#### DELETE /api/videos/:id
Delete a video

#### PATCH /api/videos/:id/toggle
Toggle video active status (on/off)

## Database Model

### Video Schema
```javascript
{
    title: String (required),
    videoUrl: String (required),
    thumbnailUrl: String (optional),
    productId: ObjectId (optional, for product videos),
    productName: String (optional),
    productLink: String (optional),
    description: String (optional),
    category: String (default: 'General'),
    isActive: Boolean (default: true),
    displayOrder: Number (default: 0),
    views: Number (default: 0),
    createdAt: Date,
    updatedAt: Date
}
```

## How to Use

### For Users
1. Navigate to "About Us" link in the main navigation menu
2. Scroll through the different sections
3. Watch videos in the "Why Choose KCP Organics" section
4. Learn about company story, mission, certifications, and team

### For Admins
1. Log in to the admin dashboard
2. Click "About Us" in the left sidebar
3. **To Add a Video:**
   - Click "Add Video" button
   - Fill in the video details (title and URL are required)
   - Click "Save Video"
   
4. **To Edit a Video:**
   - Click the edit (pencil) icon next to the video
   - Modify the details
   - Click "Save Video"
   
5. **To Hide a Video:**
   - Click the eye icon to toggle visibility
   - Active videos show on the public page
   
6. **To Delete a Video:**
   - Click the trash icon
   - Confirm the deletion

## Supported Video Sources

The About Us page supports three types of video sources:

1. **YouTube Videos**
   - Full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Short URL: `https://youtu.be/VIDEO_ID`

2. **Vimeo Videos**
   - URL: `https://vimeo.com/VIDEO_ID`

3. **Direct URLs**
   - Any direct video URL (MP4, WebM, etc.)
   - Requires thumbnail URL to be provided

## File Structure

```
KCP_ORGANICS/
├── about-us.html          # Main About Us page
├── about-us.css           # Styling for About Us page
├── about-us.js            # Frontend functionality
├── admin-dashboard.html   # Admin panel with About Us section
├── admin-script.js        # Admin functionality (includes About Us management)
├── admin-styles.css       # Admin panel styles
└── backend/
    ├── routes/
    │   └── videos.js      # Video API endpoints
    └── models/
        └── Video.js       # Video database model
```

## Customization Guide

### Adding More Certifications
Edit the Certifications section in `about-us.html` to add more certification cards. Each card has:
- Icon (from Font Awesome)
- Title
- Description
- Badge text

### Changing Colors
Edit `about-us.css`:
- Primary Green: `#2e7d32`
- Secondary Green: `#558b2f`
- Primary Orange: `#dd610e`
- Secondary Orange: `#ff8a50`

### Modifying Statistics
Update the stats section in `about-us.html` by editing:
- `#farmCount`: Number of hectares
- `#productCount`: Number of products
- `#customerCount`: Number of customers
- `#yearCount`: Years of operation

### Changing Gallery Images
Replace placeholder image URLs in the gallery section with actual images:
```html
<img src="your-image-url" alt="description">
```

## Browser Compatibility
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Design
- Desktop: Full layout with multi-column grids
- Tablet (768px): 2-column layout
- Mobile (480px): Single column layout

## Performance Optimization
- Lazy loading for images (use loading="lazy" attribute)
- Video embeds use iframe for efficient loading
- CSS animations use GPU-accelerated properties
- Placeholder images used for gallery items

## Future Enhancements
- Image galleries with lightbox functionality
- Video testimonials from customers
- Team member social media links
- Blog integration
- Newsletter signup
- Live chat integration
- Downloadable company brochures

## Troubleshooting

### Videos not loading
- Check that the video URL is correct
- Ensure the video is accessible (not private on YouTube)
- Check browser console for CORS errors
- Verify the video category is set to "about-us"

### Admin panel not showing About Us section
- Clear browser cache
- Refresh the admin page
- Check that admin is logged in
- Verify user role is "admin"

### Images not displaying
- Check image URLs are accessible
- Verify image file formats (PNG, JPG, GIF supported)
- Use placeholder service if images are temporary

## Support
For issues or questions, contact the development team or check the main project documentation.
