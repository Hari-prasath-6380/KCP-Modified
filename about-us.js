const API_URL = 'http://localhost:5000/api';

// Load About Us videos on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAboutUsVideos();
    checkUserAuthentication();
    setupVideoForm();
});

// Check if user is logged in and is admin
function checkUserAuthentication() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const userNameSpan = document.getElementById('userName');
    const logoutLink = document.getElementById('logoutLink');
    const adminAddVideoBtn = document.getElementById('adminAddVideoBtn');

    if (token) {
        loginLink.style.display = 'none';
        signupLink.style.display = 'none';
        userNameSpan.style.display = 'inline';
        userNameSpan.textContent = userName || 'User';
        logoutLink.style.display = 'inline';
        
        // Show admin button if user is admin
        if (userRole === 'admin' && adminAddVideoBtn) {
            adminAddVideoBtn.style.display = 'block';
        }
        
        // Load cart count
        loadCartCount();
    }
}

// Load cart count
function loadCartCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);
    fetch(`${baseUrl}/api/cart`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.data) {
            const count = data.data.items ? data.data.items.length : 0;
            document.getElementById('cartBadge').textContent = count;
        }
    })
    .catch(err => console.log('Error loading cart:', err));
}

// Load About Us videos
function loadAboutUsVideos() {
    fetch(`${API_URL}/videos?category=about-us&active=true`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data && data.data.length > 0) {
                displayVideos(data.data);
            } else {
                displayNoVideos();
            }
        })
        .catch(err => {
            console.error('Error loading videos:', err);
            displayNoVideos();
        });
}

// Display videos
function displayVideos(videos) {
    const videosGrid = document.getElementById('videosGrid');
    const noVideosMessage = document.getElementById('noVideosMessage');
    
    // Clear existing videos
    videosGrid.innerHTML = '';
    
    if (noVideosMessage) {
        noVideosMessage.style.display = 'none';
    }

    videos.forEach((video, index) => {
        const videoItem = createVideoElement(video);
        videosGrid.appendChild(videoItem);
        
        // Add animation delay
        setTimeout(() => {
            videoItem.style.opacity = '1';
            videoItem.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Create video element
function createVideoElement(video) {
    const videoItem = document.createElement('div');
    videoItem.className = 'video-item';
    videoItem.style.opacity = '0';
    videoItem.style.transform = 'translateY(20px)';
    videoItem.style.transition = 'all 0.5s ease';

    const videoThumbnail = document.createElement('div');
    videoThumbnail.className = 'video-thumbnail';

    // Check if video URL is YouTube or Vimeo
    if (video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be')) {
        const videoId = extractYoutubeId(video.videoUrl);
        videoThumbnail.innerHTML = `
            <div class="video-wrapper">
                <iframe 
                    width="100%" 
                    height="315"
                    src="https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1" 
                    title="${video.title}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border: none; border-radius: 8px;">
                </iframe>
            </div>
        `;
    } else if (video.videoUrl.includes('vimeo.com')) {
        const videoId = extractVimeoId(video.videoUrl);
        videoThumbnail.innerHTML = `
            <div class="video-wrapper">
                <iframe 
                    width="100%" 
                    height="315"
                    src="https://player.vimeo.com/video/${videoId}?h=&badge=0&autopause=0&player_id=0&app_id=58479" 
                    title="${video.title}"
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen
                    style="border: none; border-radius: 8px;">
                </iframe>
            </div>
        `;
    } else if (video.videoUrl.includes('/uploads/') || video.videoUrl.endsWith('.mp4') || video.videoUrl.endsWith('.webm')) {
        // Direct video file upload
        let videoUrl = video.videoUrl;
        
        // If URL is relative, make it absolute
        if (!videoUrl.startsWith('http')) {
            // Extract the server URL from API_URL
            const serverUrl = API_URL.split('/api')[0];
            videoUrl = serverUrl + videoUrl;
        }
        
        console.log('Playing direct video:', videoUrl);
        
        videoThumbnail.innerHTML = `
            <div class="video-wrapper">
                <video 
                    controls
                    preload="metadata"
                    playsinline
                    style="width: 100%; height: 100%; background: #000; display: block;">
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
    } else if (video.thumbnailUrl) {
        const VIDEO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22320%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23999%22%3ENo Video%3C/text%3E%3C/svg%3E';
        const img = document.createElement('img');
        img.src = video.thumbnailUrl;
        img.alt = video.title;
        img.onerror = () => img.src = VIDEO_PLACEHOLDER;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        videoThumbnail.appendChild(img);
    } else {
        const VIDEO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22320%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23999%22%3ENo Video%3C/text%3E%3C/svg%3E';
        const img = document.createElement('img');
        img.src = VIDEO_PLACEHOLDER;
        img.alt = video.title;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        videoThumbnail.appendChild(img);
    }

    const videoInfo = document.createElement('div');
    videoInfo.className = 'video-info';
    
    const title = document.createElement('h3');
    title.textContent = video.title;
    videoInfo.appendChild(title);

    if (video.description) {
        const description = document.createElement('p');
        description.textContent = video.description.substring(0, 100) + (video.description.length > 100 ? '...' : '');
        videoInfo.appendChild(description);
    }

    videoItem.appendChild(videoThumbnail);
    videoItem.appendChild(videoInfo);

    return videoItem;
}

// Extract YouTube video ID
function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// Extract Vimeo video ID
function extractVimeoId(url) {
    const regExp = /(https?:\/\/)?(www\.)?(vimeo\.com\/)(\d+)/;
    const match = url.match(regExp);
    return match ? match[4] : url;
}

// Toggle cart
function toggleCart() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'cart.html';
    } else {
        window.location.href = 'login.html';
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    location.reload();
}

// Display no videos message
function displayNoVideos() {
    const noVideosMessage = document.getElementById('noVideosMessage');
    if (noVideosMessage) {
        noVideosMessage.style.display = 'flex';
    }
}

// Setup video form
function setupVideoForm() {
    const form = document.getElementById('addAboutVideoForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAboutUsVideo();
        });
    }
}

// Switch between video source tabs
function switchVideoSourceTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update required attribute based on selected tab
    if (tabName === 'upload-tab') {
        document.getElementById('aboutVideoFile').required = true;
        document.getElementById('aboutVideoUrl').required = false;
    } else {
        document.getElementById('aboutVideoFile').required = false;
        document.getElementById('aboutVideoUrl').required = true;
    }
}

// Open add video modal
function openAddAboutVideoModal() {
    const modal = document.getElementById('addAboutVideoModal');
    if (modal) {
        modal.style.display = 'block';
        // Clear form
        document.getElementById('addAboutVideoForm').reset();
    }
}

// Close add video modal
function closeAddAboutVideoModal() {
    const modal = document.getElementById('addAboutVideoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save About Us video
function saveAboutUsVideo() {
    const token = localStorage.getItem('token');
    const title = document.getElementById('aboutVideoTitle').value.trim();
    const description = document.getElementById('aboutVideoDescription').value.trim();
    const thumbnailUrl = document.getElementById('aboutVideoThumbnail').value.trim();
    const isActive = document.getElementById('aboutVideoActive').checked;
    
    // Check which tab is active
    const uploadTab = document.getElementById('upload-tab');
    const isUploadTab = uploadTab.classList.contains('active');
    
    if (isUploadTab) {
        // Handle file upload
        const videoFile = document.getElementById('aboutVideoFile').files[0];
        
        if (!title || !videoFile) {
            alert('Please fill in required fields');
            return;
        }
        
        // Check file size (100MB limit)
        const maxSize = 100 * 1024 * 1024;
        if (videoFile.size > maxSize) {
            alert('File size exceeds 100MB limit');
            return;
        }
        
        uploadVideoFile(videoFile, title, description, thumbnailUrl, isActive, token);
    } else {
        // Handle URL upload
        const videoUrl = document.getElementById('aboutVideoUrl').value.trim();
        
        if (!title || !videoUrl) {
            alert('Please fill in required fields');
            return;
        }
        
        uploadVideoUrl(title, videoUrl, description, thumbnailUrl, isActive, token);
    }
}

// Upload video file
function uploadVideoFile(file, title, description, thumbnailUrl, isActive, token) {
    const formData = new FormData();
    formData.append('video', file);
    
    // Show progress
    const uploadProgress = document.getElementById('uploadProgress');
    uploadProgress.style.display = 'block';
    
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            document.getElementById('progressFill').style.width = percentComplete + '%';
            document.getElementById('progressText').textContent = Math.round(percentComplete) + '% Uploading...';
        }
    });
    
    xhr.addEventListener('load', () => {
        uploadProgress.style.display = 'none';
        
        try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 200 && response.success) {
                const videoUrl = response.videoUrl || (response.data && response.data.videoUrl);
                if (videoUrl) {
                    // Now save the video metadata
                    const videoData = {
                        title,
                        videoUrl: videoUrl,
                        description,
                        thumbnailUrl,
                        category: 'about-us',
                        isActive
                    };
                    
                    fetch(`${API_URL}/videos`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(videoData)
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert('Video uploaded and added successfully!');
                            closeAddAboutVideoModal();
                            loadAboutUsVideos();
                        } else {
                            alert('Error adding video: ' + (data.message || 'Unknown error'));
                        }
                    })
                    .catch(err => {
                        console.error('Error:', err);
                        alert('Error adding video');
                    });
                } else {
                    alert('Error: No video URL returned from server');
                }
            } else {
                alert('Error uploading file: ' + (response.message || 'Unknown error'));
            }
        } catch (e) {
            console.error('Parse error:', e);
            alert('Error processing upload response: ' + e.message);
        }
    });
    
    xhr.addEventListener('error', (event) => {
        uploadProgress.style.display = 'none';
        console.error('Upload error:', event);
        alert('Error uploading file. Please check your connection and try again.');
    });
    
    xhr.addEventListener('abort', () => {
        uploadProgress.style.display = 'none';
        alert('Upload cancelled');
    });
    
    // Don't set Content-Type header - let the browser set it for FormData
    xhr.open('POST', `${API_URL}/uploads/upload-video`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
}

// Upload video URL
function uploadVideoUrl(title, videoUrl, description, thumbnailUrl, isActive, token) {
    const videoData = {
        title,
        videoUrl,
        description,
        thumbnailUrl,
        category: 'about-us',
        isActive
    };

    fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Video added successfully!');
            closeAddAboutVideoModal();
            loadAboutUsVideos(); // Reload videos
        } else {
            alert('Error adding video: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Error adding video');
    });
}
