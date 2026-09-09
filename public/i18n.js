/* Lightweight, frontend-only translation service. Product/API data is intentionally never translated. */
(() => {
  const STORAGE_KEY = "mado-language";
  const supported = ["en", "ar", "fr"];
  const dictionaries = {
    ar: {
      "Home": "الرئيسية", "About": "من نحن", "Shop": "المتجر", "Settings": "الإعدادات", "Language": "اللغة",
      "English": "English", "العربية": "العربية", "Français": "Français", "Account": "الحساب", "Wishlist": "المفضلة", "Orders": "الطلبات", "Logout": "تسجيل الخروج",
      "Profile": "الملف الشخصي", "Password": "كلمة المرور", "Addresses": "العناوين", "User Profile": "ملف المستخدم", "Save Profile": "حفظ الملف", "Security": "الأمان", "Change Password": "تغيير كلمة المرور", "Update Password": "تحديث كلمة المرور",
      "Name": "الاسم", "Email": "البريد الإلكتروني", "Phone": "الهاتف", "Address": "العنوان", "Latitude": "خط العرض", "Longitude": "خط الطول", "Current password": "كلمة المرور الحالية", "New password": "كلمة المرور الجديدة", "Confirm password": "تأكيد كلمة المرور",
      "Saved": "المحفوظة", "Delivery": "التوصيل", "Saved Addresses": "العناوين المحفوظة", "Label": "التسمية", "Default address": "العنوان الافتراضي", "Add Address": "إضافة عنوان", "Purchases": "المشتريات", "Order History": "سجل الطلبات", "Order Tracking": "تتبع الطلب", "Select an order to view tracking.": "اختر طلباً لعرض التتبع.",
      "Sign In": "تسجيل الدخول", "Sign Up": "إنشاء حساب", "Login": "تسجيل الدخول", "Register": "إنشاء حساب", "Don't have an account?": "ليس لديك حساب؟", "Already have an account?": "لديك حساب بالفعل؟", "Full Name": "الاسم الكامل", "Phone Number": "رقم الهاتف", "Search your address": "ابحث عن عنوانك", "Selected Address": "العنوان المحدد", "Verify Code": "تأكيد الرمز", "Resend Code": "إعادة إرسال الرمز",
      "Search products": "ابحث عن المنتجات", "Sort": "ترتيب", "Featured": "المميزة", "Name A-Z": "الاسم أ-ي", "Name Z-A": "الاسم ي-أ", "Price": "السعر", "Any price": "أي سعر", "Price Low-High": "السعر من الأقل للأعلى", "Price High-Low": "السعر من الأعلى للأقل", "All products": "كل المنتجات", "Essentials": "الأساسيات", "Streetwear": "ملابس الشارع", "Limited": "إصدار محدود", "Add To Cart": "أضف إلى السلة", "Add to Cart": "أضف إلى السلة", "Details": "التفاصيل", "Remove": "إزالة", "Shopping Cart": "سلة التسوق", "Order from cart": "اطلب من السلة", "Order from premium cart": "اطلب من السلة", "Ordering...": "جارٍ الطلب...", "Continue": "متابعة", "Cancel": "إلغاء", "Back": "رجوع", "Quantity": "الكمية",
      "Premium Cart": "سلة مميزة", "Your curated bag": "حقيبتك المختارة", "Session summary": "ملخص الجلسة", "items in cart": "عناصر في السلة", "Order summary": "ملخص الطلب", "Ready to check out": "جاهز لإتمام الشراء", "Secure": "آمن", "Subtotal": "المجموع الفرعي", "Shipping": "الشحن", "Estimated tax": "الضريبة المقدرة", "Total": "الإجمالي", "Inclusive of fees": "شامل الرسوم", "Proceed to checkout": "المتابعة إلى الدفع", "Free returns": "إرجاع مجاني", "Fast dispatch": "شحن سريع", "Protected payment": "دفع محمي",
      "Top Picks For Men": "أفضل اختيارات الرجال", "Where Modern Fashion Begins": "حيث تبدأ الموضة العصرية", "Step into a world of clean designs and effortless style.": "ادخل إلى عالم من التصاميم الأنيقة والأسلوب السهل.", "View Collection": "عرض المجموعة", "New season": "موسم جديد", "Curated edit": "اختيارات منتقاة", "Premium essentials": "أساسيات مميزة", "We Sell": "نبيع", "T-Shirts": "تي شيرت", "Hoodies": "هوديز", "Sweats": "ملابس رياضية", "Best Poses": "أفضل الإطلالات", "Quick Links": "روابط سريعة", "Contact": "تواصل معنا", "All rights reserved.": "جميع الحقوق محفوظة.",
      "No wishlist items yet.": "لا توجد عناصر في المفضلة بعد.", "No orders yet.": "لا توجد طلبات بعد.", "Make Default": "تعيين كافتراضي", "Track Order": "تتبع الطلب", "Map is unavailable right now.": "الخريطة غير متاحة حالياً.", "Submit Review": "إرسال التقييم", "Share your review": "شارك تقييمك", "Close cart": "إغلاق السلة", "Toggle navigation": "تبديل التنقل", "Open account menu": "فتح قائمة الحساب", "Close product details": "إغلاق تفاصيل المنتج",
      "who we are?": "من نحن؟", "Our Mision": "مهمتنا", "The way we see fashion": "كيف نرى الموضة", "Send a Message": "أرسل رسالة", "Call Us": "اتصل بنا", "Available 24 hours": "متاحون 24 ساعة", "6AM to 7PM": "من 6 صباحاً إلى 7 مساءً"
    },
    fr: {
      "Home": "Accueil", "About": "À propos", "Shop": "Boutique", "Settings": "Paramètres", "Language": "Langue", "Account": "Compte", "Wishlist": "Favoris", "Orders": "Commandes", "Logout": "Déconnexion", "Profile": "Profil", "Password": "Mot de passe", "Addresses": "Adresses", "User Profile": "Profil utilisateur", "Save Profile": "Enregistrer le profil", "Change Password": "Changer le mot de passe", "Update Password": "Mettre à jour", "Name": "Nom", "Email": "E-mail", "Phone": "Téléphone", "Address": "Adresse", "Current password": "Mot de passe actuel", "New password": "Nouveau mot de passe", "Confirm password": "Confirmer le mot de passe", "Saved Addresses": "Adresses enregistrées", "Add Address": "Ajouter une adresse", "Order History": "Historique des commandes", "Order Tracking": "Suivi de commande", "Sign In": "Connexion", "Sign Up": "Créer un compte", "Login": "Connexion", "Register": "S’inscrire", "Don't have an account?": "Vous n’avez pas de compte ?", "Already have an account?": "Vous avez déjà un compte ?", "Full Name": "Nom complet", "Phone Number": "Numéro de téléphone", "Search your address": "Rechercher votre adresse", "Selected Address": "Adresse sélectionnée", "Search products": "Rechercher des produits", "Sort": "Trier", "Featured": "En vedette", "Price": "Prix", "Any price": "Tous les prix", "All products": "Tous les produits", "Add To Cart": "Ajouter au panier", "Add to Cart": "Ajouter au panier", "Details": "Détails", "Remove": "Retirer", "Shopping Cart": "Panier", "Order from cart": "Commander depuis le panier", "Continue": "Continuer", "Cancel": "Annuler", "Back": "Retour", "Premium Cart": "Panier premium", "Your curated bag": "Votre sélection", "Session summary": "Résumé de session", "items in cart": "articles dans le panier", "Order summary": "Récapitulatif", "Ready to check out": "Prêt à commander", "Secure": "Sécurisé", "Subtotal": "Sous-total", "Shipping": "Livraison", "Estimated tax": "Taxe estimée", "Total": "Total", "Proceed to checkout": "Passer au paiement", "Free returns": "Retours gratuits", "Fast dispatch": "Expédition rapide", "Protected payment": "Paiement protégé", "Top Picks For Men": "Meilleurs choix pour hommes", "View Collection": "Voir la collection", "New season": "Nouvelle saison", "Quick Links": "Liens rapides", "Contact": "Contact", "All rights reserved.": "Tous droits réservés.", "No wishlist items yet.": "Aucun favori pour le moment.", "No orders yet.": "Aucune commande pour le moment.", "Make Default": "Définir par défaut", "Track Order": "Suivre la commande", "Submit Review": "Envoyer l’avis", "Close cart": "Fermer le panier", "Toggle navigation": "Basculer la navigation", "Open account menu": "Ouvrir le menu du compte"
    }
  };
  const textSources = new WeakMap(), attrSources = new WeakMap();
  const language = () => supported.includes(localStorage.getItem(STORAGE_KEY)) ? localStorage.getItem(STORAGE_KEY) : "en";
  const translate = (value) => language() === "en" ? value : (dictionaries[language()]?.[value] || value);
  function isDataNode(node) { return node.parentElement?.closest(".product-name,[data-i18n-ignore]"); }
  function translateTree(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim() || isDataNode(node)) continue;
      if (!textSources.has(node)) textSources.set(node, node.nodeValue);
      const source = textSources.get(node); const leading = source.match(/^\s*/)[0]; const trailing = source.match(/\s*$/)[0];
      const translated = leading + translate(source.trim()) + trailing;
      if (node.nodeValue !== translated) node.nodeValue = translated;
    }
    root.querySelectorAll?.("[placeholder],[aria-label],[title]").forEach((element) => {
      if (element.closest("[data-i18n-ignore]")) return;
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        const value = element.getAttribute(attribute); if (!value) return;
        let source = attrSources.get(element)?.[attribute];
        if (!source) { source = value; const values = attrSources.get(element) || {}; values[attribute] = source; attrSources.set(element, values); }
        const translated = translate(source);
        if (element.getAttribute(attribute) !== translated) element.setAttribute(attribute, translated);
      });
    });
  }
  function selector() {
    const wrap = document.createElement("label"); wrap.className = "mado-language-selector"; wrap.setAttribute("data-i18n-ignore", "");
    wrap.innerHTML = '<i class="fa-solid fa-language" aria-hidden="true"></i><span class="mado-language-label">Language</span><select aria-label="Language"><option value="en">English</option><option value="ar">العربية</option><option value="fr">Français</option></select>';
    const select = wrap.querySelector("select"); select.value = language();
    select.addEventListener("change", () => setLanguage(select.value)); return wrap;
  }
  function placeSelector() {
    document.querySelectorAll(".mado-language-selector").forEach((item) => item.remove());
    const item = selector();
    const accountTabs = document.querySelector(".account-tabs");
    if (accountTabs) { const settings = document.createElement("div"); settings.className = "mado-language-settings"; settings.innerHTML = '<span>Settings</span>'; settings.append(item); accountTabs.append(settings); }
    else if (document.querySelector("#dropdownMenu")) { const settings = document.createElement("div"); settings.className = "mado-language-settings"; settings.innerHTML = '<span>Settings</span>'; settings.append(item); document.querySelector("#dropdownMenu").append(settings); }
    else if (document.querySelector(".navbar-actions")) document.querySelector(".navbar-actions").append(item);
    else (document.querySelector(".auth-form") || document.body).append(item);
  }
  function setLanguage(next) {
    const chosen = supported.includes(next) ? next : "en"; localStorage.setItem(STORAGE_KEY, chosen);
    document.documentElement.lang = chosen; document.documentElement.dir = chosen === "ar" ? "rtl" : "ltr";
    translateTree(); placeSelector(); document.dispatchEvent(new CustomEvent("madology:languagechange", { detail: { language: chosen } }));
  }
  window.MADOLOGY_I18N = { t: translate, setLanguage, getLanguage: language, storageKey: STORAGE_KEY };
  document.documentElement.lang = language(); document.documentElement.dir = language() === "ar" ? "rtl" : "ltr";
  document.addEventListener("DOMContentLoaded", () => { translateTree(); placeSelector(); new MutationObserver((changes) => changes.forEach((change) => {
    if (change.type === "characterData") translateTree(change.target.parentElement);
    change.addedNodes.forEach((node) => { if (node.nodeType === 3) translateTree(node.parentElement); else if (node.nodeType === 1 && !node.matches?.(".mado-language-selector")) translateTree(node); });
  })).observe(document.body, { childList: true, characterData: true, subtree: true }); });
})();
