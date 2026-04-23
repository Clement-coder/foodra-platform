import { t, setLocale, getLocale } from "@/lib/i18n"

// Test language switching
console.log("Current locale:", getLocale())
console.log("English greeting:", t("nav.marketplace"))

setLocale("yo")
console.log("After switching to Yoruba:", getLocale())
console.log("Yoruba greeting:", t("nav.marketplace"))

setLocale("en")
console.log("Back to English:", getLocale())
