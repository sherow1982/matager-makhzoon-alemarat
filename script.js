// إعدادات المتجر
const WHATSAPP_NUMBER = "201110760081";
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
});

// جلب المنتجات
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json();
        
        // التحقق من الرابط الحالي (Routing Logic)
        const urlParams = new URLSearchParams(window.location.search);
        const productSlug = urlParams.get('product');

        if (productSlug) {
            // عرض صفحة المنتج الفردي
            renderSingleProduct(productSlug);
        } else {
            // عرض الصفحة الرئيسية
            renderHomePage();
        }
    } catch (error) {
        console.error("Error loading products:", error);
        document.getElementById('app-content').innerHTML = '<p class="text-center">عذراً، حدث خطأ في تحميل المنتجات.</p>';
    }
}

// 1. عرض الصفحة الرئيسية
function renderHomePage() {
    const app = document.getElementById('app-content');
    
    // هيرو سكشن بسيط (اختياري)
    let html = `
        <div class="hero-banner" style="background: linear-gradient(45deg, #00732f, #000); color: white; padding: 40px; border-radius: 10px; margin-top: 20px; text-align: center;">
            <h1>أهلاً بك في مخزون الإمارات</h1>
            <p>أفضل المنتجات بأفضل الأسعار - الدفع عند الاستلام</p>
        </div>
        <h2 style="margin-top: 40px; border-right: 5px solid var(--uae-red); padding-right: 15px;">أحدث المنتجات</h2>
        <div class="products-grid">
    `;

    allProducts.forEach(product => {
        // إنشاء رابط عربي للمنتج (استبدال المسافات بشرطات)
        const slug = encodeURIComponent(product.name.replace(/\s+/g, '-'));
        
        html += `
            <div class="product-card">
                <div class="product-img-wrapper">
                    <a href="?product=${slug}">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                </div>
                <div class="product-info">
                    <a href="?product=${slug}" class="product-title">${product.name}</a>
                    <span class="product-price">${product.price} درهم</span>
                    <button class="btn-add" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> أضف للسلة
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    app.innerHTML = html;
}

// 2. عرض صفحة المنتج الفردي
function renderSingleProduct(slug) {
    // فك التشفير للبحث عن الاسم
    const productName = decodeURIComponent(slug).replace(/-/g, ' ');
    // البحث عن المنتج (يفضل استخدام ID لكن الاسم يعمل للروابط العربية الجميلة)
    const product = allProducts.find(p => p.name === productName) || allProducts.find(p => p.name.includes(productName));

    const app = document.getElementById('app-content');

    if (!product) {
        app.innerHTML = '<h2>المنتج غير موجود</h2><a href="index.html">العودة للرئيسية</a>';
        return;
    }

    // محاكاة صفحة المنتج
    app.innerHTML = `
        <div class="breadcrumb" style="margin: 20px 0; color: #777;">
            <a href="index.html">الرئيسية</a> / <span>${product.name}</span>
        </div>
        <div class="single-product-container">
            <div class="single-img">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="single-details">
                <h1>${product.name}</h1>
                <span class="single-price">${product.price} درهم</span>
                <p style="color: #666; margin-bottom: 20px;">${product.description || 'وصف تفصيلي للمنتج متوفر عند الطلب.'}</p>
                
                <div class="policy-box">
                    <strong><i class="fas fa-info-circle"></i> تنويه هام:</strong>
                    <br> سياسة الاسترجاع 14 يوم (لا تشمل منتجات التجميل المفتوحة).
                    <br> الشحن من 1-3 أيام عمل لكافة الإمارات.
                </div>

                <div class="buy-actions">
                    <button class="btn-whatsapp-large" onclick="directOrder('${product.name}', ${product.price})">
                        <i class="fab fa-whatsapp"></i> اطلب الآن عبر واتساب
                    </button>
                    <button class="btn-add" style="width: auto; padding: 0 30px;" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> إضافة للسلة
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 3. وظائف السلة
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    toggleCart(true); // فتح السلة تلقائياً
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    // تحديث العدد
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.innerText = totalQty;

    // تحديث القائمة
    cartItemsContainer.innerHTML = '';
    let totalAmount = 0;

    cart.forEach(item => {
        totalAmount += item.price * item.qty;
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div style="flex: 1;">
                    <h5 style="margin-bottom: 5px;">${item.name}</h5>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--uae-green); font-weight: bold;">${item.price} x ${item.qty}</span>
                        <span style="color: red; cursor: pointer;" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></span>
                    </div>
                </div>
            </div>
        `;
    });

    cartTotal.innerText = totalAmount.toFixed(2) + ' درهم';
}

function toggleCart(forceOpen = false) {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    if (forceOpen) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    } else {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// 4. إتمام الطلب (Checkout)
function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("السلة فارغة!");
        return;
    }

    let message = `*طلب جديد من متجر مخزون الإمارات*%0a---------------------------%0a`;
    let total = 0;

    cart.forEach(item => {
        message += `▪️ ${item.name} (العدد: ${item.qty}) - ${item.price * item.qty} درهم%0a`;
        total += item.price * item.qty;
    });

    message += `---------------------------%0a*الإجمالي: ${total} درهم*%0a`;
    message += `%0aيرجى تأكيد الطلب وتزويدي بالعنوان وتفاصيل الشحن.`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}

// طلب مباشر لمنتج واحد
function directOrder(name, price) {
    let message = `*طلب سريع من متجر مخزون الإمارات*%0a---------------------------%0a`;
    message += `▪️ المنتج: ${name}%0a`;
    message += `▪️ السعر: ${price} درهم%0a`;
    message += `%0aيرجى التواصل لتأكيد الطلب.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}
