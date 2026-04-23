/**
 * Foodra i18n — English, Yoruba, Hausa, Igbo
 * Usage: import { t, setLocale, getLocale } from "@/lib/i18n"
 */

export type Locale = "en" | "yo" | "ha" | "ig"

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "yo", label: "Yoruba", nativeLabel: "Yorùbá" },
  { code: "ha", label: "Hausa", nativeLabel: "Hausa" },
  { code: "ig", label: "Igbo", nativeLabel: "Igbo" },
]

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Nav
    "nav.marketplace": "Marketplace",
    "nav.training": "Training",
    "nav.funding": "Funding",
    "nav.wallet": "Wallet",
    "nav.profile": "Profile",
    "nav.search": "Search",
    "nav.signIn": "Sign In",
    "nav.signOut": "Sign Out",
    // Marketplace
    "marketplace.title": "Marketplace",
    "marketplace.subtitle": "Browse fresh products from local farmers",
    "marketplace.searchResults": "Search results for",
    "marketplace.listProduct": "List Product",
    "marketplace.viewOrders": "View My Orders",
    "marketplace.filterBy": "Filter by category:",
    "marketplace.noProducts": "No products available yet.",
    "marketplace.noResults": "No products found matching your search.",
    "marketplace.showing": "Showing",
    "marketplace.of": "of",
    "marketplace.products": "products",
    // Product
    "product.addToCart": "Add to Cart",
    "product.viewCart": "View Cart",
    "product.share": "Share Product",
    "product.ownProduct": "This is your product. You cannot add it to cart.",
    "product.availableStock": "Available Stock",
    "product.soldBy": "Sold by",
    "product.description": "Product Description",
    "product.information": "Product Information",
    "product.sellerInfo": "Seller Information",
    "product.viewSeller": "View Seller Profile",
    // Cart
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.emptySubtitle": "Browse the marketplace and add products to your cart",
    "cart.browse": "Browse Marketplace",
    "cart.orderSummary": "Order Summary",
    "cart.items": "Items",
    "cart.delivery": "Delivery",
    "cart.free": "Free",
    "cart.total": "Total",
    "cart.checkout": "Proceed to Checkout",
    "cart.continueShopping": "Continue Shopping",
    // Training
    "training.title": "Training Programs",
    "training.subtitle": "Learn from experts and improve your farming skills",
    "training.enroll": "Enroll Now",
    "training.enrolled": "You're enrolled!",
    "training.full": "Training Full",
    "training.online": "Online",
    "training.inPerson": "In-Person",
    "training.free": "Free",
    "training.spotsLeft": "spots left",
    // Funding
    "funding.title": "Funding",
    "funding.subtitle": "Access funding opportunities for your farm",
    "funding.apply": "Apply for Funding",
    "funding.pending": "Pending",
    "funding.approved": "Approved",
    "funding.rejected": "Rejected",
    "funding.noApplications": "No Applications Yet",
    // Wallet
    "wallet.title": "My Wallet",
    "wallet.send": "Send",
    "wallet.receive": "Receive",
    "wallet.history": "Transaction History",
    "wallet.balance": "Balance",
    // Profile
    "profile.title": "My Profile",
    "profile.edit": "Edit Profile",
    "profile.signOut": "Sign Out",
    "profile.wallet": "Wallet Address",
    "profile.joined": "Joined",
    // Common
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Try Again",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.all": "All",
    "common.submit": "Submit",
    "common.close": "Close",
    "common.viewAll": "View All",
    "common.seeMore": "See More",
    "common.noData": "No data available",
    // Orders
    "orders.title": "My Orders",
    "orders.empty": "No orders yet",
    "orders.confirmDelivery": "Confirm Delivery",
    "orders.raiseDispute": "Raise Dispute",
    "orders.status.pending": "Pending",
    "orders.status.processing": "Processing",
    "orders.status.shipped": "Shipped",
    "orders.status.delivered": "Delivered",
    "orders.status.cancelled": "Cancelled",
    // Search
    "search.title": "Search Results",
    "search.placeholder": "Search products, trainings, farmers...",
    "search.noResults": "No Results Found",
    "search.results": "results for",
  },
  yo: {
    // Nav
    "nav.marketplace": "Ọjà",
    "nav.training": "Ikẹkọ",
    "nav.funding": "Ìgbowó",
    "nav.wallet": "Àpamọ́wọ́",
    "nav.profile": "Profaili",
    "nav.search": "Ìwádìí",
    "nav.signIn": "Wọlé",
    "nav.signOut": "Jáde",
    // Marketplace
    "marketplace.title": "Ọjà",
    "marketplace.subtitle": "Wo àwọn ọjà tuntun láti ọwọ́ àwọn àgbẹ̀ àdúgbò",
    "marketplace.searchResults": "Àwọn èsì ìwádìí fún",
    "marketplace.listProduct": "Ṣe Àkójọ Ọjà",
    "marketplace.viewOrders": "Wo Àwọn Àṣẹ Mi",
    "marketplace.filterBy": "Ṣe àlẹ̀mọ́ nípa ẹ̀ka:",
    "marketplace.noProducts": "Kò sí ọjà tí ó wà.",
    "marketplace.noResults": "Kò sí ọjà tí ó bá ìwádìí rẹ.",
    "marketplace.showing": "Ṣàfihàn",
    "marketplace.of": "ti",
    "marketplace.products": "àwọn ọjà",
    // Product
    "product.addToCart": "Fi sí Agbọ̀n",
    "product.viewCart": "Wo Agbọ̀n",
    "product.share": "Pín Ọjà",
    "product.ownProduct": "Ọjà yìí jẹ́ tirẹ. O kò lè fi sí agbọ̀n.",
    "product.availableStock": "Ọjà Tí Ó Wà",
    "product.soldBy": "Tí a tà nípa",
    "product.description": "Àpèjúwe Ọjà",
    "product.information": "Àlàyé Ọjà",
    "product.sellerInfo": "Àlàyé Olùtà",
    "product.viewSeller": "Wo Profaili Olùtà",
    // Cart
    "cart.title": "Agbọ̀n Ìrà",
    "cart.empty": "Agbọ̀n rẹ ò ní nǹkan",
    "cart.emptySubtitle": "Wo ọjà kí o sì fi àwọn ọjà sí agbọ̀n rẹ",
    "cart.browse": "Wo Ọjà",
    "cart.orderSummary": "Àkójọpọ̀ Àṣẹ",
    "cart.items": "Àwọn Nǹkan",
    "cart.delivery": "Ìfiránṣẹ́",
    "cart.free": "Ọ̀fẹ́",
    "cart.total": "Àpapọ̀",
    "cart.checkout": "Tẹ̀síwájú sí Ìsanwó",
    "cart.continueShopping": "Tẹ̀síwájú Ìrà",
    // Training
    "training.title": "Àwọn Ètò Ikẹkọ",
    "training.subtitle": "Kọ́ láti ọwọ́ àwọn akọ̀wé kí o sì mú ìmọ̀ àgbẹ̀ rẹ dára sí i",
    "training.enroll": "Forúkọsílẹ̀ Báyìí",
    "training.enrolled": "O ti forúkọsílẹ̀!",
    "training.full": "Ikẹkọ Kún",
    "training.online": "Orí Àyelujára",
    "training.inPerson": "Ní Ara Ẹni",
    "training.free": "Ọ̀fẹ́",
    "training.spotsLeft": "àwọn àyè tó kù",
    // Funding
    "funding.title": "Ìgbowó",
    "funding.subtitle": "Wọlé sí àwọn àǹfààní ìgbowó fún oko rẹ",
    "funding.apply": "Bẹ̀ fún Ìgbowó",
    "funding.pending": "Ní Ìdúró",
    "funding.approved": "Fọwọ́ sí",
    "funding.rejected": "Kọ̀",
    "funding.noApplications": "Kò Sí Ìbẹ̀wò Tí Ó Wà",
    // Wallet
    "wallet.title": "Àpamọ́wọ́ Mi",
    "wallet.send": "Ránṣẹ́",
    "wallet.receive": "Gbà",
    "wallet.history": "Ìtàn Ìdúnàádúrà",
    "wallet.balance": "Iye Owó",
    // Profile
    "profile.title": "Profaili Mi",
    "profile.edit": "Ṣàtúnṣe Profaili",
    "profile.signOut": "Jáde",
    "profile.wallet": "Àdírẹ́sì Àpamọ́wọ́",
    "profile.joined": "Dara pọ̀",
    // Common
    "common.loading": "Ń gbé...",
    "common.error": "Nǹkan kan ṣẹlẹ̀",
    "common.retry": "Gbìyànjú Lẹ́ẹ̀kan Sí",
    "common.save": "Pamọ́",
    "common.cancel": "Fagilé",
    "common.delete": "Parẹ́",
    "common.confirm": "Jẹ́rìísí",
    "common.back": "Padà",
    "common.search": "Ìwádìí",
    "common.filter": "Àlẹ̀mọ́",
    "common.all": "Gbogbo",
    "common.submit": "Firanṣẹ́",
    "common.close": "Pa",
    "common.viewAll": "Wo Gbogbo",
    "common.seeMore": "Wo Síwájú",
    "common.noData": "Kò sí dátà tí ó wà",
    // Orders
    "orders.title": "Àwọn Àṣẹ Mi",
    "orders.empty": "Kò sí àṣẹ tí ó wà",
    "orders.confirmDelivery": "Jẹ́rìísí Ìfiránṣẹ́",
    "orders.raiseDispute": "Gbé Ìjiyàn",
    "orders.status.pending": "Ní Ìdúró",
    "orders.status.processing": "Ní Ìṣiṣẹ́",
    "orders.status.shipped": "Ti Ránṣẹ́",
    "orders.status.delivered": "Ti Dé",
    "orders.status.cancelled": "Fagilé",
    // Search
    "search.title": "Àwọn Àbájáde Ìwádìí",
    "search.placeholder": "Wádìí àwọn ọjà, ikẹkọ, àwọn àgbẹ̀...",
    "search.noResults": "Kò Sí Àbájáde",
    "search.results": "àwọn àbájáde fún",
  },
  ha: {
    // Nav
    "nav.marketplace": "Kasuwa",
    "nav.training": "Horarwa",
    "nav.funding": "Tallafi",
    "nav.wallet": "Walat",
    "nav.profile": "Bayani",
    "nav.search": "Bincike",
    "nav.signIn": "Shiga",
    "nav.signOut": "Fita",
    // Marketplace
    "marketplace.title": "Kasuwa",
    "marketplace.subtitle": "Duba kayayyaki daga manoman gida",
    "marketplace.listProduct": "Jera Kaya",
    "marketplace.viewOrders": "Duba Odarorina",
    "marketplace.filterBy": "Tace ta rukunin:",
    "marketplace.noProducts": "Babu kayayyaki da ake samu.",
    "marketplace.noResults": "Babu kayayyaki da suka dace da bincikena.",
    "marketplace.showing": "Ana nuna",
    "marketplace.of": "na",
    "marketplace.products": "kayayyaki",
    // Product
    "product.addToCart": "Saka a Kwandon",
    "product.viewCart": "Duba Kwando",
    "product.share": "Raba Kaya",
    "product.ownProduct": "Wannan kayanka ne. Ba za ka iya saka shi a kwandon ba.",
    "product.availableStock": "Kaya da Ake Samu",
    "product.soldBy": "Ana sayarwa ta",
    "product.description": "Bayanin Kaya",
    "product.information": "Bayani na Kaya",
    "product.sellerInfo": "Bayani na Mai Sayarwa",
    "product.viewSeller": "Duba Bayani na Mai Sayarwa",
    // Cart
    "cart.title": "Kwandon Siyayya",
    "cart.empty": "Kwandona bashi da kaya",
    "cart.emptySubtitle": "Duba kasuwa ka saka kayayyaki a kwandona",
    "cart.browse": "Duba Kasuwa",
    "cart.orderSummary": "Taƙaitaccen Oda",
    "cart.items": "Kayayyaki",
    "cart.delivery": "Isar da Kaya",
    "cart.free": "Kyauta",
    "cart.total": "Jimla",
    "cart.checkout": "Ci gaba zuwa Biyan Kuɗi",
    "cart.continueShopping": "Ci gaba da Siyayya",
    // Training
    "training.title": "Shirye-shiryen Horarwa",
    "training.subtitle": "Koyi daga ƙwararru ka inganta ƙwarewar noma",
    "training.enroll": "Yi Rajista Yanzu",
    "training.enrolled": "An yi maka rajista!",
    "training.full": "Horarwa Cike",
    "training.online": "Kan Layi",
    "training.inPerson": "Kai tsaye",
    "training.free": "Kyauta",
    "training.spotsLeft": "wurare da suka rage",
    // Funding
    "funding.title": "Tallafi",
    "funding.subtitle": "Samu damar tallafi don gonarku",
    "funding.apply": "Nemi Tallafi",
    "funding.pending": "Ana Jira",
    "funding.approved": "An Amince",
    "funding.rejected": "An Ƙi",
    "funding.noApplications": "Babu Aikace-aikace Tukuna",
    // Wallet
    "wallet.title": "Walata",
    "wallet.send": "Aika",
    "wallet.receive": "Karɓa",
    "wallet.history": "Tarihin Ma'amala",
    "wallet.balance": "Sauran Kuɗi",
    // Profile
    "profile.title": "Bayanina",
    "profile.edit": "Gyara Bayani",
    "profile.signOut": "Fita",
    "profile.wallet": "Adireshin Walat",
    "profile.joined": "Shiga",
    // Common
    "common.loading": "Ana lodi...",
    "common.error": "Wani abu ya faru",
    "common.retry": "Sake Gwadawa",
    "common.save": "Ajiye",
    "common.cancel": "Soke",
    "common.delete": "Share",
    "common.confirm": "Tabbatar",
    "common.back": "Koma",
    "common.search": "Bincike",
    "common.filter": "Tace",
    "common.all": "Duka",
    "common.submit": "Aika",
    "common.close": "Rufe",
    "common.viewAll": "Duba Duka",
    "common.seeMore": "Duba Ƙari",
    "common.noData": "Babu bayanan da ake samu",
    // Orders
    "orders.title": "Odarorina",
    "orders.empty": "Babu odar tukuna",
    "orders.confirmDelivery": "Tabbatar da Isar da Kaya",
    "orders.raiseDispute": "Kawo Ƙara",
    "orders.status.pending": "Ana Jira",
    "orders.status.processing": "Ana Aiki",
    "orders.status.shipped": "An Aika",
    "orders.status.delivered": "Ya Isa",
    "orders.status.cancelled": "An Soke",
    // Search
    "search.title": "Sakamakon Bincike",
    "search.placeholder": "Bincika kayayyaki, horarwa, manoma...",
    "search.noResults": "Babu Sakamakon",
    "search.results": "sakamakon don",
  },
  ig: {
    // Nav
    "nav.marketplace": "Ahịa",
    "nav.training": "Ọzụzụ",
    "nav.funding": "Nkwado",
    "nav.wallet": "Akpa ego",
    "nav.profile": "Profaịlụ",
    "nav.search": "Chọọ",
    "nav.signIn": "Banye",
    "nav.signOut": "Pụọ",
    // Marketplace
    "marketplace.title": "Ahịa",
    "marketplace.subtitle": "Lee ngwaahịa ọhụrụ sitere n'aka ndị ọrụ ugbo mpaghara",
    "marketplace.listProduct": "Depụta Ngwaahịa",
    "marketplace.viewOrders": "Lee Iwu M",
    "marketplace.filterBy": "Lọcha site na ụdị:",
    "marketplace.noProducts": "Ọ dịghị ngwaahịa dị ugbu a.",
    "marketplace.noResults": "Ọ dịghị ngwaahịa dabara na nchọ gị.",
    "marketplace.showing": "Na-egosi",
    "marketplace.of": "nke",
    "marketplace.products": "ngwaahịa",
    // Product
    "product.addToCart": "Tinye na Ọkpụ",
    "product.viewCart": "Lee Ọkpụ",
    "product.share": "Kekọrịta Ngwaahịa",
    "product.ownProduct": "Ngwaahịa a bụ nke gị. Ị nweghị ike itinye ya na ọkpụ.",
    "product.availableStock": "Ngwaahịa Dị",
    "product.soldBy": "Nke a na-ere site na",
    "product.description": "Nkọwa Ngwaahịa",
    "product.information": "Ozi Ngwaahịa",
    "product.sellerInfo": "Ozi Onye Ire Ahịa",
    "product.viewSeller": "Lee Profaịlụ Onye Ire Ahịa",
    // Cart
    "cart.title": "Ọkpụ Ịzụ Ahịa",
    "cart.empty": "Ọkpụ gị dị efu",
    "cart.emptySubtitle": "Lee ahịa ma tinye ngwaahịa na ọkpụ gị",
    "cart.browse": "Lee Ahịa",
    "cart.orderSummary": "Nchịkọta Iwu",
    "cart.items": "Ihe",
    "cart.delivery": "Nnyefe",
    "cart.free": "Efu",
    "cart.total": "Ngụkọta",
    "cart.checkout": "Gaa n'ihu na Ịkwụ Ụgwọ",
    "cart.continueShopping": "Gaa n'ihu na Ịzụ Ahịa",
    // Training
    "training.title": "Mmemme Ọzụzụ",
    "training.subtitle": "Mụọ site n'aka ndị ọkachamara ma kwalite nka ọrụ ugbo gị",
    "training.enroll": "Debanye Aha Ugbu a",
    "training.enrolled": "Ị debanyelarị aha!",
    "training.full": "Ọzụzụ Juputara",
    "training.online": "N'ịntanetị",
    "training.inPerson": "N'onwe",
    "training.free": "Efu",
    "training.spotsLeft": "ọnọdụ fọdụrụ",
    // Funding
    "funding.title": "Nkwado",
    "funding.subtitle": "Nweta ohere nkwado maka ugbo gị",
    "funding.apply": "Rịọ Nkwado",
    "funding.pending": "Na-atọ Ụzọ",
    "funding.approved": "Akwadoro",
    "funding.rejected": "Akụghị",
    "funding.noApplications": "Ọ Dịghị Arịrịọ Ọ Bụla",
    // Wallet
    "wallet.title": "Akpa Ego M",
    "wallet.send": "Zipu",
    "wallet.receive": "Nata",
    "wallet.history": "Akụkọ Azụmahịa",
    "wallet.balance": "Ego Fọdụrụ",
    // Profile
    "profile.title": "Profaịlụ M",
    "profile.edit": "Dezie Profaịlụ",
    "profile.signOut": "Pụọ",
    "profile.wallet": "Adreesị Akpa Ego",
    "profile.joined": "Sonyere",
    // Common
    "common.loading": "Na-ebugo...",
    "common.error": "Ihe ọ bụla mere",
    "common.retry": "Nwaa Ọzọ",
    "common.save": "Chekwaa",
    "common.cancel": "Kagbuo",
    "common.delete": "Hichapụ",
    "common.confirm": "Kwenye",
    "common.back": "Laghachi",
    "common.search": "Chọọ",
    "common.filter": "Lọcha",
    "common.all": "Niile",
    "common.submit": "Zipu",
    "common.close": "Mechie",
    "common.viewAll": "Lee Niile",
    "common.seeMore": "Lee Ọzọ",
    "common.noData": "Ọ dịghị data dị ugbu a",
    // Orders
    "orders.title": "Iwu M",
    "orders.empty": "Ọ dịghị iwu ọ bụla",
    "orders.confirmDelivery": "Kwenye Nnyefe",
    "orders.raiseDispute": "Weta Esemokwu",
    "orders.status.pending": "Na-atọ Ụzọ",
    "orders.status.processing": "Na-arụ Ọrụ",
    "orders.status.shipped": "Ezipụtara",
    "orders.status.delivered": "Erinyeela",
    "orders.status.cancelled": "Kagbuola",
    // Search
    "search.title": "Nsonaazụ Nchọ",
    "search.placeholder": "Chọọ ngwaahịa, ọzụzụ, ndị ọrụ ugbo...",
    "search.noResults": "Ọ Dịghị Nsonaazụ",
    "search.results": "nsonaazụ maka",
  },
}

const STORAGE_KEY = "foodra_locale"

let currentLocale: Locale = "en"

// Initialize from localStorage (client-side only)
if (typeof window !== "undefined") {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored && translations[stored]) currentLocale = stored
}

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, locale)
    // Dispatch event so components can re-render
    window.dispatchEvent(new CustomEvent("localechange", { detail: locale }))
  }
}

export function t(key: string, fallback?: string): string {
  return translations[currentLocale]?.[key] ?? translations.en[key] ?? fallback ?? key
}

/** React hook for reactive translations */
export function useTranslation() {
  if (typeof window === "undefined") {
    return { t, locale: currentLocale as Locale, setLocale }
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { useState, useEffect } = require("react")
  const [locale, setLocaleState] = useState(currentLocale as Locale)

  useEffect(() => {
    const handler = (e: Event) => {
      setLocaleState((e as CustomEvent<Locale>).detail)
    }
    window.addEventListener("localechange", handler)
    return () => window.removeEventListener("localechange", handler)
  }, [])

  const translate = (key: string, fallback?: string): string =>
    translations[locale as Locale]?.[key] ?? translations.en[key] ?? fallback ?? key

  const changeLocale = (l: Locale) => {
    setLocale(l)
    setLocaleState(l)
  }

  return { t: translate, locale, setLocale: changeLocale }
}
