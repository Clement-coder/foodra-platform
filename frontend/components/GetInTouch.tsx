"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Mail, Send, CheckCircle, AlertTriangle } from "lucide-react"
import emailjs from "@emailjs/browser"

// 🔐 EmailJS config (hard-coded)
const SERVICE_ID = "service_thsbt3g"
const TEMPLATE_ID = "template_pna36ma"
const PUBLIC_KEY = "3WpO2k5WQiS682bMR"

const GetInTouch = () => {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  // ✅ REQUIRED: Initialize EmailJS
  useEffect(() => {
    emailjs.init(PUBLIC_KEY)
  }, [])

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email.toLowerCase())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setStatus("error")
      setMessage("Please enter a valid email address.")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          user_email: email, // ✅ MUST MATCH TEMPLATE
        }
      )

      console.log("EmailJS success:", result)

      setStatus("success")
      setMessage("Thank you! You've been added to our mailing list.")
      setEmail("")
    } catch (error) {
      console.error("EmailJS error:", error)
      setStatus("error")
      setMessage("Something went wrong. Please try again later.")
    }
  }

  return (
    <section className="bg-muted/40 py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Want to be the first to know?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our mailing list to get notified when Foodra fully launches. No spam, we promise.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-2 shadow-lg border w-full rounded-md">
                <div className="relative flex-grow w-full">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    className="pl-12 pr-4 py-3 border w-full bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground sm:text-base text-sm"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading" || status === "success"}
                  />
                </div>

                <button
                  className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-md w-full sm:w-auto flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading" ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                {status === "success" && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <p>{message}</p>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{message}</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default GetInTouch
