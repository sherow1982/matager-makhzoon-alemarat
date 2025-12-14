// ==========================================
// ملف التحليلات المحسن (Lazy Loading - Ultra Fast)
// ==========================================

(function() {
    // متغير لمنع تحميل الأكواد أكثر من مرة
    var analyticsInited = false;

    function initAnalytics() {
        if (analyticsInited) return;
        analyticsInited = true;

        // إزالة مستمعي الأحداث لتخفيف العبء عن المتصفح بمجرد التحميل
        document.removeEventListener('mousemove', initAnalytics);
        document.removeEventListener('touchstart', initAnalytics);
        document.removeEventListener('scroll', initAnalytics);

        console.log("🚀 Analytics Loaded Asynchronously");

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

    // الطريقة الذكية: انتظر حتى ترتاح الصفحة تماماً (Idle) ثم حمل الأكواد
    if (window.requestIdleCallback) {
        window.requestIdleCallback(function() {
            setTimeout(initAnalytics, 3000); // تأخير بسيط إضافي للأمان
        });
    } else {
        // للمتصفحات القديمة: استخدم التايمر العادي
        window.addEventListener('load', function() {
            setTimeout(initAnalytics, 3500);
        });
    }

    // التشغيل الفوري عند أول تفاعل من المستخدم (لضمان عدم ضياع الزيارة)
    // نستخدم {passive: true} لتحسين أداء السكرول
    document.addEventListener('mousemove', initAnalytics, {passive: true});
    document.addEventListener('touchstart', initAnalytics, {passive: true});
    document.addEventListener('scroll', initAnalytics, {passive: true});

})();
