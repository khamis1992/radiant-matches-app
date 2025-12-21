import type { TranslationKeys } from "./en";

export const ar: TranslationKeys = {
  // Common
  common: {
    loading: "جاري التحميل...",
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    confirm: "تأكيد",
    back: "رجوع",
    next: "التالي",
    seeAll: "عرض الكل",
    search: "بحث",
    noResults: "لا توجد نتائج",
  },
  
  // Navigation
  nav: {
    home: "الرئيسية",
    artists: "الفنانات",
    favorites: "المفضلة",
    bookings: "الحجوزات",
    dashboard: "لوحة التحكم",
    gallery: "المعرض",
    services: "الخدمات",
    messages: "الرسائل",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
  },
  
  // Home page
  home: {
    browseCategory: "تصفح حسب الفئة",
    topRatedArtists: "أفضل الفنانات تقييماً",
    noArtistsYet: "لا توجد فنانات متاحات حالياً",
    searchPlaceholder: "ابحثي عن فنانات المكياج...",
  },
  
  // Categories
  categories: {
    makeup: "مكياج",
    hairStyling: "تصفيف الشعر",
    henna: "حناء",
    lashesBrows: "رموش وحواجب",
    nails: "أظافر",
    bridal: "عروس",
    photoshoot: "جلسة تصوير",
  },
  
  // Auth
  auth: {
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    logout: "تسجيل الخروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    forgotPassword: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    verifyEmail: "تأكيد البريد الإلكتروني",
    checkEmail: "يرجى التحقق من بريدك الإلكتروني للحصول على رابط التأكيد.",
    resendEmail: "إعادة إرسال رابط التأكيد",
    emailSent: "تم إرسال رابط التأكيد!",
  },
  
  // Profile
  profile: {
    myProfile: "ملفي الشخصي",
    editProfile: "تعديل الملف",
    location: "الموقع",
    phone: "الهاتف",
    memberSince: "عضو منذ",
    signInToView: "سجلي الدخول لعرض الملف",
    signInDesc: "أنشئي حساباً أو سجلي الدخول لإدارة ملفك الشخصي",
    bookings: "الحجوزات",
    reviews: "التقييمات",
    artistDashboard: "لوحة تحكم الفنانة",
    favorites: "المفضلة",
    paymentMethods: "طرق الدفع",
    notifications: "الإشعارات",
    helpSupport: "المساعدة والدعم",
    logOut: "تسجيل الخروج",
    signedOut: "تم تسجيل الخروج بنجاح",
  },
  
  // Settings
  settings: {
    title: "الإعدادات",
    notifications: "الإشعارات",
    pushNotifications: "إشعارات الدفع",
    pushNotificationsDesc: "استلام إشعارات على جهازك",
    emailNotifications: "إشعارات البريد",
    emailNotificationsDesc: "استلام التحديثات عبر البريد",
    bookingReminders: "تذكيرات الحجز",
    bookingRemindersDesc: "التذكير بالحجوزات القادمة",
    promotionalEmails: "رسائل ترويجية",
    promotionalEmailsDesc: "استلام العروض والترويجات",
    privacy: "الخصوصية",
    publicProfile: "ملف عام",
    publicProfileDesc: "جعل ملفك مرئياً للآخرين",
    showBookingHistory: "عرض سجل الحجوزات",
    showBookingHistoryDesc: "السماح للفنانات برؤية حجوزاتك السابقة",
    shareAnalytics: "مشاركة البيانات",
    shareAnalyticsDesc: "المساعدة في تحسين خدماتنا",
    account: "الحساب",
    changePassword: "تغيير كلمة المرور",
    linkedAccounts: "الحسابات المرتبطة",
    language: "اللغة",
    deleteAccount: "حذف الحساب",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    updatePassword: "تحديث كلمة المرور",
    updating: "جاري التحديث...",
    passwordUpdated: "تم تحديث كلمة المرور بنجاح",
    passwordMinLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    passwordsNoMatch: "كلمتا المرور غير متطابقتين",
    enterNewPassword: "أدخل كلمة المرور الجديدة. تأكد أنها 6 أحرف على الأقل.",
  },
  
  // Bookings
  bookings: {
    title: "حجوزاتي",
    noBookings: "لا توجد حجوزات",
    startExploring: "ابدأي باستكشاف الفنانات لحجز موعدك الأول",
    browseArtists: "تصفح الفنانات",
    upcoming: "القادمة",
    past: "السابقة",
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    completed: "مكتمل",
    cancelled: "ملغي",
    bookNow: "احجزي الآن",
    viewDetails: "عرض التفاصيل",
    cancelBooking: "إلغاء الحجز",
    reschedule: "إعادة جدولة",
    at: "في",
    location: "الموقع",
    notes: "ملاحظات",
    totalPrice: "السعر الإجمالي",
  },
  
  // Artist
  artist: {
    makeupArtist: "فنانة مكياج",
    reviews: "تقييمات",
    about: "نبذة",
    portfolio: "معرض الأعمال",
    servicesOffered: "الخدمات",
    yearsExperience: "سنوات الخبرة",
    available: "متاحة",
    unavailable: "غير متاحة",
    bookAppointment: "حجز موعد",
    contactArtist: "تواصلي مع الفنانة",
    viewProfile: "عرض الملف",
  },
  
  // Favorites
  favorites: {
    title: "المفضلة",
    noFavorites: "لا توجد مفضلات",
    noFavoritesDesc: "ابدأي باستكشاف الفنانات وأضيفي المفضلات هنا",
    discoverArtists: "اكتشفي الفنانات",
  },
  
  // User menu
  userMenu: {
    myProfile: "ملفي الشخصي",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
  },
  
  // Errors
  errors: {
    somethingWrong: "حدث خطأ ما",
    tryAgain: "يرجى المحاولة مرة أخرى",
    networkError: "خطأ في الشبكة. يرجى التحقق من اتصالك.",
  },
};
