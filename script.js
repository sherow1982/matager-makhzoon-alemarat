// =========================================
// 1. إعدادات المتجر
// =========================================
const WHATSAPP_NUMBER = "201110760081";
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentIndex = 0;
const ITEMS_PER_PAGE = 24;

// =========================================
// 2. التحميل الأولي
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    
    // إضافة زر البحث للموبايل
    setupMobileSearch();

    const isInsidePages = window.location.pathname.includes('/pages/');
    const jsonPath = isInsidePages ? '../products.json' : 'products.json';

    if (document.getElementById('checkout-items')) {
        loadCheckoutItems();
    } else if (document.getElementById('app-content')) {
        fetchProducts(jsonPath);
    }
});

// =========================================
// تحسين الصور (داخلي)
// =========================================
function optimizeImage(url, width = 400) {
    if (!url) return 'images/icon-192.png';
    // نعتمد على الصور الأصلية الآن لأنها الأضمن
    // إذا كنت تستخدم WSrv.nl سابقاً، يمكنك إرجاعه هنا
    return url;
}

// =========================================
// 3. جلب البيانات والتوجيه
// =========================================
async function fetchProducts(path) {
    try {
        const response = await fetch(path);
        allProducts = await response.json();
        const urlParams = new URLSearchParams(window.location.search);
        const productSlug = urlParams.get('product');

        if (productSlug) {
            renderSingleProduct(productSlug);
        } else {
            renderHomePage();
        }
    } catch (error) {
        console.error("Error loading products:", error);
        const app = document.getElementById('app-content');
        if (app && !window.location.pathname.includes('legal')) {
            app.innerHTML = '<p class="text-center" style="padding:50px">جاري تحميل المنتجات...</p>';
        }
    }
}

// دوال مساعدة
function getProductPrice(product) {
    return (product['sale price'] && product['sale price'] < product.price) ? product['sale price'] : product.price;
}

function renderPriceHTML(product) {
    const currentPrice = getProductPrice(product);
    if (product['sale price'] && product['sale price'] < product.price) {
        return `<div class="price-box">
                    <span class="text-through">${product.price} AED</span> 
                    <span class="price-sale">${currentPrice} AED</span>
                </div>`;
    } else {
        return `<span class="price-normal">${currentPrice} AED</span>`;
    }
}

function getProductDescriptionHTML(product) {
    if (product.description && product.description.trim().length > 0) return product.description;
    return `
        <p>نقدم لك <strong>${product.title}</strong>، الخيار الأمثل لمن يبحث عن التميز والجودة العالية.</p>
        <p>تم اختيار هذا المنتج بعناية في <strong>مخزون الإمارات</strong> ليوفر لك تجربة استخدام عملية ومريحة.</p>
        <p>احصل عليه الآن بسعر منافس واستفد من خدمة الشحن السريع والدفع عند الاستلام.</p>
    `;
}

// =========================================
// دالة توليد البطاقة
// =========================================
function generateProductCardHTML(product) {
    const slug = encodeURIComponent(product.title.replace(/\s+/g, '-'));
    const imageSrc = product['image link'];

    let discountBadge = '';
    if (product['sale price'] && product['sale price'] < product.price) {
        const saved = Math.round(((product.price - product['sale price']) / product.price) * 100);
        discountBadge = `<span class="discount-badge">خصم ${saved}%</span>`;
    }
    
    return `
        <div class="product-card fade-in">
            ${discountBadge}
            <div class="product-img-wrapper">
                <a href="?product=${slug}">
                    <img src="${imageSrc}" alt="${product.title}" loading="lazy" class="product-img" onerror="this.onerror=null; this.src='images/icon-192.png';">
                </a>
            </div>
            <div class="product-info">
                <a href="?product=${slug}" class="product-title">${product.title}</a>
                ${renderPriceHTML(product)}
                <button class="btn-add" onclick="addToCart(${product.id})"><i class="fas fa-shopping-bag"></i> أضف للسلة</button>
            </div>
        </div>
    `;
}

// =========================================
// 4. SEO & Schema
// =========================================
function updateSEOAndSchema(product) {
    const currentPrice = getProductPrice(product);
    const plainDesc = product.description ? product.description.replace(/<[^>]*>?/gm, '') : `تسوق ${product.title} أونلاين في الإمارات.`;
    const imageUrl = product['image link'];
    const productUrl = window.location.href;
    
    document.title = `${product.title} | مخزون الإمارات`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = plainDesc;

    const oldScript = document.getElementById('dynamic-schema');
    if (oldScript) oldScript.remove();

    const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "image": [imageUrl],
        "description": plainDesc,
        "sku": product.sku || product.id,
        "brand": { "@type": "Brand", "name": "مخزون الإمارات" },
        "offers": {
            "@type": "Offer",
            "url": productUrl,
            "priceCurrency": "AED",
            "price": currentPrice,
            "availability": product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    const script = document.createElement('script');
    script.id = 'dynamic-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
}

// =========================================
// 5. الصفحة الرئيسية (محدث مع الفئات)
// =========================================

// --- تعريف الفئات ---
const CATEGORIES = [
    { id: 'all', name: 'الكل', icon: 'fas fa-th-large' },
    { id: '201', name: 'ساعات', icon: 'fas fa-clock', keywords: ["watch", "ساعة", "ساعه", "rolex", "رولكس", "omega", "اوميغا"] },
    { id: '486', name: 'عطور', icon: 'fas fa-spray-can', keywords: ["perfume", "fragrance", "عطر", "parfum"] },
    { id: '3032', name: 'حقائب', icon: 'fas fa-shopping-bag', keywords: ["bag", "حقيبة", "شنطة", "handbag", "purse"] },
    { id: '5613', name: 'سيارات', icon: 'fas fa-car', keywords: ["car", "سيارة", "vehicle", "auto", "tire"] },
    { id: '6980', name: 'أجهزة منزلية', icon: 'fas fa-home', keywords: ["heater", "دفاي", "مدفأ", "سخان", "blender", "خلاط", "kitchen", "kettle"] },
    { id: '1239', name: 'ألعاب', icon: 'fas fa-gamepad', keywords: ["game", "لعبة", "لعبه", "أطفال", "toy"] },
    { id: '3763', name: 'عناية ومساج', icon: 'fas fa-spa', keywords: ["massage", "مساج", "تدليك"] },
    { id: '1604', name: 'ملابس', icon: 'fas fa-tshirt', keywords: ["shirt", "clothing", "ملابس", "شورت"] }
];

let activeCategory = 'all';

function assignCategory(product) {
    const text = (product.title + " " + (product.description || "")).toLowerCase();
    for (let i = 1; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        if (cat.keywords && cat.keywords.some(k => text.includes(k))) {
            return cat.id;
        }
    }
    return 'other';
}

function renderCategories() {
    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
        <div class="category-container">
            <div class="category-scroll">
                ${CATEGORIES.map(cat => `
                    <div class="category-pill ${activeCategory === cat.id ? 'active' : ''}" 
                         onclick="filterByCategory('${cat.id}')">
                        <i class="${cat.icon}"></i> ${cat.name}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    return container;
}

function filterByCategory(catId) {
    activeCategory = catId;
    renderHomePage(); // Redraws everything with new filter
}

function renderHomePage() {
    document.title = "متجر مخزون الإمارات | تسوق بذكاء";
    const app = document.getElementById('app-content');
    if (!app) return;

    // Filter Logic
    let displayProducts = allProducts;
    if (activeCategory !== 'all') {
        displayProducts = allProducts.filter(p => assignCategory(p) === activeCategory);
    }
    
    // Reset Index for new list
    currentIndex = 0;
    
    // Build UI
    app.innerHTML = `
        <div class="hero-banner" style="background: linear-gradient(135deg, var(--uae-green), #000); color: white; padding: 40px 20px; border-radius: 8px; margin-top: 20px; text-align: center; margin-bottom:20px;">
            <h1 style="margin-bottom:10px">عروض مخزون الإمارات</h1>
            <p>أفضل المنتجات - شحن سريع - دفع عند الاستلام</p>
        </div>
    `;
    
    // Add Categories
    app.appendChild(renderCategories());
    
    // Add Grid Container
    const gridDiv = document.createElement('div');
    gridDiv.className = 'products-grid';
    gridDiv.id = 'products-grid-container';
    app.appendChild(gridDiv);
    
    // Add "Load More" or "No Products" msg
    const loadMoreDiv = document.createElement('div');
    loadMoreDiv.className = 'load-more-container';
    loadMoreDiv.style.textAlign = 'center';
    loadMoreDiv.style.margin = '40px 0';
    loadMoreDiv.innerHTML = displayProducts.length > 0 
        ? `<button id="load-more-btn" class="btn-load-more" onclick="loadNextBatchFiltered()">عرض المزيد من المنتجات</button>`
        : `<p style="color:#777; font-size:18px;">لا توجد منتجات في هذا القسم حالياً</p>`;
    app.appendChild(loadMoreDiv);

    // Initial Batch Load (Passing filtered list globally or handling via closure? 
    // Easier: Store filtered list in a global var or just utilize a helper)
    // To keep it simple without major refactor:
    window.currentFilteredProducts = displayProducts; // Store for batch loading
    loadNextBatchFiltered();
}

function loadNextBatchFiltered() {
    const container = document.getElementById('products-grid-container');
    const btn = document.getElementById('load-more-btn');
    if (!container) return;

    const batch = window.currentFilteredProducts.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
    if (batch.length === 0 && currentIndex === 0) return; // Empty handled in render

    batch.forEach(product => {
        container.innerHTML += generateProductCardHTML(product);
    });

    currentIndex += ITEMS_PER_PAGE;

    if (currentIndex >= window.currentFilteredProducts.length && btn) {
        btn.style.display = 'none';
    }
}

function loadNextBatch() {
    const container = document.getElementById('products-grid-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!container) return;

    const nextProducts = allProducts.slice(currentIndex, currentIndex + BATCH_SIZE);
    const htmlBatch = nextProducts.map(product => generateProductCardHTML(product)).join('');
    
    container.insertAdjacentHTML('beforeend', htmlBatch);
    currentIndex += BATCH_SIZE;

    if (currentIndex >= allProducts.length && loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
}

// =========================================
// 6. صفحة المنتج الفردي (المحسنة للعربية)
// =========================================
function renderSingleProduct(slug) {
    // دالة لتنظيف النص العربي وتوحيده
    const normalizeText = (text) => {
        if (!text) return "";
        return decodeURIComponent(text)
            .replace(/-/g, ' ')
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/\s+/g, ' ') // توحيد المسافات
            .trim();
    };

    const targetName = normalizeText(slug);

    const product = allProducts.find(p => {
        const productName = normalizeText(p.title);
        return productName === targetName || productName.includes(targetName) || targetName.includes(productName);
    });

    const app = document.getElementById('app-content');
    if (!app) return;

    if (!product) { 
        app.innerHTML = '<div class="text-center" style="padding:50px"><h2>المنتج غير موجود</h2><a href="index.html" class="btn-add" style="width:200px; margin:20px auto">العودة للرئيسية</a></div>'; 
        return; 
    }

    updateSEOAndSchema(product);
    const currentPrice = getProductPrice(product);
    const imageSrc = product['image link'];
    const additionalImage = product['additional image link'];
    const descriptionHTML = getProductDescriptionHTML(product);

    let galleryHTML = `<img id="main-img" src="${imageSrc}" alt="${product.title}" 
                            style="width:100%; border-radius:8px;"
                            onerror="this.onerror=null; this.src='images/icon-192.png';">`;
    
    if (additionalImage) {
        galleryHTML += `<div style="display:flex; gap:10px; margin-top:10px;">
            <img src="${imageSrc}" style="width:70px; height:70px; object-fit:cover; border:1px solid #ddd; cursor:pointer; border-radius:4px" 
                 onclick="document.getElementById('main-img').src='${imageSrc}'">
            <img src="${additionalImage}" style="width:70px; height:70px; object-fit:cover; border:1px solid #ddd; cursor:pointer; border-radius:4px" 
                 onclick="document.getElementById('main-img').src='${additionalImage}'">
        </div>`;
    }

    app.innerHTML = `
        <div class="breadcrumb"><a href="index.html">الرئيسية</a> / <span>${product.title}</span></div>
        <div class="single-product-container">
            <div class="single-img">${galleryHTML}</div>
            <div class="single-details">
                <h1>${product.title}</h1>
                <div style="margin-bottom:20px">${renderPriceHTML(product)}</div>
                <div class="product-description" style="margin-bottom:25px; color:#555; line-height:1.8; font-size:15px;">${descriptionHTML}</div>
                <div class="buy-actions">
                    <button class="btn-whatsapp-large" onclick="directOrder('${product.title}', ${currentPrice})"><i class="fab fa-whatsapp"></i> اطلب الآن عبر واتساب</button>
                    <button class="btn-add" onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> إضافة للسلة</button>
                </div>
                <button class="policy-btn-trigger" onclick="openPolicyModal()"><i class="fas fa-shield-alt"></i> سياسة الشحن والضمان والاسترجاع</button>
            </div>
        </div>
        <div class="related-products-section" style="margin-top:60px; border-top:1px solid #eee; padding-top:40px;">
            <h3 style="margin-bottom:20px; font-size:22px; color:var(--uae-black)">قد يعجبك أيضاً</h3>
            <div class="products-grid" id="related-products-container"></div>
        </div>
    `;
    renderRelatedProducts(product);
}

function renderRelatedProducts(currentProduct) {
    const container = document.getElementById('related-products-container');
    if (!container) return;
    const otherProducts = allProducts.filter(p => p.id !== currentProduct.id);
    const shuffled = otherProducts.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    const html = selected.map(p => generateProductCardHTML(p)).join('');
    container.innerHTML = html;
}

// =========================================
// 7. التحكم في النوافذ والسلة والبحث
// =========================================
function openPolicyModal() { const modal = document.getElementById('policyModal'); if (modal) modal.style.display = "block"; }
function closePolicyModal() { const modal = document.getElementById('policyModal'); if (modal) modal.style.display = "none"; }
window.onclick = function(event) { const modal = document.getElementById('policyModal'); if (event.target == modal) modal.style.display = "none"; }

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id: product.id, title: product.title, image: product['image link'], price: getProductPrice(product), qty: 1 });
    }
    saveCart();
    toggleCart(true);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    if (document.getElementById('checkout-items')) loadCheckoutItems();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    if (cartCount) cartCount.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    if (cartItemsContainer && cartTotal) {
        cartItemsContainer.innerHTML = '';
        let totalAmount = 0;
        cart.forEach(item => {
            totalAmount += item.price * item.qty;
            cartItemsContainer.innerHTML += `
                <div class="cart-item" style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px">
                    <img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:4px">
                    <div style="flex:1">
                        <h5 style="font-size:13px; margin-bottom:5px">${item.title}</h5>
                        <div style="display:flex; justify-content:space-between">
                            <span style="color:var(--uae-green); font-weight:bold">${item.price} x ${item.qty}</span>
                            <span style="color:#c00; cursor:pointer" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></span>
                        </div>
                    </div>
                </div>`;
        });
        cartTotal.innerText = totalAmount.toFixed(2) + ' درهم';
    }
}

function toggleCart(forceOpen = false) {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if (!sidebar) return;
    if (forceOpen) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    } else {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function checkoutPage() {
    if (cart.length === 0) { alert("السلة فارغة!"); return; }
    if (window.location.pathname.includes('/pages/')) {
        window.location.href = 'checkout.html';
    } else {
        window.location.href = 'pages/checkout.html';
    }
}

function loadCheckoutItems() {
    const container = document.getElementById('checkout-items');
    if (!container) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        if (window.location.pathname.includes('/pages/')) window.location.href = '../index.html';
        else window.location.href = 'index.html';
        return;
    }
    container.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        container.innerHTML += `<div class="summary-item"><div><img src="${item.image}" alt="${item.title}"></div><div><h4>${item.title}</h4><span>${item.qty} x ${item.price}</span></div><div style="margin-right:auto">${item.qty * item.price}</div></div>`;
    });
    const sub = document.getElementById('sub-total');
    const final = document.getElementById('final-total');
    if (sub) sub.innerText = total + ' درهم';
    if (final) final.innerText = total + ' درهم';
}

function directOrder(title, price) {
    let msg = `*استفسار عن منتج*%0a🛍️ ${title}%0a💰 ${price} درهم%0aهل متوفر؟`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

function searchProducts() {
    const searchInput = document.getElementById('search-input');
    // إذا لم يجد المربع العادي، ابحث عن المربع الموبايل
    const mobileInput = document.getElementById('mobile-search-input');
    const finalInput = searchInput && searchInput.offsetParent !== null ? searchInput : mobileInput;

    if (!finalInput) return;

    const query = finalInput.value.toLowerCase().trim();
    const app = document.getElementById('app-content');

    if (!query) { renderHomePage(); return; }

    const filteredProducts = allProducts.filter(product => product.title.toLowerCase().includes(query));

    app.innerHTML = `
        <div class="search-header" style="text-align:center; margin:30px 0;">
            <h2>نتائج البحث عن: "${finalInput.value}"</h2>
            <p style="color:#777">${filteredProducts.length} منتج مطابق</p>
            <button onclick="window.location.reload()" class="btn-add" style="width:auto; display:inline-block; background:#555; margin-top:10px; padding:8px 20px">عودة للرئيسية</button>
        </div>
        <div class="products-grid">
            ${filteredProducts.map(product => generateProductCardHTML(product)).join('')}
        </div>
    `;
    if (filteredProducts.length === 0) { app.innerHTML += '<div class="no-products">لا توجد منتجات.</div>'; }
}

function handleEnter(e) { if (e.key === 'Enter') searchProducts(); }

// =========================================
// 8.5 اوتيلكماليت البحث (Search Autocomplete)
// =========================================
function showSuggestions(input) {
    const query = input.value.toLowerCase().trim();
    const suggestionsBox = document.getElementById('search-suggestions');
    if (!suggestionsBox) return;

    if (query.length < 2) {
        suggestionsBox.classList.remove('active');
        return;
    }

    const matches = allProducts.filter(p => p.title.toLowerCase().includes(query)).slice(0, 5);
    
    if (matches.length > 0) {
        suggestionsBox.innerHTML = matches.map(p => {
            const slug = encodeURIComponent(p.title.replace(/\s+/g, '-'));
            return `
            <div class="suggestion-item" onclick="window.location.href='?product=${slug}'">
                <img src="${p['image link']}" onerror="this.src='images/icon-192.png'">
                <div class="suggestion-info">
                    <h5>${p.title}</h5>
                    <span>${getProductPrice(p)} AED</span>
                </div>
            </div>`;
        }).join('');
        suggestionsBox.classList.add('active');
    } else {
        suggestionsBox.classList.remove('active');
    }
}

// إغلاق الاقتراحات عند النقر خارجها
document.addEventListener('click', (e) => {
    const suggestionsBox = document.getElementById('search-suggestions');
    if (suggestionsBox && !e.target.closest('.search-box')) {
        suggestionsBox.classList.remove('active');
    }
});

// =========================================
// 8. زر البحث العائم (للموبايل)
// =========================================
function setupMobileSearch() {
    // إنشاء زر البحث العائم إذا لم يكن موجوداً
    if (!document.getElementById('mobile-search-btn')) {
        const btn = document.createElement('div');
        btn.id = 'mobile-search-btn';
        btn.innerHTML = '<i class="fas fa-search"></i>';
        btn.style.cssText = "position:fixed; bottom:20px; left:20px; background:var(--uae-green); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); z-index:999; cursor:pointer;";
        
        // إخفاؤه على الشاشات الكبيرة
        const style = document.createElement('style');
        style.innerHTML = "@media(min-width:768px){ #mobile-search-btn { display:none !important; } }";
        document.head.appendChild(style);

        document.body.appendChild(btn);

        // إنشاء نافذة البحث المنبثقة
        const modal = document.createElement('div');
        modal.id = 'mobile-search-modal';
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.95); z-index:1000; display:none; flex-direction:column; padding:20px;";
        modal.innerHTML = `
            <div style="display:flex; justify-content:flex-end;"><span style="font-size:30px; cursor:pointer;" onclick="document.getElementById('mobile-search-modal').style.display='none'">&times;</span></div>
            <h3 style="text-align:center; margin-top:20%; color:#333">بحث عن منتج</h3>
            <input type="text" id="mobile-search-input" placeholder="اكتب اسم المنتج..." style="padding:15px; border:2px solid #ddd; border-radius:8px; font-size:16px; margin-top:20px;">
            <button onclick="searchProducts(); document.getElementById('mobile-search-modal').style.display='none'" style="margin-top:15px; padding:12px; background:var(--uae-black); color:white; border:none; border-radius:8px; font-size:16px;">بحث</button>
        `;
        document.body.appendChild(modal);

        btn.onclick = () => document.getElementById('mobile-search-modal').style.display = 'flex';
    }
}
