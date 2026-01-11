"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, GraduationCap, DollarSign, Users, TrendingUp, Shield, ArrowRight, Target, Eye, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import HeroSection from "@/components/HeroSection"
import Gallery from "@/components/Gallery"
import SignupButton from "@/components/SignupButton"
import GetInTouch from "@/components/GetInTouch"

export default function LandingPage() {
  useEffect(() => {
    
   }, [])

  // --- Features, stats, benefits ---
  const features = [
    { icon: ShoppingBag, title: "Marketplace Access", description: "Connect directly with buyers and sell your products at fair prices", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
    { icon: GraduationCap, title: "Training Programs", description: "Learn modern farming techniques from expert instructors", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
    { icon: DollarSign, title: "Access to Funding", description: "Apply for loans and grants to grow your farming business", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
  ]

  const stats = [
    { icon: Users, label: "Active Farmers", value: "5,000+" },
    { icon: ShoppingBag, label: "Products Listed", value: "12,000+" },
    { icon: TrendingUp, label: "Success Rate", value: "94%" },
  ]

  const benefits = [
    { icon: Shield, title: "Secure Transactions", description: "Safe and transparent payment processing" },
    { icon: Users, title: "Community Support", description: "Join a network of supportive farmers" },
    { icon: TrendingUp, title: "Business Growth", description: "Tools and resources to scale your farm" },
  ]

  const missionAndVision = [
    { icon: Eye, title: "Vision", description: "To contribute towards an Africa that does not depend on the outside world to feed her. Using the least available resources to maximize the capacity of the African food production and supply chain. Through the application of technology, available financial support, and market availability, smallholder farmers will boost in capacity and in turn boost the African food capacity." },
    { icon: Target, title: "Mission", description: "To offer value to African farmers through sustainable practices and a sustainable supply chain. This includes sustainable practices that protect our environment, a sustainable supply chain that ensures fair value distribution, and farmer empowerment through technology and market access." },
  ]

  return (
    <div className="min-h-screen">
      <HeroSection />

      

      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: index * 0.1 }} 
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <div className="bg-[#118C4C]/10 p-3 rounded-full">
                    <stat.icon className="h-6 w-6 text-[#118C4C]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Mission & Vision</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Building the future of African agriculture, one farmer at a time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {missionAndVision.map((item, index) => (
              <motion.div 
                key={item.title} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="bg-green-100 dark:bg-green-900/20 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                      <item.icon className="h-7 w-7 text-green-600" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Foodra provides comprehensive tools and resources to help you grow your farming business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`${feature.bg} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Foodra?</h2>
            <p className="text-lg text-muted-foreground">Built specifically for Nigerian farmers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={benefit.title} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5, delay: index * 0.1 }} 
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="bg-[#118C4C] text-white p-3 rounded-lg">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <GetInTouch />
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Gallery</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A glimpse into the world of modern farming
            </p>
          </div>
          <Gallery />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-[#118C4C] to-[#0d6d3a] text-white border-0">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Farm?</h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of farmers already growing their business with Foodra
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/marketplace" className="w-full sm:w-auto">
                  <button className="gap-2 text-center mx-auto flex items-center justify-center py-3 text-xl px-4 rounded-xl bg-white text-green-600 hover:bg-white/90 w-full">
                    Explore Marketplace
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="/how-it-works" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 bg-transparent w-full"
                  >
                    How It Works
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}