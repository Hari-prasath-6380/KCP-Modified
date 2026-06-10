const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.endsWith('.local');
const API_URL = isLocalhost ? `http://${window.location.hostname}:5000/api` : window.location.origin + '/api';
const IMAGE_BASE_URL = isLocalhost ? `http://${window.location.hostname}:5000` : window.location.origin;
let uploadedImageUrl = ''; // Store uploaded image URL
let isImageUploading = false; // Track if image is currently uploading

// Log that script is loaded
console.log('✅ admin-script.js loaded successfully');
console.log('🔗 API_URL:', API_URL);
console.log('🔗 IMAGE_BASE_URL:', IMAGE_BASE_URL);

// ===== IMAGE ERROR HANDLER =====
window.handleAdminImageError = function (img) {
    img.style.display = 'none';
    const container = img.parentElement;
    if (container) {
        container.innerHTML = '<i class="fas fa-image" style="color:#ccc; font-size:24px;"></i>';
    }
};

// ===== TEST FUNCTION FOR DEBUGGING =====
window.testClickHandler = function () {
    console.log('🧪 Test function called successfully! Buttons and click handlers are working.');
};
console.log('✅ Test function registered as window.testClickHandler()');

// ===== LOCAL STORAGE HELPER =====
const AdminStorage = {
    // Dashboard Analytics
    setDashboardMetrics: (metrics) => localStorage.setItem('dashboardMetrics', JSON.stringify(metrics)),
    getDashboardMetrics: () => JSON.parse(localStorage.getItem('dashboardMetrics') || '{}'),

    // Sales Data
    setSalesData: (data) => localStorage.setItem('salesData', JSON.stringify(data)),
    getSalesData: () => JSON.parse(localStorage.getItem('salesData') || '[]'),

    // User Actions Log
    setUserLog: (log) => localStorage.setItem('userActivityLog', JSON.stringify(log)),
    getUserLog: () => JSON.parse(localStorage.getItem('userActivityLog') || '[]'),

    // Analytics Cache
    setAnalytics: (analytics) => localStorage.setItem('adminAnalytics', JSON.stringify(analytics)),
    getAnalytics: () => JSON.parse(localStorage.getItem('adminAnalytics') || '{}'),

    // Add activity to log
    addActivity: (activity) => {
        const log = AdminStorage.getUserLog();
        log.push({ ...activity, timestamp: new Date().toISOString() });
        AdminStorage.setUserLog(log.slice(-100)); // Keep last 100 activities
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin Dashboard DOMContentLoaded triggered');
    loadDashboardData();
    setupNavigation();
    setupProductForm();
    setupUserForm();
    setupImageUpload();
    setupVideoUpload();
    setupRecipeVideoUpload();
    setupDocxImport();
    initializeAnalytics();
    loadReviewsBadge();
    loadVideosBadge();
    // Pre-load the category autocomplete so it's ready when the user opens the product form
    loadCategoriesForSelect();
    console.log('✅ All setup functions called');

    // Setup About Us Video Form
    const aboutUsVideoForm = document.getElementById('aboutUsVideoForm');
    if (aboutUsVideoForm) {
        aboutUsVideoForm.addEventListener('submit', saveAboutUsVideo);
    }

    // Load orders on page load with a small delay to ensure DOM is ready
    setTimeout(() => {
        if (document.getElementById('ordersTable')) {
            loadOrders();
        }
    }, 100);
});

// ===== NAVIGATION =====
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Load section data
            if (section === 'products') loadProducts();
            if (section === 'users') loadUsers();
            if (section === 'messages') loadMessages();
            if (section === 'orders') loadOrders();
            if (section === 'reviews') loadReviews();
            if (section === 'videos') loadVideos();
            if (section === 'recipevideos') loadRecipeVideos();
            if (section === 'aboutus') loadAboutUsVideos();
        });
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section-content');
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Product Management',
        'users': 'User Management',
        'messages': 'Messages',
        'orders': 'Customer Orders',
        'reviews': 'Customer Reviews',
        'videos': 'Shop by Videos',
        'recipevideos': 'Recipe Videos',
        'aboutus': 'About Us Videos',
        'aboutusimages': 'About Us Images'
    };

    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.getElementById('sectionTitle').textContent = titles[sectionId];
}

// ===== DASHBOARD DATA =====
async function loadDashboardData() {
    try {
        const [usersRes, productsRes, messagesRes, unreadRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/users/count/total`),
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/messages`),
            fetch(`${API_URL}/messages/count/unread`),
            fetch(`${API_URL}/orders`)
        ]);

        const usersData = await usersRes.json();
        const productsData = await productsRes.json();
        const messagesData = await messagesRes.json();
        const unreadData = await unreadRes.json();
        const ordersData = await ordersRes.json();

        document.getElementById('totalUsers').textContent = usersData.totalUsers || 0;
        document.getElementById('totalProducts').textContent = productsData.data?.length || 0;
        document.getElementById('totalMessages').textContent = messagesData.data?.length || 0;
        document.getElementById('unreadMessages').textContent = unreadData.unreadCount || 0;
        document.getElementById('messageBadge').textContent = unreadData.unreadCount || 0;

        // Count pending orders
        const pendingOrders = ordersData.data?.filter(o => o.orderStatus === 'pending').length || 0;
        document.getElementById('orderBadge').textContent = pendingOrders;

        // Update analytics
        updateAnalyticsDisplay();
        displayCustomerAnalytics();
        displayRevenueAnalytics();

        AdminStorage.addActivity({
            type: 'dashboard_loaded',
            action: 'Dashboard data refreshed'
        });
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// ===== PRODUCTS MANAGEMENT =====
async function loadProducts() {
    try {
        // Fetch all products with a high limit to ensure we get all products
        // Using limit=1000 to capture all products even if more are added
        // Add cache-busting parameter to prevent caching stale product data
        console.log('Loading all products from:', `${API_URL}/products?limit=1000`);
        const response = await fetch(`${API_URL}/products?limit=1000&t=${Date.now()}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Products response:', data);

        const container = document.getElementById('productsTableContent');

        // Check if data has products
        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No products found. Click "Add Product" to create one.</p>';
            return;
        }

        // Group products by category
        const groupedProducts = {};
        data.data.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!groupedProducts[category]) {
                groupedProducts[category] = [];
            }
            groupedProducts[category].push(product);
        });

        // Sort categories alphabetically
        const sortedCategories = Object.keys(groupedProducts).sort();

        // Generate HTML for grouped products
        let html = '';
        sortedCategories.forEach(category => {
            html += `
                <div style="margin-bottom: 30px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2e7d32 0%, #558b2f 100%); color: white; padding: 15px 20px; font-weight: 600; font-size: 16px;">
                        <i class="fas fa-folder-open"></i> ${category} (${groupedProducts[category].length} items)
                    </div>
                    <table class="data-table" style="margin: 0;">
                        <thead style="background: #f9f9f9;">
                            <tr>
                                <th style="padding: 12px 15px; width: 80px;">Image</th>
                                <th style="padding: 12px 15px;">Product Name</th>
                                <th style="padding: 12px 15px;">Price</th>
                                <th style="padding: 12px 15px;">Stock</th>
                                <th style="padding: 12px 15px;">Created</th>
                                <th style="padding: 12px 15px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groupedProducts[category].map(product => {
                // Construct image URL with cache-busting using product's updatedAt
                let imageUrl = product.image;
                if (!imageUrl.startsWith('http')) {
                    if (imageUrl.startsWith('/uploads')) {
                        imageUrl = `${IMAGE_BASE_URL}${imageUrl}`;
                    } else {
                        imageUrl = `${IMAGE_BASE_URL}/uploads/products/${imageUrl}`;
                    }
                }
                // Use product's updatedAt time for cache-busting (unique per update)
                const cacheKey = product.updatedAt ? new Date(product.updatedAt).getTime() : product._id;
                imageUrl += `?cache=${cacheKey}`;

                // Escape product name for HTML
                const escapedName = product.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

                return `
                                <tr class="product-row">
                                    <td data-label="Image" class="td-image">
                                        <div class="product-image-box" onclick="window.open('${imageUrl.replace(/'/g, "\\'")}', '_blank')">
                                            <img src="${imageUrl}" alt="${escapedName}" 
                                                onerror="handleAdminImageError(this)"
                                            >
                                        </div>
                                    </td>
                                    <td data-label="Product Name" class="td-name"><strong>${escapedName}</strong></td>
                                    <td data-label="Price" class="td-price">₹${product.price.toFixed(2)}</td>
                                    <td data-label="Stock" class="td-stock" id="stock-cell-${product._id}">
                                        <span class="stock-badge" style="background: ${product.stock > 20 ? '#4CAF50' : product.stock > 0 ? '#FFC107' : '#f44336'};">
                                            ${product.stock} units
                                        </span>
                                    </td>
                                    <td data-label="Created" class="td-created">${new Date(product.createdAt).toLocaleDateString()}</td>
                                    <td data-label="Actions" class="td-actions">
                                        <div class="action-buttons">
                                            <button class="btn btn-info" onclick="editProduct('${product._id}')" style="padding: 6px 12px; font-size: 12px;">Edit</button>
                                            <button class="btn btn-secondary" onclick="quickUpdateStock('${product._id}', ${product.stock || 0})" style="padding: 6px 12px; font-size: 12px; background:#2e7d32; color:white;"><i class='fas fa-boxes'></i> Stock</button>
                                            <button class="btn" onclick="openRecipeVideoModal('${product._id}', '${escapedName.replace(/'/g, "&apos;")}')"
                                                style="padding:6px 12px; font-size:12px; background:linear-gradient(135deg,#8e44ad,#9b59b6); color:white; border-radius:6px;"
                                                title="Manage recipe video for this product">
                                                <i class='fas fa-film'></i> Video
                                            </button>
                                            <button class="btn btn-danger" onclick="deleteProduct('${product._id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsTableContent').innerHTML = '<p style="text-align: center; color: #d32f2f; padding: 20px;">Error loading products: ' + error.message + '</p>';
    }
}

// ===== CATEGORY AUTOCOMPLETE FOR PRODUCT FORM =====
let _cachedCategories = [];
let _lastCategoriesFetch = 0;
const CATEGORIES_CACHE_TTL = 60_000; // 1 minute

// Fallback categories (used if the API call fails or returns empty)
const DEFAULT_CATEGORIES = [
    'Vegetables', 'Fruits', 'Grocery', 'Oils', 'Honey', 'Rice',
    'Lentils', 'Masala', 'Millets', 'Snacks', 'Sweetener', 'Soaps',
    'Pickle', 'Dairy', 'Dry Fruits', 'Spices', 'Tea & Coffee', 'Herbs'
];

// Fetch categories from the backend and populate the productCategoryList <datalist>
async function loadCategoriesForSelect(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _cachedCategories.length && (now - _lastCategoriesFetch) < CATEGORIES_CACHE_TTL) {
        populateCategoryDatalist(_cachedCategories);
        return _cachedCategories;
    }

    try {
        const res = await fetch(`${API_URL}/search/categories?t=${now}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = (data.data || []).map(c => (typeof c === 'string' ? c : c.name)).filter(Boolean);
        _cachedCategories = list;
        _lastCategoriesFetch = now;
        populateCategoryDatalist(list);
        console.log(`✅ Loaded ${list.length} categories into the product form`);
        return list;
    } catch (err) {
        console.warn('⚠️ Could not load categories from API, using defaults:', err.message);
        _cachedCategories = DEFAULT_CATEGORIES.slice();
        _lastCategoriesFetch = now;
        populateCategoryDatalist(_cachedCategories);
        return _cachedCategories;
    }
}

// Inject the given list of category names as <option> elements inside the datalist
function populateCategoryDatalist(categories) {
    const datalist = document.getElementById('productCategoryList');
    if (!datalist) return;
    // Clear existing options
    while (datalist.firstChild) datalist.removeChild(datalist.firstChild);
    // Add each category as an option
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        datalist.appendChild(opt);
    });
}

function openProductModal() {
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    uploadedImageUrl = ''; // Reset uploaded image
    isImageUploading = false; // Reset upload flag
    document.getElementById('imagePreview').style.display = 'none'; // Hide preview
    document.getElementById('uploadStatus').style.display = 'none'; // Hide upload status
    document.getElementById('uploadStatus').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading image...'; // Reset status message
    document.getElementById('productImage').value = ''; // Clear file input
    clearUnitsForm(); // Clear units form
    addUnitField(); // Add one empty unit field
    // Always refresh the category list so newly added categories appear
    loadCategoriesForSelect(true);
    document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
}

// Quick stock update without opening full edit modal
async function quickUpdateStock(productId, currentStock) {
    // Find product name from the same row
    let productName = "Product";
    const cell = document.getElementById(`stock-cell-${productId}`);
    if (cell) {
        const row = cell.closest('tr');
        const nameCell = row.querySelector('[data-label="Product Name"]');
        if (nameCell) productName = nameCell.textContent.trim();
    }

    const newStock = prompt(`Update stock for "${productName}"\nCurrent stock: ${currentStock}\n\nEnter new stock quantity:`, currentStock);
    if (newStock === null) return; // cancelled
    const qty = parseInt(newStock);
    if (isNaN(qty) || qty < 0) { alert('Please enter a valid number (0 or more)'); return; }
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: qty, updatedAt: new Date() })
        });
        const data = await response.json();
        if (data.success) {
            // Update the cell in-place
            const cell = document.getElementById(`stock-cell-${productId}`);
            if (cell) {
                const colour = qty > 20 ? '#4CAF50' : qty > 0 ? '#FFC107' : '#f44336';
                cell.innerHTML = `<span style="background:${colour}; color:white; padding:4px 8px; border-radius:4px; font-size:12px;">${qty} units</span>`;
            }
            alert(`✅ Stock updated to ${qty} for "${productName}"`);
        } else {
            alert('Error: ' + (data.message || 'Failed to update stock'));
        }
    } catch (err) {
        alert('Error updating stock: ' + err.message);
    }
}

// ===== IMAGE UPLOAD SETUP =====
function setupImageUpload() {
    const fileInput = document.getElementById('productImage');
    const fileLabel = document.querySelector('#productModal .file-input-label');
    if (!fileInput || !fileLabel) return;
    const imagePreview = document.getElementById('imagePreview');

    // Prevent any form submission from file input
    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleImageSelect();
    });

    // Click to upload
    fileLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    // Drag and drop
    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
    });

    fileLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
    });

    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }

            // Create a proper DataTransfer object for the file input
            try {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            } catch (err) {
                // Fallback for browsers that don't support DataTransfer
                console.log('DataTransfer not supported, using direct file handling');
            }

            handleImageSelect();
        }
    });
}

// ===== DOCX IMPORT =====
function setupDocxImport() {
    const importBtn = document.getElementById('importDocxBtn');
    const fileInput = document.getElementById('docxInput');
    if (!importBtn || !fileInput) return;

    importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Basic validation
        if (!file.name.toLowerCase().endsWith('.docx')) {
            alert('Please select a .docx Word document');
            fileInput.value = '';
            return;
        }

        // Confirm action
        if (!confirm('Import products from this Word document? The file will be parsed and products created.')) {
            fileInput.value = '';
            return;
        }

        try {
            importBtn.disabled = true;
            importBtn.textContent = 'Importing...';
            const result = await uploadDocx(file);
            if (result && result.success) {
                alert(`Import complete. Created ${result.created || result.createdCount || 0} products.`);
                loadProducts();
            } else {
                alert('Import finished with errors: ' + (result.message || JSON.stringify(result.errors || result)));
            }
        } catch (err) {
            console.error('Error importing docx:', err);
            alert('Error importing document: ' + err.message);
        } finally {
            importBtn.disabled = false;
            importBtn.textContent = 'Import from Word';
            fileInput.value = '';
        }
    });
}

async function uploadDocx(file) {
    const formData = new FormData();
    formData.append('docx', file);

    const res = await fetch(`${API_URL}/uploads/upload-docx`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return res.json();
}

async function handleImageSelect() {
    const fileInput = document.getElementById('productImage');
    const file = fileInput.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        fileInput.value = '';
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        fileInput.value = '';
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        document.getElementById('previewImg').src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Show upload status
    document.getElementById('uploadStatus').style.display = 'block';

    // Upload image and wait for completion
    await uploadImage(file);
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    isImageUploading = true; // Set upload flag

    try {
        console.log('📤 Uploading image:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        const response = await fetch(`${API_URL}/uploads/upload`, {
            method: 'POST',
            body: formData
        });

        console.log('📦 Upload response status:', response.status);

        // Check response is OK
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Upload result:', result);

        if (result.success && result.imageUrl) {
            uploadedImageUrl = result.imageUrl;
            console.log('✅ Image URL stored:', uploadedImageUrl);

            // Show success message
            const uploadStatus = document.getElementById('uploadStatus');
            uploadStatus.innerHTML = '<i class="fas fa-check-circle" style="color:green;"></i> Image uploaded successfully!';
            uploadStatus.style.color = '#2ecc71';
            uploadStatus.style.display = 'block';

            // Auto-hide after 3 seconds
            setTimeout(() => {
                uploadStatus.style.display = 'none';
            }, 3000);
        } else {
            throw new Error(result.message || 'Upload succeeded but no image URL returned');
        }
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        alert('❌ Error uploading image: ' + error.message);
        removeImage();
    } finally {
        isImageUploading = false; // Clear upload flag
    }
}

function removeImage() {
    const fileInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadStatus = document.getElementById('uploadStatus');

    fileInput.value = '';
    imagePreview.style.display = 'none';
    uploadStatus.style.display = 'none';
    uploadedImageUrl = '';
}

function setupProductForm() {
    const form = document.getElementById('productForm');

    // Prevent enter key from submitting form except on submit button
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
            e.preventDefault();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if image is still uploading
        if (isImageUploading) {
            alert('⏳ Please wait for the image to finish uploading before submitting the form.');
            return;
        }

        const productId = document.getElementById('productId').value;

        // Validate required fields
        const name = document.getElementById('productName').value.trim();
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value.trim();

        if (!name || !category || !description) {
            alert('❌ Please fill in all required fields marked with *');
            return;
        }

        // Get units - REQUIRED
        const units = getUnitsFromForm();
        if (units.length === 0) {
            alert('❌ Please add at least one product unit with price');
            return;
        }

        // Determine image URL
        let imageUrl = 'product.jpg'; // default image
        if (uploadedImageUrl) {
            imageUrl = uploadedImageUrl; // Use uploaded image if available
            console.log('📸 Using uploaded image:', imageUrl);
        } else if (productId) {
            // When editing, if no NEW image was uploaded, we MUST keep the existing one
            // We'll try to find it from the preview image if it exists
            const previewImg = document.getElementById('previewImg');
            if (previewImg && previewImg.src && !previewImg.src.includes('placeholder')) {
                // Extract the relative path from the absolute URL if necessary
                const src = previewImg.src;
                if (src.includes('/uploads/')) {
                    imageUrl = '/uploads/' + src.split('/uploads/')[1].split('?')[0];
                } else {
                    imageUrl = src.split('?')[0]; // fallback
                }
                console.log('📸 Preserving existing image:', imageUrl);
            }
        }

        // Calculate base price from first unit (for backward compatibility)
        const basePrice = units[0].price;

        // Validate price
        if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
            alert('❌ First unit must have a valid price greater than 0');
            return;
        }

        // Read stock from the form input
        const stockInput = document.getElementById('productStock');
        const stockValue = stockInput ? (parseInt(stockInput.value) || 0) : 0;

        const productData = {
            name,
            category,
            price: basePrice,
            stock: stockValue,
            description,
            image: imageUrl,
            units: units.map(u => ({ ...u, stock: stockValue }))
        };

        console.log('📝 Submitting product:', productData);

        try {
            const url = productId ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
            const method = productId ? 'PUT' : 'POST';

            console.log(`🚀 ${method} to ${url}`);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            console.log('📬 Response status:', response.status);

            const result = await response.json();
            console.log('📬 Response data:', result);

            if (!response.ok) {
                const errorMsg = result.message || `Server error (${response.status})`;
                throw new Error(errorMsg);
            }

            if (result.success) {
                alert(productId ? '✅ Product updated successfully!' : '✅ Product added successfully!');
                closeProductModal();
                uploadedImageUrl = ''; // Reset image URL
                loadProducts();
                loadDashboardData();
            } else {
                alert('❌ Error: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error saving product:', error);
            alert('❌ Error saving product: ' + error.message);
        }
    });
}

async function editProduct(productId) {
    console.log('✏️ editProduct called with ID:', productId);
    try {
        // Add cache-busting parameter to ensure fresh product data
        const url = `${API_URL}/products/${productId}?t=${Date.now()}`;
        console.log(`🔗 Fetching from: ${url}`);

        const response = await fetch(url, {
            cache: 'no-store'
        });
        const data = await response.json();

        console.log('📥 Product fetch response:', data);

        if (data.success) {
            const product = data.data;
            console.log('📦 Product data:', product);

            document.getElementById('productId').value = product._id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productDescription').value = product.description;

            // Clear and populate units
            clearUnitsForm();
            if (product.units && product.units.length > 0) {
                product.units.forEach(unit => {
                    addUnitField();
                    const unitDivs = document.querySelectorAll('[id^="unit-"]');
                    const lastUnitDiv = unitDivs[unitDivs.length - 1];

                    lastUnitDiv.querySelector('.unit-type-select').value = unit.unit;
                    lastUnitDiv.querySelector('.unit-quantity-input').value = unit.quantity;
                    lastUnitDiv.querySelector('.unit-price-input').value = unit.price;
                });
            } else {
                addUnitField(); // Add empty unit field if none exist
            }

            // Store the existing image URL for reference
            uploadedImageUrl = product.image;

            // Show preview if image exists and is not default
            if (product.image && product.image !== 'product.jpg') {
                let imageUrl = product.image;
                // Ensure full URL for image display
                if (!imageUrl.startsWith('http')) {
                    if (imageUrl.startsWith('/uploads')) {
                        imageUrl = `${IMAGE_BASE_URL}${imageUrl}`;
                    } else {
                        imageUrl = `${IMAGE_BASE_URL}/uploads/products/${imageUrl}`;
                    }
                }
                // Use product's updatedAt time for cache-busting (unique per update)
                const cacheKey = product.updatedAt ? new Date(product.updatedAt).getTime() : product._id;
                imageUrl += `?cache=${cacheKey}`;
                document.getElementById('previewImg').src = imageUrl;
                document.getElementById('imagePreview').style.display = 'block';
                console.log('📸 Preview image URL:', imageUrl);
            } else {
                document.getElementById('imagePreview').style.display = 'none';
            }

            document.getElementById('modalTitle').textContent = 'Edit Product';
            const productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.classList.add('show');
                console.log('✅ Product modal opened');
            } else {
                console.error('❌ Product modal not found!');
            }
        } else {
            console.error('❌ Error response:', data);
            alert('Error loading product: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Error loading product:', error);
        alert('Error loading product: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Product deleted successfully!');
            loadProducts();
            loadDashboardData();
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
    }
}

// ===== USERS MANAGEMENT =====
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();

        const table = document.getElementById('usersTable');

        if (!data.success || data.data.length === 0) {
            table.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
            return;
        }

        table.innerHTML = data.data.map(user => `
            <tr>
                <td data-label="Name"><strong>${user.name}</strong></td>
                <td data-label="Email">${user.email}</td>
                <td data-label="Phone">${user.number}</td>
                <td data-label="Role"><span style="background-color: ${user.role === 'admin' ? '#e74c3c' : '#3498db'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${user.role}</span></td>
                <td data-label="Joined">${new Date(user.createdAt).toLocaleDateString()}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="editUser('${user._id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTable').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading users</td></tr>';
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function setupUserForm() {
    const userForm = document.getElementById('userForm');
    console.log('📋 setupUserForm called - userForm element:', userForm);

    if (!userForm) {
        console.error('❌ User form not found!');
        return;
    }

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 User form submitted');

        const userId = document.getElementById('userId').value;
        if (!userId) {
            alert('No user selected');
            return;
        }

        const userData = {
            number: document.getElementById('userNumber').value,
            role: document.getElementById('userRole').value
        };

        console.log('📤 Sending user update:', userData);

        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            console.log('📥 User update response:', result);

            if (result.success) {
                alert('User updated successfully!');
                closeUserModal();
                loadUsers();
                loadDashboardData();
            } else {
                alert('Error: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error updating user:', error);
            alert('Error updating user: ' + error.message);
        }
    });
    console.log('✅ User form event listener attached');
}

async function editUser(userId) {
    console.log('✏️ editUser called with ID:', userId);
    try {
        console.log(`🔗 Fetching from: ${API_URL}/users/${userId}`);
        const response = await fetch(`${API_URL}/users/${userId}`);
        const data = await response.json();

        console.log('📥 User fetch response:', data);

        if (data.success) {
            const user = data.data;
            console.log('👤 User data:', user);

            document.getElementById('userId').value = user._id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userNumber').value = user.number || '';
            document.getElementById('userRole').value = user.role || 'user';

            const userModal = document.getElementById('userModal');
            console.log('🔍 User modal element:', userModal);

            if (userModal) {
                userModal.classList.add('show');
                console.log('✅ User modal opened');
            } else {
                console.error('❌ User modal not found!');
                alert('Error: User modal not found');
            }
        } else {
            alert('Error loading user: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Error loading user:', error);
        alert('Error loading user: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('User deleted successfully!');
            loadUsers();
            loadDashboardData();
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

// ===== MESSAGES MANAGEMENT =====
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/messages`);
        const data = await response.json();

        const container = document.getElementById('messagesList');

        if (!data.success || data.data.length === 0) {
            container.innerHTML = '<div class="text-center">No messages found</div>';
            return;
        }

        container.innerHTML = data.data.map(message => `
            <div class="message-item ${message.status === 'unread' ? 'unread' : ''}">
                <div class="message-content">
                    <div class="message-from">${message.name}</div>
                    <div class="message-subject"><strong>Subject:</strong> ${message.subject}</div>
                    <div class="message-preview">${message.message.substring(0, 100)}...</div>
                </div>
                <div class="message-meta">
                    <span class="message-time">${new Date(message.createdAt).toLocaleDateString()}</span>
                    <button class="btn btn-info" onclick="viewMessage('${message._id}')">View</button>
                    <button class="btn btn-danger" onclick="deleteMessage('${message._id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('messagesList').innerHTML = '<div class="text-center">Error loading messages</div>';
    }
}

async function viewMessage(messageId) {
    try {
        const response = await fetch(`${API_URL}/messages/${messageId}`);
        const data = await response.json();

        if (data.success) {
            const message = data.data;
            const detail = document.getElementById('messageDetail');

            detail.innerHTML = `
                <h3>Message Details</h3>
                <p><strong>From:</strong> ${message.name}</p>
                <p><strong>Email:</strong> ${message.email}</p>
                <p><strong>Subject:</strong> ${message.subject}</p>
                <p><strong>Date:</strong> ${new Date(message.createdAt).toLocaleString()}</p>
                <div class="message-body">
                    <strong>Message:</strong><br>
                    ${message.message}
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="markAsRead('${message._id}')">Mark as Read</button>
                    <button class="btn btn-secondary" onclick="closeMessageModal()">Close</button>
                </div>
            `;

            document.getElementById('messageModal').classList.add('show');

            // Mark as read and update badge
            if (message.status === 'unread') {
                await fetch(`${API_URL}/messages/${messageId}/read`, { method: 'PUT' });

                // Decrement badge count immediately
                const messageBadge = document.getElementById('messageBadge');
                const currentBadgeCount = parseInt(messageBadge.textContent) || 0;
                if (currentBadgeCount > 0) {
                    messageBadge.textContent = currentBadgeCount - 1;
                }

                loadMessages();
                loadDashboardData();
            }
        }
    } catch (error) {
        console.error('Error loading message:', error);
        alert('Error loading message');
    }
}

function closeMessageModal() {
    document.getElementById('messageModal').classList.remove('show');
}

async function markAsRead(messageId) {
    try {
        const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
            method: 'PUT'
        });

        const result = await response.json();

        if (result.success) {
            closeMessageModal();
            loadMessages();
            loadDashboardData();
            refreshAllBadges(); // <-- update sidebar badges
            alert('Message marked as read!');
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        const response = await fetch(`${API_URL}/messages/${messageId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Message deleted successfully!');
            loadMessages();
            loadDashboardData();
            refreshAllBadges(); // <-- update sidebar badges
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
    }
}

// ===== ORDERS MANAGEMENT =====
async function loadOrders() {
    try {
        console.log('Loading orders from:', `${API_URL}/orders`);
        const response = await fetch(`${API_URL}/orders`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Orders response:', data);

        const table = document.getElementById('ordersTable');

        if (!data.data || data.data.length === 0) {
            table.innerHTML = '<tr><td colspan="9" class="text-center">No orders found. Customers will see orders here.</td></tr>';
            return;
        }

        table.innerHTML = data.data.map(order => {
            const totalAmount = order.totalAmount || 0;
            const customerName = order.customerName || 'N/A';
            const customerEmail = order.customerEmail || 'N/A';
            const customerPhone = order.customerPhone || 'N/A';
            const orderStatus = order.orderStatus || 'pending';
            const createdAt = order.createdAt || new Date().toISOString();

            // Extract product names from products array
            let productNames = 'N/A';
            if (order.products && Array.isArray(order.products) && order.products.length > 0) {
                productNames = order.products.map(p => p.name || p.productName || 'Unknown').join(', ');
            }

            // Format date and time
            const dateTime = new Date(createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            return `
            <tr>
                <td data-label="Order ID"><strong>${order._id.substring(0, 8)}</strong></td>
                <td data-label="Customer Name">${customerName}</td>
                <td data-label="Email">${customerEmail}</td>
                <td data-label="Phone">${customerPhone}</td>
                <td data-label="Products">${productNames}</td>
                <td data-label="Total Amount">$${totalAmount.toFixed(2)}</td>
                <td data-label="Status">
                    <span class="status-badge status-${orderStatus}">
                        ${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                    </span>
                </td>
                <td data-label="Date & Time">${dateTime}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="viewOrder('${order._id}')">View</button>
                        <button class="btn btn-warning" onclick="updateOrderStatus('${order._id}')">Update</button>
                        <button class="btn btn-danger" onclick="deleteOrder('${order._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersTable').innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading orders: ' + error.message + '</td></tr>';
    }
}

async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await response.json();

        if (data.success) {
            const order = data.data;
            let productsHtml = '';
            if (order.products && Array.isArray(order.products) && order.products.length > 0) {
                productsHtml = order.products.map(p => `
                    <tr>
                        <td>${p.productName}</td>
                        <td>${p.quantity}</td>
                        <td>$${p.price.toFixed(2)}</td>
                        <td>$${p.total.toFixed(2)}</td>
                    </tr>
                `).join('');
            } else {
                productsHtml = '<tr><td colspan="4" class="text-center">No products in this order</td></tr>';
            }

            const detailHTML = `
                <div class="order-detail-content">
                    <h3>Order #${order._id.substring(0, 8)}</h3>
                    
                    <div class="detail-section">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${order.customerName}</p>
                        <p><strong>Email:</strong> ${order.customerEmail}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone}</p>
                        <p><strong>Address:</strong> ${order.customerAddress}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Order Details</h4>
                        <p><strong>Status:</strong> <span class="status-badge status-${order.orderStatus}">${order.orderStatus}</span></p>
                        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Products</h4>
                        <table class="detail-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="detail-section">
                        <h4>Order Summary</h4>
                        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
                    </div>
                </div>
            `;

            document.getElementById('orderDetail').innerHTML = detailHTML;
            document.getElementById('orderModal').classList.add('show');

            // If order is pending, refresh dashboard to update badge count
            if (order.orderStatus === 'pending') {
                loadDashboardData();
            }
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        alert('Error loading order details');
    }
}

async function updateOrderStatus(orderId) {
    // Store the order ID globally for the modal
    window.currentOrderId = orderId;

    // Fetch current order details
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await response.json();

        if (data.success) {
            const order = data.data;
            // Set the current status in the modal
            document.getElementById('statusSelect').value = order.orderStatus || 'pending';
            document.getElementById('trackingNumber').value = order.trackingNumber || '';
            document.getElementById('statusNotes').value = '';

            // Show the modal
            document.getElementById('statusModal').classList.add('show');
        } else {
            alert('Error loading order: ' + data.message);
        }
    } catch (error) {
        console.error('Error loading order:', error);
        alert('Error loading order details');
    }
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('show');
    window.currentOrderId = null;
}

async function confirmStatusUpdate() {
    const orderId = window.currentOrderId;
    const newStatus = document.getElementById('statusSelect').value;
    const trackingNumber = document.getElementById('trackingNumber').value.trim();

    if (!newStatus) {
        alert('Please select a status');
        return;
    }

    try {
        const updateData = { orderStatus: newStatus };
        if (trackingNumber) {
            updateData.trackingNumber = trackingNumber;
        }

        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Order status updated successfully!');
            closeStatusModal();
            loadOrders();
            loadDashboardData();
            refreshAllBadges(); // <-- update sidebar badges
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Error updating order');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Order deleted successfully!');
            loadOrders();
            loadDashboardData();
            refreshAllBadges(); // <-- update sidebar badges
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
}

// ===== ANALYTICS & REPORTING =====
function initializeAnalytics() {
    updateAnalyticsCache();
    loadAnalyticsCharts();
}

function updateAnalyticsCache() {
    const metrics = {
        lastUpdated: new Date().toISOString(),
        sessionStartTime: localStorage.getItem('sessionStartTime') || new Date().toISOString(),
        pageViewCount: (parseInt(localStorage.getItem('pageViewCount') || 0) + 1),
        totalAdminActions: parseInt(localStorage.getItem('totalAdminActions') || 0)
    };
    AdminStorage.setDashboardMetrics(metrics);
    localStorage.setItem('pageViewCount', metrics.pageViewCount.toString());
}

function loadAnalyticsCharts() {
    // Sales by category chart
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        displaySalesAnalytics();
    }

    // Revenue trend chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        displayRevenueAnalytics();
    }

    // Customer analytics
    displayCustomerAnalytics();
    updateAnalyticsDisplay();
}

function updateAnalyticsDisplay() {
    const metrics = AdminStorage.getDashboardMetrics();
    const analytics = AdminStorage.getAnalytics();

    // Update page views
    const pageViewsEl = document.getElementById('pageViews');
    if (pageViewsEl) {
        pageViewsEl.textContent = metrics.pageViewCount || 0;
    }

    // Update admin actions
    const adminActionsEl = document.getElementById('adminActions');
    if (adminActionsEl) {
        adminActionsEl.textContent = metrics.totalAdminActions || 0;
    }

    // Update total revenue
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        const revenue = analytics.totalRevenue || 0;
        totalRevenueEl.textContent = '$' + revenue.toFixed(2);
    }

    // Update active users
    const activeUsersEl = document.getElementById('activeUsers');
    if (activeUsersEl) {
        activeUsersEl.textContent = analytics.activeUsers || 0;
    }
}

// Refresh sales / category analytics. Returns a promise that resolves with the analytics object.
async function displaySalesAnalytics() {
    try {
        const response = await fetch(`${API_URL}/products?limit=1000&t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        const products = data.data || [];

        const categoryStock = {};
        const categoryProductCount = {};
        let totalStock = 0;

        products.forEach(p => {
            const cat = p.category || 'Uncategorized';
            const stock = p.stock || 0;
            categoryStock[cat] = (categoryStock[cat] || 0) + stock;
            categoryProductCount[cat] = (categoryProductCount[cat] || 0) + 1;
            totalStock += stock;
        });

        const analytics = AdminStorage.getAnalytics();
        analytics.categoryStock = categoryStock;
        analytics.categoryProductCount = categoryProductCount;
        analytics.totalStock = totalStock;
        analytics.productCount = products.length;
        AdminStorage.setAnalytics(analytics);

        AdminStorage.addActivity({
            type: 'analytics_viewed',
            action: 'Refreshed sales analytics',
            productCount: products.length
        });

        return analytics;
    } catch (error) {
        console.error('Error displaying sales analytics:', error);
        return AdminStorage.getAnalytics();
    }
}

// Refresh revenue / order analytics. Returns a promise that resolves with the analytics object.
async function displayRevenueAnalytics() {
    try {
        const response = await fetch(`${API_URL}/orders?t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        const orders = data.data || [];

        let totalRevenue = 0;
        const dailyRevenue = {};
        const statusBreakdown = {};

        orders.forEach(order => {
            const amt = order.totalAmount || 0;
            totalRevenue += amt;
            const date = new Date(order.createdAt).toLocaleDateString();
            dailyRevenue[date] = (dailyRevenue[date] || 0) + amt;
            const status = order.orderStatus || 'unknown';
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        });

        const analytics = AdminStorage.getAnalytics();
        analytics.totalRevenue = Math.round(totalRevenue * 100) / 100;
        analytics.dailyRevenue = dailyRevenue;
        analytics.totalOrders = orders.length;
        analytics.orderStatusBreakdown = statusBreakdown;
        AdminStorage.setAnalytics(analytics);

        AdminStorage.addActivity({
            type: 'analytics_updated',
            action: 'Refreshed revenue analytics',
            totalRevenue: analytics.totalRevenue,
            totalOrders: orders.length
        });

        return analytics;
    } catch (error) {
        console.error('Error displaying revenue analytics:', error);
        return AdminStorage.getAnalytics();
    }
}

// Refresh customer analytics. Returns a promise that resolves with the analytics object.
async function displayCustomerAnalytics() {
    try {
        const response = await fetch(`${API_URL}/users?t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        const users = data.data || [];

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let newToday = 0;
        let newThisWeek = 0;
        let activeUsers = 0;
        const customerEmails = [];

        users.forEach(u => {
            const created = new Date(u.createdAt);
            if (created >= todayStart) newToday += 1;
            if (created >= oneWeekAgo) newThisWeek += 1;
            if (u.lastLogin) {
                const last = new Date(u.lastLogin);
                if (last >= oneWeekAgo) activeUsers += 1;
            }
            if (u.email) customerEmails.push(u.email);
        });

        const analytics = AdminStorage.getAnalytics();
        analytics.totalCustomers = users.length;
        analytics.activeUsers = activeUsers;
        analytics.newUsers = newToday;
        analytics.newUsersThisWeek = newThisWeek;
        analytics.customerEmails = customerEmails;
        AdminStorage.setAnalytics(analytics);

        AdminStorage.addActivity({
            type: 'analytics_updated',
            action: 'Refreshed customer analytics',
            totalCustomers: users.length,
            activeUsers,
            newToday
        });

        return analytics;
    } catch (error) {
        console.error('Error displaying customer analytics:', error);
        return AdminStorage.getAnalytics();
    }
}

// ===================== ROBUST DOWNLOAD HELPER =====================
// Uses iframe for guaranteed cross-browser downloads + setTimeout cleanup
function triggerBrowserDownload(blob, fileName) {
    try {
        // 1) Preferred: anchor with blob URL (with delayed removal to give the browser time to start the download)
        if (window.URL && URL.createObjectURL) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            // Delay removal so the browser can start the download
            setTimeout(() => {
                try { document.body.removeChild(a); } catch (e) { /* ignore */ }
                URL.revokeObjectURL(url);
            }, 1500);
            return true;
        }

        // 2) Fallback: open blob in a new tab (browser will offer to save it)
        const reader = new FileReader();
        reader.onload = function (e) {
            const win = window.open();
            if (win) {
                win.document.write('<iframe src="' + e.target.result + '" frameborder="0" style="border:0;width:100%;height:100%;"></iframe>');
            } else {
                alert('Pop-up blocked! Please allow pop-ups for this site to download reports.');
            }
        };
        reader.readAsDataURL(blob);
        return true;
    } catch (err) {
        console.error('Download failed:', err);
        return false;
    }
}

// Download a JSON report
function downloadReport(reportData, reportName) {
    try {
        const json = JSON.stringify(reportData, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const fileName = `${reportName}_${new Date().getTime()}.json`;
        const ok = triggerBrowserDownload(blob, fileName);

        AdminStorage.addActivity({
            type: 'report_generated',
            action: `Generated ${reportName}`,
            reportSize: blob.size,
            success: ok
        });

        if (ok) {
            console.log(`✅ Report downloaded: ${fileName} (${blob.size} bytes)`);
        } else {
            alert('❌ Report download failed. Please check the console for details.');
        }
    } catch (err) {
        console.error('Error generating report:', err);
        alert('❌ Error generating report: ' + err.message);
    }
}

// Download a CSV report
function downloadCSV(csv, fileName) {
    try {
        // Add BOM so Excel opens it with UTF-8
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const ok = triggerBrowserDownload(blob, fileName);

        AdminStorage.addActivity({
            type: 'export',
            action: `Exported ${fileName}`,
            success: ok
        });

        if (ok) {
            console.log(`✅ CSV downloaded: ${fileName} (${blob.size} bytes)`);
        } else {
            alert('❌ CSV download failed. Please check the console for details.');
        }
    } catch (err) {
        console.error('Error exporting CSV:', err);
        alert('❌ Error exporting CSV: ' + err.message);
    }
}

// Generate reports
function generateSalesReport() {
    // Refresh analytics first so the report has the latest data
    Promise.all([displaySalesAnalytics(), displayRevenueAnalytics(), displayCustomerAnalytics()])
        .then(() => {
            const analytics = AdminStorage.getAnalytics();
            const metrics = AdminStorage.getDashboardMetrics();

            const report = {
                generatedAt: new Date().toISOString(),
                period: 'Current Session',
                metrics: metrics,
                sales: analytics,
                activities: AdminStorage.getUserLog()
            };

            downloadReport(report, 'sales_report');
        })
        .catch(err => {
            console.error('Error building sales report:', err);
            alert('❌ Could not build sales report: ' + err.message);
        });
}

function generateCustomerReport() {
    displayCustomerAnalytics()
        .then(() => {
            const analytics = AdminStorage.getAnalytics();

            const report = {
                generatedAt: new Date().toISOString(),
                totalCustomers: analytics.totalCustomers || 0,
                activeUsers: analytics.activeUsers || 0,
                newUsersToday: analytics.newUsers || 0,
                newUsersThisWeek: analytics.newUsersThisWeek || 0,
                customerEmails: analytics.customerEmails || [],
                generatedBy: 'Admin Dashboard'
            };

            downloadReport(report, 'customer_report');
        })
        .catch(err => {
            console.error('Error building customer report:', err);
            alert('❌ Could not build customer report: ' + err.message);
        });
}

async function generateInventoryReport() {
    try {
        // Pull REAL inventory data from the products API
        const response = await fetch(`${API_URL}/products?limit=1000&t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const products = data.data || [];

        // Build per-category stock summary + per-product detail
        const categorySummary = {};
        const productRows = products.map(p => {
            const cat = p.category || 'Uncategorized';
            const stock = p.stock || 0;
            const price = p.price || 0;
            const value = stock * price;
            if (!categorySummary[cat]) {
                categorySummary[cat] = { productCount: 0, totalStock: 0, totalValue: 0 };
            }
            categorySummary[cat].productCount += 1;
            categorySummary[cat].totalStock += stock;
            categorySummary[cat].totalValue += value;
            return {
                id: p._id,
                name: p.name,
                category: cat,
                stock,
                price,
                stockValue: Math.round(value * 100) / 100,
                inStock: stock > 0
            };
        });

        const report = {
            generatedAt: new Date().toISOString(),
            generatedBy: 'Admin Dashboard',
            summary: {
                totalProducts: products.length,
                totalStockUnits: products.reduce((s, p) => s + (p.stock || 0), 0),
                totalInventoryValue: Math.round(products.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0) * 100) / 100,
                inStockProducts: products.filter(p => (p.stock || 0) > 0).length,
                outOfStockProducts: products.filter(p => (p.stock || 0) === 0).length
            },
            categorySummary,
            products: productRows
        };

        downloadReport(report, 'inventory_report');
    } catch (err) {
        console.error('Error generating inventory report:', err);
        alert('❌ Could not build inventory report: ' + err.message);
    }
}

// Export analytics to CSV
function exportAnalyticsToCSV() {
    // Refresh all analytics first
    Promise.all([displaySalesAnalytics(), displayRevenueAnalytics(), displayCustomerAnalytics()])
        .then(() => {
            const analytics = AdminStorage.getAnalytics();
            const metrics = AdminStorage.getDashboardMetrics();

            // Properly escape CSV values (wrap in quotes, escape internal quotes)
            const esc = v => {
                if (v === null || v === undefined) return '';
                const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
                return '"' + s.replace(/"/g, '""') + '"';
            };

            let csv = 'Analytics Report\n';
            csv += `Generated,${esc(new Date().toLocaleString())}\n\n`;

            csv += 'Section,Key,Value\n';
            csv += `Metrics,Page Views,${esc(metrics.pageViewCount || 0)}\n`;
            csv += `Metrics,Admin Actions,${esc(metrics.totalAdminActions || 0)}\n`;
            csv += `Metrics,Session Start,${esc(metrics.sessionStartTime || '')}\n\n`;

            csv += `Analytics,Total Customers,${esc(analytics.totalCustomers || 0)}\n`;
            csv += `Analytics,Active Users,${esc(analytics.activeUsers || 0)}\n`;
            csv += `Analytics,New Users Today,${esc(analytics.newUsers || 0)}\n`;
            csv += `Analytics,New Users This Week,${esc(analytics.newUsersThisWeek || 0)}\n`;
            csv += `Analytics,Total Revenue,${esc(analytics.totalRevenue || 0)}\n`;
            csv += `Analytics,Total Orders,${esc(analytics.totalOrders || 0)}\n`;
            csv += `Analytics,Total Stock,${esc(analytics.totalStock || 0)}\n`;
            csv += `Analytics,Product Count,${esc(analytics.productCount || 0)}\n\n`;

            csv += 'Category,Total Stock Units,Product Count\n';
            if (analytics.categoryStock) {
                Object.entries(analytics.categoryStock).forEach(([cat, stock]) => {
                    csv += `${esc(cat)},${esc(stock)},${esc((analytics.categoryProductCount || {})[cat] || 0)}\n`;
                });
            }
            csv += '\n';

            csv += 'Date,Daily Revenue\n';
            if (analytics.dailyRevenue) {
                Object.entries(analytics.dailyRevenue).forEach(([d, r]) => {
                    csv += `${esc(d)},${esc(r)}\n`;
                });
            }
            csv += '\n';

            csv += 'Timestamp,Activity Type,Action\n';
            const log = AdminStorage.getUserLog();
            log.slice(-50).forEach(a => {
                csv += `${esc(new Date(a.timestamp).toLocaleString())},${esc(a.type || '')},${esc(a.action || '')}\n`;
            });

            downloadCSV(csv, `analytics_${new Date().getTime()}.csv`);
        })
        .catch(err => {
            console.error('Error exporting analytics:', err);
            alert('❌ Could not export analytics: ' + err.message);
        });
}

// View activity log (improved: show in a modal-like alert with full list)
function viewActivityLog() {
    const log = AdminStorage.getUserLog();
    console.log('📋 Activity Log:', log);
    if (log.length === 0) {
        alert('No activities recorded yet. Activity log tracks admin actions during this session.');
        return;
    }
    const last10 = log.slice(-10).reverse()
        .map(a => `• ${new Date(a.timestamp).toLocaleString()}\n   ${a.action}`)
        .join('\n\n');
    alert(`Total Activities: ${log.length}\n\nLast 10 Activities:\n\n${last10}`);
}

// ===== LOGOUT =====
// Expose logout on window so inline onclick handlers can call it reliably
window.logout = function () {
    // Save final metrics before logout
    AdminStorage.addActivity({
        type: 'logout',
        action: 'Admin logged out'
    });

    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('sessionStartTime');
        window.location.href = 'login.html';
    }
};

// ===== REVIEWS MANAGEMENT (LocalStorage) =====
function getStoredReviews() {
    return JSON.parse(localStorage.getItem('kcpReviews') || '[]');
}

function loadReviewsBadge() {
    const reviews = getStoredReviews();
    const badge = document.getElementById('reviewBadge');
    if (badge) {
        badge.textContent = reviews.length;
    }
}

function loadReviews() {
    const reviews = getStoredReviews();
    const container = document.getElementById('reviewsList');

    // Update stats
    const totalCount = document.getElementById('totalReviewsCount');
    const avgRatingEl = document.getElementById('avgRating');
    const fiveStarEl = document.getElementById('fiveStarCount');

    if (totalCount) totalCount.textContent = reviews.length;

    if (reviews.length > 0) {
        const avgRating = (reviews.reduce((sum, r) => sum + parseInt(r.rating), 0) / reviews.length).toFixed(1);
        const fiveStarCount = reviews.filter(r => parseInt(r.rating) === 5).length;

        if (avgRatingEl) avgRatingEl.textContent = avgRating;
        if (fiveStarEl) fiveStarEl.textContent = fiveStarCount;
    } else {
        if (avgRatingEl) avgRatingEl.textContent = '0.0';
        if (fiveStarEl) fiveStarEl.textContent = '0';
    }

    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = '<div class="text-center" style="padding: 40px; color: #888;">No reviews yet. Reviews from customers will appear here.</div>';
        return;
    }

    container.innerHTML = reviews.map((review, index) => {
        const stars = generateStars(parseInt(review.rating));
        return `
            <div class="review-item">
                <div class="review-header-admin">
                    <div class="reviewer-info-admin">
                        <i class="fas fa-user-circle" style="font-size: 40px; color: #dd610e;"></i>
                        <div>
                            <h4>${escapeHtml(review.name)}</h4>
                            <div class="stars-admin">${stars}</div>
                        </div>
                    </div>
                    <div class="review-meta">
                        <span class="review-product-badge">${escapeHtml(review.product)}</span>
                        <span class="review-date">${new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
                <p class="review-text-admin">"${escapeHtml(review.text)}"</p>
                <div class="review-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteReview(${index})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color: #f59e0b;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #f59e0b;"></i>';
        }
    }
    return stars;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function deleteReview(index) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const reviews = getStoredReviews();
    reviews.splice(index, 1);
    localStorage.setItem('kcpReviews', JSON.stringify(reviews));

    loadReviews();
    loadReviewsBadge();
    refreshAllBadges(); // <-- update sidebar badges

    AdminStorage.addActivity({
        type: 'review_deleted',
        action: 'Deleted a customer review'
    });

    alert('Review deleted successfully!');
}

function clearAllReviews() {
    if (!confirm('Are you sure you want to delete ALL reviews? This action cannot be undone.')) return;

    localStorage.removeItem('kcpReviews');
    loadReviews();
    loadReviewsBadge();
    refreshAllBadges(); // <-- update sidebar badges

    AdminStorage.addActivity({
        type: 'reviews_cleared',
        action: 'Cleared all customer reviews'
    });

    alert('All reviews have been cleared!');
}

// ===== UNIFIED BADGE REFRESH =====
// Refreshes ALL sidebar badges (Orders, Messages, Reviews, Videos, Recipe Videos, About Us)
// in one shot. Called on page load, after every CRUD, and on a periodic interval.
async function refreshAllBadges() {
    // 1) Orders badge — pending orders count from dedicated endpoint
    try {
        const res = await fetch(`${API_URL}/orders/count/pending?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const count = (data && (data.count ?? data.pendingCount ?? data.data?.count)) || 0;
            setBadge('orderBadge', count);
        }
    } catch (_) { /* keep previous value on error */ }

    // 2) Messages badge — unread count from dedicated endpoint
    try {
        const res = await fetch(`${API_URL}/messages/count/unread?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const count = (data && (data.unreadCount ?? data.count ?? data.data?.count)) || 0;
            setBadge('messageBadge', count);
        }
    } catch (_) { /* keep previous value on error */ }

    // 3) Reviews badge — from localStorage (reviews are local-only)
    const reviews = getStoredReviews ? getStoredReviews() : JSON.parse(localStorage.getItem('kcpReviews') || '[]');
    setBadge('reviewBadge', reviews.length);

    // 4) Videos badge — total videos count
    try {
        const res = await fetch(`${API_URL}/videos/admin/all?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const count = (data.data || []).length;
            setBadge('videoBadge', count);
        }
    } catch (_) { /* keep previous value on error */ }

    // 5) Recipe Videos badge — only videos with category=recipe
    try {
        const res = await fetch(`${API_URL}/videos/admin/all?category=recipe&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const count = (data.data || []).filter(v => v.category === 'recipe').length;
            setBadge('recipeVideoBadge', count);
        }
    } catch (_) { /* keep previous value on error */ }

    // 6) About Us Videos badge — only videos with category=about-us
    try {
        const res = await fetch(`${API_URL}/videos?category=about-us&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const count = (data.data || []).length;
            setBadge('aboutUsBadge', count);
        }
    } catch (_) { /* keep previous value on error */ }
}

// Helper: safely set a badge value, hiding it if count is 0
function setBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    const n = Number(count) || 0;
    el.textContent = n;
    // Show or hide the badge based on count (cleaner sidebar)
    if (n === 0) {
        el.style.display = 'none';
    } else {
        el.style.display = '';
    }
}

// ===== AUTO REFRESH =====
setInterval(loadDashboardData, 30000); // Refresh dashboard metrics every 30s
setInterval(refreshAllBadges, 20000); // Refresh sidebar badges every 20s

// Initial badge population (in addition to loadDashboardData)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(refreshAllBadges, 500);
});

// ===== VIDEOS MANAGEMENT =====
let uploadedVideoUrl = '';
let isVideoUploading = false;

function loadVideosBadge() {
    fetch(`${API_URL}/videos/admin/all`)
        .then(res => res.json())
        .then(data => {
            const badge = document.getElementById('videoBadge');
            if (badge && data.data) {
                badge.textContent = data.data.length;
            }
        })
        .catch(err => console.error('Error loading videos badge:', err));
}

async function loadVideos() {
    try {
        const response = await fetch(`${API_URL}/videos/admin/all`);
        const data = await response.json();

        const table = document.getElementById('videosTable');

        // Update stats
        if (data.data) {
            const totalCount = document.getElementById('totalVideosCount');
            const activeCount = document.getElementById('activeVideosCount');
            const totalViews = document.getElementById('totalVideoViews');

            if (totalCount) totalCount.textContent = data.data.length;
            if (activeCount) activeCount.textContent = data.data.filter(v => v.isActive).length;
            if (totalViews) totalViews.textContent = data.data.reduce((sum, v) => sum + (v.views || 0), 0);
        }

        if (!data.data || data.data.length === 0) {
            table.innerHTML = '<tr><td colspan="7" class="text-center">No videos found. Click "Add Video" to create one.</td></tr>';
            return;
        }

        table.innerHTML = data.data.map(video => `
            <tr>
                <td data-label="Preview">
                    <video src="${getFullUrl(video.videoUrl)}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;" muted></video>
                </td>
                <td data-label="Title"><strong>${escapeHtml(video.title)}</strong></td>
                <td data-label="Product">${escapeHtml(video.productName || '-')}</td>
                <td data-label="Category">${video.category || 'General'}</td>
                <td data-label="Status">
                    <span class="status-badge ${video.isActive ? 'status-active' : 'status-inactive'}">
                        ${video.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td data-label="Views">${video.views || 0}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm" onclick="editVideo('${video._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="toggleVideoStatus('${video._id}')">
                            <i class="fas fa-${video.isActive ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteVideo('${video._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading videos:', error);
        document.getElementById('videosTable').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading videos</td></tr>';
    }
}

function getFullUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);
    return `${baseUrl}${path}`;
}

function openVideoModal() {
    document.getElementById('videoId').value = '';
    document.getElementById('videoModalTitle').textContent = 'Add New Video';
    document.getElementById('videoForm').reset();
    document.getElementById('videoIsActive').checked = true;
    uploadedVideoUrl = '';
    isVideoUploading = false;
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('videoUploadStatus').style.display = 'none';
    document.getElementById('videoFile').value = '';
    document.getElementById('videoModal').classList.add('show');
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.remove('show');
}

function setupVideoUpload() {
    const fileInput = document.getElementById('videoFile');
    const fileLabel = document.querySelector('#videoModal .file-input-label');

    if (!fileInput || !fileLabel) return;

    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleVideoSelect();
    });

    fileLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
    });

    fileLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
    });

    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleVideoSelect();
        }
    });
}

// ===== RECIPE VIDEO UPLOAD SETUP =====
function setupRecipeVideoUpload() {
    const fileInput = document.getElementById('recipeVideoFile');
    const fileLabel = document.getElementById('recipeVideoDropArea');

    if (!fileInput || !fileLabel) return;

    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
    });

    fileLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
    });

    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            // Trigger the change event manually to call handleRecipeVideoSelect()
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });
}

async function handleVideoSelect() {
    const fileInput = document.getElementById('videoFile');
    const file = fileInput.files[0];

    if (!file) return;

    if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        fileInput.value = '';
        return;
    }

    if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB');
        fileInput.value = '';
        return;
    }

    // Show preview
    const preview = document.getElementById('videoPreview');
    const previewVideo = document.getElementById('previewVideo');
    previewVideo.src = URL.createObjectURL(file);
    preview.style.display = 'block';

    document.getElementById('videoUploadStatus').style.display = 'block';

    await uploadVideoFile(file);
}

async function uploadVideoFile(file) {
    const formData = new FormData();
    formData.append('video', file);

    isVideoUploading = true;

    try {
        const response = await fetch(`${API_URL}/uploads/upload-video`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            uploadedVideoUrl = result.videoUrl;
            document.getElementById('videoUploadStatus').innerHTML = '<i class="fas fa-check-circle"></i> Video uploaded successfully!';
            setTimeout(() => {
                document.getElementById('videoUploadStatus').style.display = 'none';
            }, 2000);
        } else {
            alert('Error uploading video: ' + (result.message || 'Unknown error'));
            removeVideo();
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        alert('Error uploading video: ' + error.message);
        removeVideo();
    } finally {
        isVideoUploading = false;
    }
}

function removeVideo() {
    const fileInput = document.getElementById('videoFile');
    const videoPreview = document.getElementById('videoPreview');
    const uploadStatus = document.getElementById('videoUploadStatus');

    if (fileInput) fileInput.value = '';
    if (videoPreview) videoPreview.style.display = 'none';
    if (uploadStatus) uploadStatus.style.display = 'none';
    uploadedVideoUrl = '';
}

// Video form submission
document.addEventListener('DOMContentLoaded', () => {
    const videoForm = document.getElementById('videoForm');
    if (videoForm) {
        // Prevent enter key from submitting form except on submit button
        videoForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
            }
        });

        videoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (isVideoUploading) {
                alert('Please wait for the video to finish uploading.');
                return;
            }

            const videoId = document.getElementById('videoId').value;
            const title = document.getElementById('videoTitle').value.trim();
            const productName = document.getElementById('videoProductName').value.trim();

            if (!title || !productName) {
                alert('Please fill in all required fields');
                return;
            }

            if (!videoId && !uploadedVideoUrl) {
                alert('Please upload a video');
                return;
            }

            const videoData = {
                title,
                productName,
                category: document.getElementById('videoCategory').value,
                productLink: document.getElementById('videoProductLink').value.trim(),
                description: document.getElementById('videoDescription').value.trim(),
                displayOrder: parseInt(document.getElementById('videoDisplayOrder').value) || 0,
                isActive: document.getElementById('videoIsActive').checked
            };

            if (uploadedVideoUrl) {
                videoData.videoUrl = uploadedVideoUrl;
            }

            try {
                const url = videoId ? `${API_URL}/videos/${videoId}` : `${API_URL}/videos`;
                const method = videoId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(videoData)
                });

                const result = await response.json();

                if (result.success) {
                    alert(videoId ? 'Video updated successfully!' : 'Video added successfully!');
                    closeVideoModal();
                    uploadedVideoUrl = '';
                    loadVideos();
                    loadVideosBadge();
                } else {
                    alert('Error: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error saving video:', error);
                alert('Error saving video: ' + error.message);
            }
        });
    }
});

async function editVideo(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`);
        const data = await response.json();

        if (data.success) {
            const video = data.data;
            document.getElementById('videoId').value = video._id;
            document.getElementById('videoTitle').value = video.title;
            document.getElementById('videoProductName').value = video.productName || '';
            document.getElementById('videoCategory').value = video.category || 'General';
            document.getElementById('videoProductLink').value = video.productLink || '';
            document.getElementById('videoDescription').value = video.description || '';
            document.getElementById('videoDisplayOrder').value = video.displayOrder || 0;
            document.getElementById('videoIsActive').checked = video.isActive;

            document.getElementById('videoModalTitle').textContent = 'Edit Video';

            // Show existing video
            if (video.videoUrl) {
                const preview = document.getElementById('videoPreview');
                const previewVideo = document.getElementById('previewVideo');
                previewVideo.src = getFullUrl(video.videoUrl);
                preview.style.display = 'block';
                uploadedVideoUrl = video.videoUrl;
            }

            document.getElementById('videoModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading video:', error);
        alert('Error loading video details');
    }
}

async function toggleVideoStatus(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}/toggle`, {
            method: 'PATCH'
        });
        const result = await response.json();

        if (result.success) {
            loadVideos();
            loadVideosBadge();
        } else {
            alert('Error toggling video status');
        }
    } catch (error) {
        console.error('Error toggling video:', error);
    }
}

async function deleteVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('Video deleted successfully!');
            loadVideos();
            loadVideosBadge();
            refreshAllBadges(); // <-- update sidebar badges

            AdminStorage.addActivity({
                type: 'video_deleted',
                action: 'Deleted a video'
            });
        } else {
            alert('Error deleting video');
        }
    } catch (error) {
        console.error('Error deleting video:', error);
    }
}

// ===== ABOUT US VIDEOS MANAGEMENT =====
async function loadAboutUsVideos() {
    try {
        const response = await fetch(`${API_URL}/videos?category=about-us`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if (result.success && result.data) {
            displayAboutUsVideos(result.data);
            updateAboutUsVideoStats(result.data);
        }
    } catch (error) {
        console.error('Error loading about us videos:', error);
        document.getElementById('aboutUsVideosTable').innerHTML = '<tr><td colspan="7" class="text-center text-error">Failed to load videos</td></tr>';
    }
}

function displayAboutUsVideos(videos) {
    const tableBody = document.getElementById('aboutUsVideosTable');

    if (!videos || videos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No videos found. <button class="btn btn-sm btn-primary" onclick="openAboutUsVideoModal()">Add First Video</button></td></tr>';
        return;
    }

    tableBody.innerHTML = videos.map(video => `
        <tr>
            <td data-label="Preview">
                <div class="video-preview">
                    ${video.thumbnailUrl ? `<img src="${video.thumbnailUrl}" alt="${video.title}">` : '<i class="fas fa-video"></i>'}
                </div>
            </td>
            <td data-label="Title">${video.title}</td>
            <td data-label="Description">${video.description ? video.description.substring(0, 50) + '...' : '-'}</td>
            <td data-label="Status">
                <span class="status-badge ${video.isActive ? 'active' : 'inactive'}">
                    ${video.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td data-label="Views">${video.views || 0}</td>
            <td data-label="Order">${video.displayOrder}</td>
            <td data-label="Actions">
                <button class="btn btn-sm btn-info" onclick="editAboutUsVideo('${video._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm ${video.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleAboutUsVideoStatus('${video._id}')">
                    <i class="fas fa-${video.isActive ? 'eye-slash' : 'eye'}"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAboutUsVideo('${video._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateAboutUsVideoStats(videos) {
    const totalCount = videos.length;
    const activeCount = videos.filter(v => v.isActive).length;
    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);

    document.getElementById('totalAboutUsVideosCount').textContent = totalCount;
    document.getElementById('activeAboutUsVideosCount').textContent = activeCount;
    document.getElementById('totalAboutUsVideoViews').textContent = totalViews;
}

function openAboutUsVideoModal() {
    document.getElementById('aboutUsVideoId').value = '';
    document.getElementById('aboutUsVideoForm').reset();
    document.getElementById('aboutUsVideoModalTitle').textContent = 'Add Video to About Us';
    document.getElementById('aboutUsVideoModal').style.display = 'block';
    // Reset to upload tab
    switchAboutUsSourceTab('about-upload-tab');
}

function closeAboutUsVideoModal() {
    document.getElementById('aboutUsVideoModal').style.display = 'none';
}

// Switch between video source tabs for About Us
function switchAboutUsSourceTab(tabName, e) {
    // Hide all tabs
    const tabs = document.querySelectorAll('#aboutUsVideoModal .tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('#aboutUsVideoModal .tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    if (e && e.target) {
        e.target.classList.add('active');
    }

    // Update required attribute based on selected tab
    if (tabName === 'about-upload-tab') {
        document.getElementById('aboutUsVideoFile').required = true;
        document.getElementById('aboutUsVideoUrl').required = false;
    } else {
        document.getElementById('aboutUsVideoFile').required = false;
        document.getElementById('aboutUsVideoUrl').required = true;
    }
}

async function editAboutUsVideo(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`);
        const result = await response.json();

        if (result.success && result.data) {
            const video = result.data;
            document.getElementById('aboutUsVideoId').value = video._id;
            document.getElementById('aboutUsVideoTitle').value = video.title;
            document.getElementById('aboutUsVideoUrl').value = video.videoUrl;
            document.getElementById('aboutUsVideoThumbnail').value = video.thumbnailUrl || '';
            document.getElementById('aboutUsVideoDescription').value = video.description || '';
            document.getElementById('aboutUsVideoOrder').value = video.displayOrder || 0;
            document.getElementById('aboutUsVideoActive').checked = video.isActive !== false;
            document.getElementById('aboutUsVideoModalTitle').textContent = 'Edit About Us Video';
            document.getElementById('aboutUsVideoModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading video:', error);
        alert('Error loading video details');
    }
}

async function saveAboutUsVideo(e) {
    e.preventDefault();

    const videoId = document.getElementById('aboutUsVideoId').value;
    const uploadTab = document.getElementById('about-upload-tab');
    const isUploadTab = uploadTab.classList.contains('active');

    const title = document.getElementById('aboutUsVideoTitle').value;

    if (isUploadTab) {
        // Handle file upload
        const videoFile = document.getElementById('aboutUsVideoFile').files[0];

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

        uploadAboutUsVideoFile(videoFile, title, videoId);
    } else {
        // Handle URL upload
        const videoUrl = document.getElementById('aboutUsVideoUrl').value;

        if (!title || !videoUrl) {
            alert('Please fill in required fields');
            return;
        }

        saveAboutUsVideoUrl(videoUrl, title, videoId);
    }
}

// Upload About Us video file
function uploadAboutUsVideoFile(file, title, videoId) {
    const formData = new FormData();
    formData.append('video', file);

    // Show progress
    const uploadProgress = document.getElementById('aboutUsUploadProgress');
    uploadProgress.style.display = 'block';

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            document.getElementById('aboutUsProgressFill').style.width = percentComplete + '%';
            document.getElementById('aboutUsProgressText').textContent = Math.round(percentComplete) + '% Uploading...';
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
                    saveAboutUsVideoUrl(videoUrl, title, videoId);
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

    const token = localStorage.getItem('token');
    xhr.open('POST', `${API_URL}/uploads/upload-video`);

    // Don't set Content-Type header - let the browser set it for FormData
    if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
}

// Save About Us video with URL
async function saveAboutUsVideoUrl(videoUrl, title, videoId) {
    const videoData = {
        title: title,
        videoUrl: videoUrl,
        thumbnailUrl: document.getElementById('aboutUsVideoThumbnail').value,
        description: document.getElementById('aboutUsVideoDescription').value,
        category: 'about-us',
        displayOrder: parseInt(document.getElementById('aboutUsVideoOrder').value) || 0,
        isActive: document.getElementById('aboutUsVideoActive').checked
    };

    try {
        const url = videoId ? `${API_URL}/videos/${videoId}` : `${API_URL}/videos`;
        const method = videoId ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoData)
        });

        const result = await response.json();

        if (result.success) {
            alert(videoId ? 'Video updated successfully!' : 'Video added successfully!');
            closeAboutUsVideoModal();
            loadAboutUsVideos();

            AdminStorage.addActivity({
                type: videoId ? 'about_us_video_updated' : 'about_us_video_added',
                action: videoId ? 'Updated an About Us video' : 'Added a new About Us video'
            });
        } else {
            alert('Error saving video: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving video:', error);
        alert('Error saving video');
    }
}

async function toggleAboutUsVideoStatus(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}/toggle`, {
            method: 'PATCH'
        });
        const result = await response.json();

        if (result.success) {
            loadAboutUsVideos();
        } else {
            alert('Error toggling video status');
        }
    } catch (error) {
        console.error('Error toggling video:', error);
    }
}

async function deleteAboutUsVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('Video deleted successfully!');
            loadAboutUsVideos();

            AdminStorage.addActivity({
                type: 'about_us_video_deleted',
                action: 'Deleted an About Us video'
            });
        } else {
            alert('Error deleting video');
        }
    } catch (error) {
        console.error('Error deleting video:', error);
    }
}

// Unit Management Functions
let unitsCount = 0;

function addUnitField() {
    unitsCount++;
    const unitId = `unit-${unitsCount}`;
    const unitsList = document.getElementById('unitsList');

    const unitDiv = document.createElement('div');
    unitDiv.id = unitId;
    unitDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px; border: 1px solid #e0e0e0;';

    unitDiv.innerHTML = `
        <div>
            <select class="unit-type-select" required>
                <option value="">Select Unit Type</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="litre">Litre (L)</option>
                <option value="ml">Millilitre (ml)</option>
                <option value="g">Gram (g)</option>
                <option value="piece">Piece</option>
            </select>
        </div>
        <div>
            <input type="number" class="unit-quantity-input" placeholder="Quantity (e.g., 500 for 500ml)" required>
        </div>
        <div>
            <input type="number" class="unit-price-input" placeholder="Price (₹)" step="0.01" required>
        </div>
        <button type="button" class="btn-remove-unit" onclick="removeUnitField('${unitId}')" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-trash"></i>
        </button>
    `;

    unitsList.appendChild(unitDiv);
}

function removeUnitField(unitId) {
    const unitElement = document.getElementById(unitId);
    if (unitElement) {
        unitElement.remove();
    }
}

function getUnitsFromForm() {
    const unitsList = document.getElementById('unitsList');
    const units = [];

    unitsList.querySelectorAll('[id^="unit-"]').forEach(unitDiv => {
        const unitType = unitDiv.querySelector('.unit-type-select').value;
        const quantity = unitDiv.querySelector('.unit-quantity-input').value;
        const price = unitDiv.querySelector('.unit-price-input').value;

        if (unitType && quantity && price) {
            units.push({
                unit: unitType,
                quantity: parseInt(quantity),
                price: parseFloat(price)
            });
        }
    });

    return units;
}

function clearUnitsForm() {
    document.getElementById('unitsList').innerHTML = '';
    unitsCount = 0;
}

// ===================================================================
// ===== RECIPE VIDEOS MANAGEMENT =====
// ===================================================================

let recipeVideoUploadedUrl = '';
let isRecipeVideoUploading = false;
let allRecipeVideosCache = [];
let recipeProductSearchTimeout = null;

// ---- Load & Display ----
async function loadRecipeVideos() {
    try {
        const resp = await fetch(`${API_URL}/videos/admin/all?category=recipe`);
        const data = await resp.json();
        allRecipeVideosCache = (data.data || []).filter(v => v.category === 'recipe');
        renderRecipeVideosTable(allRecipeVideosCache);
        updateRecipeVideoStats(allRecipeVideosCache);
        updateRecipeVideoBadge(allRecipeVideosCache.length);
    } catch (err) {
        console.error('Error loading recipe videos:', err);
        document.getElementById('recipeVideosTableBody').innerHTML =
            '<tr><td colspan="6" class="text-center text-danger">Error loading recipe videos</td></tr>';
    }
}

function renderRecipeVideosTable(videos) {
    const tbody = document.getElementById('recipeVideosTableBody');
    if (!videos || videos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding:40px;">
                    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
                        <i class="fas fa-film" style="font-size:48px;color:#ddd;"></i>
                        <p style="color:#999;font-size:15px;">No recipe videos yet</p>
                        <button class="btn btn-primary" onclick="openRecipeVideoModal()">
                            <i class="fas fa-plus"></i> Add First Recipe Video
                        </button>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = videos.map(video => {
        const productLabel = escapeHtml(video.productName || 'Not linked');
        const videoSrc = getFullUrl(video.videoUrl);
        const isYoutube = video.videoUrl && (video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be'));
        const isVimeo = video.videoUrl && video.videoUrl.includes('vimeo.com');
        const isExternalEmbed = isYoutube || isVimeo;

        let previewHtml;
        if (isExternalEmbed) {
            previewHtml = `<div class="recipe-preview-thumb" style="width:90px;height:56px;background:#1a1a2e;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="window.open('${escapeHtml(videoSrc)}','_blank')" title="Open in new tab"><i class='fas fa-play-circle' style='color:#fff;font-size:24px;'></i></div>`;
        } else if (videoSrc) {
            previewHtml = `<video src="${escapeHtml(videoSrc)}" style="width:90px;height:56px;object-fit:cover;border-radius:6px;" muted preload="metadata"></video>`;
        } else {
            previewHtml = `<div style="width:90px;height:56px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;"><i class='fas fa-video' style='color:#bbb;font-size:20px;'></i></div>`;
        }

        return `
        <tr>
            <td data-label="Preview">${previewHtml}</td>
            <td data-label="Product">
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <strong>${productLabel}</strong>
                    ${video.productId ? `<small style="color:#aaa;font-size:11px;">ID: ${video.productId}</small>` : ''}
                </div>
            </td>
            <td data-label="Title">${escapeHtml(video.title || '-')}</td>
            <td data-label="Status">
                <span class="status-badge ${video.isActive ? 'status-active' : 'status-inactive'}">
                    ${video.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td data-label="Views">${video.views || 0}</td>
            <td data-label="Actions">
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="editRecipeVideo('${video._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${video.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleRecipeVideoStatus('${video._id}')" title="${video.isActive ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${video.isActive ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecipeVideo('${video._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateRecipeVideoStats(videos) {
    const total = videos.length;
    const active = videos.filter(v => v.isActive).length;
    const linked = videos.filter(v => v.productId).length;
    const elTotal = document.getElementById('totalRecipeVideosCount');
    const elActive = document.getElementById('activeRecipeVideosCount');
    const elLinked = document.getElementById('linkedProductsCount');
    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elLinked) elLinked.textContent = linked;
}

function updateRecipeVideoBadge(count) {
    const badge = document.getElementById('recipeVideoBadge');
    if (badge) badge.textContent = count;
}

// ---- Filter/Search ----
function filterRecipeVideos() {
    const query = (document.getElementById('recipeVideoSearch')?.value || '').toLowerCase();
    const status = document.getElementById('recipeVideoStatusFilter')?.value || 'all';
    let filtered = allRecipeVideosCache;
    if (query) {
        filtered = filtered.filter(v =>
            (v.productName || '').toLowerCase().includes(query) ||
            (v.title || '').toLowerCase().includes(query)
        );
    }
    if (status === 'active') filtered = filtered.filter(v => v.isActive);
    if (status === 'inactive') filtered = filtered.filter(v => !v.isActive);
    renderRecipeVideosTable(filtered);
}

// ---- Modal Open/Close ----
function openRecipeVideoModal(productId, productName) {
    // Reset form
    document.getElementById('recipeVideoId').value = '';
    document.getElementById('recipeVideoForm').reset();
    document.getElementById('recipeVideoModalTitle').innerHTML = '<i class="fas fa-film"></i> Add Recipe Video';
    document.getElementById('recipeVideoIsActive').checked = true;
    clearRecipeVideoFile();
    recipeVideoUploadedUrl = '';
    isRecipeVideoUploading = false;

    // Pre-fill product if passed from product row
    if (productId && productName) {
        document.getElementById('recipeVideoProductId').value = productId;
        document.getElementById('recipeVideoProductName').value = productName;
        document.getElementById('recipeVideoProductSearch').value = productName;
        document.getElementById('recipeVideoProductSearch').disabled = true;
        document.getElementById('selectedProductLabel').textContent = productName;
        document.getElementById('selectedProductBadge').style.display = 'flex';
    } else {
        document.getElementById('recipeVideoProductId').value = '';
        document.getElementById('recipeVideoProductName').value = '';
        document.getElementById('recipeVideoProductSearch').value = '';
        document.getElementById('recipeVideoProductSearch').disabled = false;
        document.getElementById('selectedProductBadge').style.display = 'none';
    }
    document.getElementById('recipeProductDropdown').style.display = 'none';
    switchRecipeTab('upload');
    document.getElementById('recipeVideoModal').classList.add('show');

    // Setup form submit
    const form = document.getElementById('recipeVideoForm');
    form.onsubmit = saveRecipeVideo;
}

function closeRecipeVideoModal() {
    document.getElementById('recipeVideoModal').classList.remove('show');
    clearRecipeVideoFile();
    document.getElementById('recipeProductDropdown').style.display = 'none';
}

// ---- Product Search in Modal ----
async function searchProductsForRecipeVideo(query) {
    const dropdown = document.getElementById('recipeProductDropdown');
    if (!query || query.length < 2) {
        dropdown.style.display = 'none';
        return;
    }
    clearTimeout(recipeProductSearchTimeout);
    recipeProductSearchTimeout = setTimeout(async () => {
        try {
            const resp = await fetch(`${API_URL}/products?name=${encodeURIComponent(query)}&limit=10`);
            const data = await resp.json();
            const products = data.data || [];
            if (products.length === 0) {
                dropdown.innerHTML = '<div class="recipe-dropdown-item" style="color:#999;">No products found</div>';
                dropdown.style.display = 'block';
                return;
            }
            dropdown.innerHTML = products.map(p => `
                <div class="recipe-dropdown-item" onclick="selectRecipeProduct('${p._id}', '${escapeHtml(p.name).replace(/'/g, "&apos;")}')">
                    <i class="fas fa-box" style="color:#2ecc71; margin-right:8px;"></i>
                    ${escapeHtml(p.name)}
                    <small style="color:#aaa; margin-left:8px;">${p.category || ''}</small>
                </div>
            `).join('');
            dropdown.style.display = 'block';
        } catch (err) {
            console.error('Error searching products:', err);
        }
    }, 300);
}

function selectRecipeProduct(productId, productName) {
    document.getElementById('recipeVideoProductId').value = productId;
    document.getElementById('recipeVideoProductName').value = productName;
    document.getElementById('recipeVideoProductSearch').value = productName;
    document.getElementById('selectedProductLabel').textContent = productName;
    document.getElementById('selectedProductBadge').style.display = 'flex';
    document.getElementById('recipeProductDropdown').style.display = 'none';
}

function clearRecipeProductSelection() {
    document.getElementById('recipeVideoProductId').value = '';
    document.getElementById('recipeVideoProductName').value = '';
    document.getElementById('recipeVideoProductSearch').value = '';
    document.getElementById('recipeVideoProductSearch').disabled = false;
    document.getElementById('selectedProductBadge').style.display = 'none';
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    const search = document.getElementById('recipeVideoProductSearch');
    const dropdown = document.getElementById('recipeProductDropdown');
    if (search && dropdown && !search.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// ---- Tab Switching ----
function switchRecipeTab(tab) {
    const uploadTab = document.getElementById('recipeUploadTab');
    const urlTab = document.getElementById('recipeUrlTab');
    const uploadBtn = document.getElementById('recipeUploadTabBtn');
    const urlBtn = document.getElementById('recipeUrlTabBtn');
    if (tab === 'upload') {
        uploadTab.style.display = 'block';
        urlTab.style.display = 'none';
        uploadBtn.classList.add('active');
        urlBtn.classList.remove('active');
    } else {
        uploadTab.style.display = 'none';
        urlTab.style.display = 'block';
        urlBtn.classList.add('active');
        uploadBtn.classList.remove('active');
    }
}

// ---- Video File Handling ----
function handleRecipeVideoSelect() {
    const fileInput = document.getElementById('recipeVideoFile');
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file (MP4, WebM, OGG)');
        fileInput.value = '';
        return;
    }
    if (file.size > 100 * 1024 * 1024) {
        alert('Video file must be under 100MB');
        fileInput.value = '';
        return;
    }

    // Show local preview immediately
    const previewBox = document.getElementById('recipeVideoPreviewBox');
    const previewVid = document.getElementById('recipeVideoPreview');
    previewVid.src = URL.createObjectURL(file);
    previewBox.style.display = 'block';

    // Upload via XHR for progress tracking
    uploadRecipeVideoWithProgress(file);
}

function uploadRecipeVideoWithProgress(file) {
    const formData = new FormData();
    formData.append('video', file);

    isRecipeVideoUploading = true;
    recipeVideoUploadedUrl = '';

    const progressDiv = document.getElementById('recipeUploadProgress');
    const progressFill = document.getElementById('recipeProgressFill');
    const progressText = document.getElementById('recipeProgressText');
    const saveBtn = document.getElementById('recipeVideoSaveBtn');

    progressDiv.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading... 0%';
    if (saveBtn) saveBtn.disabled = true;

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = pct + '%';
            progressText.textContent = `Uploading... ${pct}%`;
        }
    });

    xhr.addEventListener('load', () => {
        progressDiv.style.display = 'none';
        isRecipeVideoUploading = false;
        if (saveBtn) saveBtn.disabled = false;
        try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status === 200 && result.success) {
                recipeVideoUploadedUrl = result.videoUrl || (result.data && result.data.videoUrl);
                progressText.textContent = '✅ Uploaded!';
                progressDiv.style.display = 'block';
                setTimeout(() => { progressDiv.style.display = 'none'; }, 2500);
            } else {
                alert('Upload failed: ' + (result.message || 'Unknown error'));
                clearRecipeVideoFile();
            }
        } catch (e) {
            alert('Upload error: ' + e.message);
            clearRecipeVideoFile();
        }
    });

    xhr.addEventListener('error', () => {
        progressDiv.style.display = 'none';
        isRecipeVideoUploading = false;
        if (saveBtn) saveBtn.disabled = false;
        alert('Network error during video upload. Please check your connection.');
        clearRecipeVideoFile();
    });

    xhr.open('POST', `${API_URL}/uploads/upload-video`);
    xhr.send(formData);
}

function clearRecipeVideoFile() {
    const fileInput = document.getElementById('recipeVideoFile');
    const previewBox = document.getElementById('recipeVideoPreviewBox');
    const previewVid = document.getElementById('recipeVideoPreview');
    const progressDiv = document.getElementById('recipeUploadProgress');
    if (fileInput) fileInput.value = '';
    if (previewVid) previewVid.src = '';
    if (previewBox) previewBox.style.display = 'none';
    if (progressDiv) progressDiv.style.display = 'none';
    recipeVideoUploadedUrl = '';
    isRecipeVideoUploading = false;
}

// ---- Save Recipe Video ----
async function saveRecipeVideo(e) {
    if (e) e.preventDefault();

    if (isRecipeVideoUploading) {
        alert('⏳ Please wait for the video upload to complete.');
        return;
    }

    const recipeVideoId = document.getElementById('recipeVideoId').value;
    const productId = document.getElementById('recipeVideoProductId').value;
    const productName = document.getElementById('recipeVideoProductName').value;
    const title = document.getElementById('recipeVideoTitle').value.trim();
    const description = document.getElementById('recipeVideoDescription').value.trim();
    const isActive = document.getElementById('recipeVideoIsActive').checked;

    // Determine video source
    const isUploadTab = document.getElementById('recipeUploadTab').style.display !== 'none';
    let videoUrl = '';
    if (isUploadTab) {
        videoUrl = recipeVideoUploadedUrl;
        if (!recipeVideoId && !videoUrl) {
            alert('❌ Please upload a video file first.');
            return;
        }
    } else {
        videoUrl = document.getElementById('recipeVideoUrlInput').value.trim();
        if (!recipeVideoId && !videoUrl) {
            alert('❌ Please enter a video URL.');
            return;
        }
    }

    if (!title) {
        alert('❌ Video title is required.');
        return;
    }

    if (!productId && !recipeVideoId) {
        alert('❌ Please select a product for this recipe video.');
        return;
    }

    const payload = {
        title,
        description,
        category: 'recipe',
        isActive,
        productId: productId || null,
        productName: productName || '',
    };
    if (videoUrl) payload.videoUrl = videoUrl;

    const saveBtn = document.getElementById('recipeVideoSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }

    try {
        const url = recipeVideoId ? `${API_URL}/videos/${recipeVideoId}` : `${API_URL}/videos`;
        const method = recipeVideoId ? 'PUT' : 'POST';

        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await resp.json();

        if (result.success) {
            // Also update recipeVideoUrl on the product record for quick access
            if (productId && videoUrl) {
                await fetch(`${API_URL}/products/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipeVideoUrl: videoUrl })
                }).catch(() => { });
            }

            alert(recipeVideoId ? '✅ Recipe video updated!' : '✅ Recipe video added!');
            closeRecipeVideoModal();
            loadRecipeVideos();
        } else {
            alert('❌ Error: ' + (result.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error saving recipe video:', err);
        alert('❌ Error saving recipe video: ' + err.message);
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Recipe Video'; }
    }
}

// ---- Edit Recipe Video ----
async function editRecipeVideo(videoId) {
    try {
        const resp = await fetch(`${API_URL}/videos/${videoId}`);
        const data = await resp.json();

        if (data.success && data.data) {
            const v = data.data;

            document.getElementById('recipeVideoId').value = v._id;
            document.getElementById('recipeVideoTitle').value = v.title || '';
            document.getElementById('recipeVideoDescription').value = v.description || '';
            document.getElementById('recipeVideoIsActive').checked = v.isActive !== false;
            document.getElementById('recipeVideoModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Recipe Video';

            // Set product info
            if (v.productId) {
                document.getElementById('recipeVideoProductId').value = v.productId;
                document.getElementById('recipeVideoProductName').value = v.productName || '';
                document.getElementById('recipeVideoProductSearch').value = v.productName || '';
                document.getElementById('recipeVideoProductSearch').disabled = true;
                document.getElementById('selectedProductLabel').textContent = v.productName || v.productId;
                document.getElementById('selectedProductBadge').style.display = 'flex';
            } else {
                clearRecipeProductSelection();
            }

            // Show existing video preview
            recipeVideoUploadedUrl = '';
            clearRecipeVideoFile();
            if (v.videoUrl) {
                const isExternalUrl = v.videoUrl.startsWith('http') && !v.videoUrl.startsWith(window.location.origin);
                const isEmbed = v.videoUrl.includes('youtube') || v.videoUrl.includes('vimeo');
                if (isEmbed || isExternalUrl) {
                    // Show as URL tab
                    switchRecipeTab('url');
                    document.getElementById('recipeVideoUrlInput').value = v.videoUrl;
                } else {
                    // Show as upload tab with preview
                    switchRecipeTab('upload');
                    const previewVid = document.getElementById('recipeVideoPreview');
                    const previewBox = document.getElementById('recipeVideoPreviewBox');
                    previewVid.src = getFullUrl(v.videoUrl);
                    previewBox.style.display = 'block';
                    recipeVideoUploadedUrl = v.videoUrl;
                }
            } else {
                switchRecipeTab('upload');
            }

            document.getElementById('recipeProductDropdown').style.display = 'none';
            const form = document.getElementById('recipeVideoForm');
            form.onsubmit = saveRecipeVideo;
            document.getElementById('recipeVideoModal').classList.add('show');
        }
    } catch (err) {
        console.error('Error loading recipe video:', err);
        alert('Error loading recipe video details');
    }
}

// ---- Toggle Status ----
async function toggleRecipeVideoStatus(videoId) {
    try {
        const resp = await fetch(`${API_URL}/videos/${videoId}/toggle`, { method: 'PATCH' });
        const result = await resp.json();
        if (result.success) {
            loadRecipeVideos();
        } else {
            alert('Error toggling video status');
        }
    } catch (err) {
        console.error('Error toggling recipe video:', err);
    }
}

// ---- Delete ----
async function deleteRecipeVideo(videoId) {
    if (!confirm('Are you sure you want to delete this recipe video? This action cannot be undone.')) return;
    try {
        const resp = await fetch(`${API_URL}/videos/${videoId}`, { method: 'DELETE' });
        const result = await resp.json();
        if (result.success) {
            alert('✅ Recipe video deleted successfully!');
            loadRecipeVideos();
        } else {
            alert('Error deleting recipe video');
        }
    } catch (err) {
        console.error('Error deleting recipe video:', err);
    }
}

// Load recipe video badge on page init
document.addEventListener('DOMContentLoaded', () => {
    fetch(`${API_URL}/videos/admin/all`)
        .then(r => r.json())
        .then(data => {
            const recipeVids = (data.data || []).filter(v => v.category === 'recipe');
            updateRecipeVideoBadge(recipeVids.length);
        })
        .catch(() => { });
});

// =====================================================================
// ===== CATEGORY MODAL FUNCTIONS (added for completeness) ===========
// =====================================================================

function openCategoryModal(categoryId) {
    const form = document.getElementById('categoryForm');
    if (form) form.reset();
    document.getElementById('categoryId').value = categoryId || '';
    const title = document.getElementById('categoryModalTitle');
    if (title) title.textContent = categoryId ? 'Edit Category' : 'Add New Category';
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('show');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('show');
}

// =====================================================================
// ===== EXPOSE ALL CLICK-HANDLER FUNCTIONS ON WINDOW ================
// This ensures inline onclick handlers in the HTML always work
// even in edge-case scope situations (e.g. CSP, certain bundlers).
// =====================================================================

window.loadProducts = loadProducts;
window.loadUsers = loadUsers;
window.loadMessages = loadMessages;
window.loadOrders = loadOrders;
window.loadReviews = loadReviews;
window.loadVideos = loadVideos;
window.loadRecipeVideos = loadRecipeVideos;
window.loadAboutUsVideos = loadAboutUsVideos;
window.loadDashboardData = loadDashboardData;
window.filterRecipeVideos = filterRecipeVideos;

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.quickUpdateStock = quickUpdateStock;
window.addUnitField = addUnitField;
window.removeUnitField = removeUnitField;
window.removeImage = removeImage;
window.loadCategoriesForSelect = loadCategoriesForSelect;
window.populateCategoryDatalist = populateCategoryDatalist;

window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;

window.editUser = editUser;
window.deleteUser = deleteUser;
window.closeUserModal = closeUserModal;

window.viewMessage = viewMessage;
window.closeMessageModal = closeMessageModal;
window.markAsRead = markAsRead;
window.deleteMessage = deleteMessage;

window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.closeOrderModal = closeOrderModal;
window.closeStatusModal = closeStatusModal;
window.confirmStatusUpdate = confirmStatusUpdate;
window.deleteOrder = deleteOrder;

window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.editVideo = editVideo;
window.toggleVideoStatus = toggleVideoStatus;
window.deleteVideo = deleteVideo;
window.removeVideo = removeVideo;

window.openAboutUsVideoModal = openAboutUsVideoModal;
window.closeAboutUsVideoModal = closeAboutUsVideoModal;
window.editAboutUsVideo = editAboutUsVideo;
window.saveAboutUsVideo = saveAboutUsVideo;
window.toggleAboutUsVideoStatus = toggleAboutUsVideoStatus;
window.deleteAboutUsVideo = deleteAboutUsVideo;
window.switchAboutUsSourceTab = switchAboutUsSourceTab;

window.openRecipeVideoModal = openRecipeVideoModal;
window.closeRecipeVideoModal = closeRecipeVideoModal;
window.editRecipeVideo = editRecipeVideo;
window.deleteRecipeVideo = deleteRecipeVideo;
window.toggleRecipeVideoStatus = toggleRecipeVideoStatus;
window.saveRecipeVideo = saveRecipeVideo;
window.handleRecipeVideoSelect = handleRecipeVideoSelect;
window.clearRecipeVideoFile = clearRecipeVideoFile;
window.searchProductsForRecipeVideo = searchProductsForRecipeVideo;
window.selectRecipeProduct = selectRecipeProduct;
window.clearRecipeProductSelection = clearRecipeProductSelection;
window.switchRecipeTab = switchRecipeTab;

window.clearAllReviews = clearAllReviews;
window.deleteReview = deleteReview;

window.generateSalesReport = generateSalesReport;
window.generateCustomerReport = generateCustomerReport;
window.generateInventoryReport = generateInventoryReport;
window.exportAnalyticsToCSV = exportAnalyticsToCSV;
window.viewActivityLog = viewActivityLog;

// ═══════════════════════════════════════════════════════════════
// ABOUT US IMAGES MANAGEMENT
// ═══════════════════════════════════════════════════════════════

const aboutImagesKey = 'kcpAboutUsImages';

function getAboutImages() {
    return JSON.parse(localStorage.getItem(aboutImagesKey) || '{}');
}

function saveAboutImages(images) {
    localStorage.setItem(aboutImagesKey, JSON.stringify(images));
}

function uploadAboutImage(type) {
    const fileInput = document.getElementById(type + 'ImageFile');
    if (!fileInput || !fileInput.files[0]) {
        alert('Please select an image file first.');
        return;
    }

    const file = fileInput.files[0];
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const images = getAboutImages();
        images[type] = e.target.result;
        saveAboutImages(images);

        // Update preview
        const imgEl = document.getElementById(type + 'ImageImg');
        const placeholder = document.getElementById(type + 'ImagePlaceholder');
        const removeBtn = document.getElementById('remove' + type.charAt(0).toUpperCase() + type.slice(1) + 'Btn');

        if (imgEl) {
            imgEl.src = e.target.result;
            imgEl.style.display = 'block';
        }
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        if (removeBtn) {
            removeBtn.disabled = false;
        }

        alert('✅ Image uploaded successfully!');
        fileInput.value = '';
    };
    reader.readAsDataURL(file);
}

function removeAboutImage(type) {
    if (!confirm('Are you sure you want to remove this image?')) return;

    const images = getAboutImages();
    delete images[type];
    saveAboutImages(images);

    const imgEl = document.getElementById(type + 'ImageImg');
    const placeholder = document.getElementById(type + 'ImagePlaceholder');
    const removeBtn = document.getElementById('remove' + type.charAt(0).toUpperCase() + type.slice(1) + 'Btn');

    if (imgEl) {
        imgEl.src = '';
        imgEl.style.display = 'none';
    }
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
    if (removeBtn) {
        removeBtn.disabled = true;
    }

    alert('✅ Image removed.');
}

function loadAboutImages() {
    const images = getAboutImages();

    // Load story image
    if (images.story) {
        const img = document.getElementById('storyImageImg');
        const ph = document.getElementById('storyImagePlaceholder');
        const btn = document.getElementById('removeStoryBtn');
        if (img) { img.src = images.story; img.style.display = 'block'; }
        if (ph) { ph.style.display = 'none'; }
        if (btn) { btn.disabled = false; }
    }

    // Load udyam image
    if (images.udyam) {
        const img = document.getElementById('udyamImageImg');
        const ph = document.getElementById('udyamImagePlaceholder');
        const btn = document.getElementById('removeUdyamBtn');
        if (img) { img.src = images.udyam; img.style.display = 'block'; }
        if (ph) { ph.style.display = 'none'; }
        if (btn) { btn.disabled = false; }
    }

    // Load fssai image
    if (images.fssai) {
        const img = document.getElementById('fssaiImageImg');
        const ph = document.getElementById('fssaiImagePlaceholder');
        const btn = document.getElementById('removeFssaiBtn');
        if (img) { img.src = images.fssai; img.style.display = 'block'; }
        if (ph) { ph.style.display = 'none'; }
        if (btn) { btn.disabled = false; }
    }

    // Load gallery images
    loadGalleryAdmin();
}

// Gallery images management
function getGalleryImages() {
    const images = getAboutImages();
    return images.gallery || [];
}

function saveGalleryImages(gallery) {
    const images = getAboutImages();
    images.gallery = gallery;
    saveAboutImages(images);
}

function loadGalleryAdmin() {
    const gallery = getGalleryImages();
    const grid = document.getElementById('galleryAdminGrid');
    if (!grid) return;

    if (gallery.length === 0) {
        grid.innerHTML = '<p style="color: #999; text-align: center; padding: 20px; grid-column: 1 / -1;">No gallery images added yet. Click "Add Gallery Image" to get started.</p>';
        return;
    }

    grid.innerHTML = gallery.map((item, index) => `
        <div style="border: 1px solid #eee; border-radius: 8px; padding: 12px; position: relative;">
            <img src="${item.src}" alt="${item.title}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;">
            <input type="text" value="${item.title}" placeholder="Image title" onchange="updateGalleryTitle(${index}, this.value)" style="width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; margin-bottom: 6px;">
            <div style="display: flex; gap: 6px;">
                <label style="flex: 1;">
                    <input type="file" accept="image/*" onchange="replaceGalleryImage(${index}, this)" style="font-size: 11px; width: 100%;">
                </label>
                <button class="btn btn-danger" onclick="removeGalleryImage(${index})" style="font-size: 11px; padding: 4px 8px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function addGalleryImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const gallery = getGalleryImages();
            gallery.push({ src: e.target.result, title: 'Gallery Image ' + (gallery.length + 1) });
            saveGalleryImages(gallery);
            loadGalleryAdmin();
            alert('✅ Gallery image added!');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function updateGalleryTitle(index, title) {
    const gallery = getGalleryImages();
    if (gallery[index]) {
        gallery[index].title = title;
        saveGalleryImages(gallery);
    }
}

function replaceGalleryImage(index, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const gallery = getGalleryImages();
        if (gallery[index]) {
            gallery[index].src = e.target.result;
            saveGalleryImages(gallery);
            loadGalleryAdmin();
            alert('✅ Gallery image updated!');
        }
    };
    reader.readAsDataURL(file);
}

function removeGalleryImage(index) {
    if (!confirm('Remove this gallery image?')) return;
    const gallery = getGalleryImages();
    gallery.splice(index, 1);
    saveGalleryImages(gallery);
    loadGalleryAdmin();
    alert('✅ Gallery image removed.');
}

// Load about images when section is shown
window.uploadAboutImage = uploadAboutImage;
window.removeAboutImage = removeAboutImage;
window.addGalleryImage = addGalleryImage;
window.updateGalleryTitle = updateGalleryTitle;
window.replaceGalleryImage = replaceGalleryImage;
window.removeGalleryImage = removeGalleryImage;

// Auto-load about images when the section becomes active
document.addEventListener('DOMContentLoaded', function () {
    // Observe section changes to load about images
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.target.classList && mutation.target.classList.contains('active') && mutation.target.id === 'aboutusimages') {
                loadAboutImages();
            }
        });
    });

    const aboutSection = document.getElementById('aboutusimages');
    if (aboutSection) {
        observer.observe(aboutSection, { attributes: true, attributeFilter: ['class'] });
    }
});

window.waRefreshStatus = waRefreshStatus;
window.waSendTest = waSendTest;
window.waClearSession = waClearSession;

// Expose the unified badge refresh on window so it's always available
window.refreshAllBadges = refreshAllBadges;
window.setBadge = setBadge;
window._cachedCategories = _cachedCategories; // for debugging
window._lastCategoriesFetch = _lastCategoriesFetch;
window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;

// logout was already exposed on window in the file

console.log('✅ All click-handler functions exposed on window for inline onclick safety');
