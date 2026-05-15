"use client"

import Link from "next/link"
import { UserPlus, ShoppingBag, GraduationCap, DollarSign, TrendingUp, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HowItWorksPage() {
  const steps = [
    {
      number: "1",
      icon: UserPlus,
      title: "Create Your Account",
      description: "Sign up in seconds with Privy — no paperwork, no stress. Just connect and you're in.",
      color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600",
    },
    {
      number: "2",
      icon: ShoppingBag,
      title: "Browse Fresh Products",
      description: "Explore hundreds of farm-fresh products listed directly by verified farmers across Nigeria.",
      color: "bg-green-100 dark:bg-green-900/20 text-green-600",
    },
    {
      number: "3",
      icon: TrendingUp,
      title: "Buy with Confidence",
      description: "Add to cart, pay securely via escrow, and get your order delivered straight to your door.",
      color: "bg-purple-100 dark:bg-purple-900/20 text-purple-600",
    },
  ]

  const features = [
    {
      icon: ShoppingBag,
      title: "Marketplace",
      steps: [
        "Browse hundreds of fresh farm products",
        "Filter by category, price, and location",
        "Buy directly from verified farmers",
        "Secure escrow payment — pay only when satisfied",
      ],
    },
    {
      icon: GraduationCap,
      title: "Training",
      steps: [
        "Browse available training programs",
        "Choose online or in-person sessions",
        "Learn from expert instructors",
        "Get certificates upon completion",
      ],
    },
    {
      icon: DollarSign,
      title: "Funding",
      steps: [
        "Submit funding applications online",
        "Track application status in real-time",
        "Access various funding sources",
        "Receive guidance on fund management",
      ],
    },
  ]

  const faqs = [
    {
      question: "Is Foodra free to use?",
      answer: "Yes! Creating an account and browsing the marketplace is completely free. You only pay for the products you buy.",
    },
    {
      question: "How does payment work?",
      answer: "Payments are secured in escrow — your money is held safely until you confirm delivery. Once you're happy with your order, the farmer gets paid. If something goes wrong, you can raise a dispute.",
    },
    {
      question: "Can I track my order?",
      answer: "Absolutely. Once you place an order, you can track its status in real-time from your Orders page — from processing all the way to delivery.",
    },
    {
      question: "What if I'm not satisfied with my order?",
      answer: "No worries. You can raise a dispute directly from your order page. Our team reviews every dispute and ensures a fair resolution within 3–5 business days.",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#EAF5ED] to-white dark:from-[#118C4C]/10 dark:to-background py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">How Foodra Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fresh farm produce, delivered to you — directly from Nigerian farmers. Here's how easy it is.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                {/* Connector line - hidden on mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-border z-0" />
                )}

                <Card className="relative z-10 h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      <step.icon className="h-8 w-8" />
                    </div>
                    <div className="absolute -top-3 right-4 bg-[#118C4C] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Breakdown */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Platform Features</h2>
            <p className="text-lg text-muted-foreground">Explore what you can do with Foodra</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="bg-[#118C4C]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-[#118C4C]" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">{feature.title}</h3>
                    <ul className="space-y-3">
                      {feature.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-[#118C4C] flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-[#118C4C] to-[#0d6d3a] text-white border-0 overflow-hidden">
            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to Get Started?</h2>
                <p className="text-lg text-white/90 max-w-2xl">
                  Join Foodra today and take your farming business to the next level.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/marketplace">
                  <button
                    
                    className="bg-white text-green-700 hover:bg-white/90 text-lg px-8 py-2 rounded-md"
                  >
                    Start Now
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
