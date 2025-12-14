// ==========================================
// ملف التحليلات المحسن (Lazy Loading)
// ==========================================

(function() {
    // دالة لتهيئة التحليلات (تعمل مرة واحدة فقط)
    var analyticsInited = false;

    function initAnalytics() {
        if (analyticsInited) return;
        analyticsInited = true;

        console.log("Loading Analytics & GTM...");

        // 1. Google Analytics (GA4) - G-WSJ062EHKM
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-WSJ062EHKM';
        document.head.appendChild(gaScript);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-WSJ062EHKM');

        // 2. Google Tag Manager - GTM-NWQ5HX32
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-NWQ5HX32');
    }

    // الانتظار حتى يتم تحميل الصفحة بالكامل
    window.addEventListener('load', function() {
        // تأخير التشغيل لمدة 3.5 ثانية لإعطاء الأولوية لصور الموقع والمنتجات
        setTimeout(initAnalytics, 3500);
    });

    // أو التشغيل فوراً إذا بدأ المستخدم في تحريك الماوس أو اللمس (لضمان تسجيل البيانات)
    document.addEventListener('mousemove', initAnalytics);
    document.addEventListener('touchstart', initAnalytics);
    document.addEventListener('scroll', initAnalytics);

})();
