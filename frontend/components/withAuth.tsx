"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { calculateProfileCompletion } from "@/lib/profileUtils";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Leaf, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { NotificationDiv } from "./NotificationDiv";
import { useToast } from "@/lib/toast";
import ThemeToggle from "./ThemeToggle";
import SignupButton from "./SignupButton";

const perks = [
  { icon: Leaf, text: "Buy & sell fresh farm produce directly" },
  { icon: TrendingUp, text: "Apply for funding and grow your farm" },
  { icon: Wallet, text: "Secure NGN wallet powered by Paystack" },
  { icon: ShieldCheck, text: "Verified sellers and trusted buyers" },
];

const LoadingScreen = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#118C4C] border-r-[#118C4C]/40"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf className="h-6 w-6 text-[#118C4C]" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </motion.div>
  </div>
);

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const ComponentWithAuth = (props: P) => {
    const { ready, authenticated } = usePrivy();
    const { currentUser, isLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [showProfileToast, setShowProfileToast] = useState(false);
    const prevAuthRef = useRef<boolean>(false);

    useEffect(() => {
      if (!ready || isLoading) return;
      if (!authenticated) { prevAuthRef.current = false; return; }
      if (!prevAuthRef.current && authenticated && currentUser) {
        toast.success(`Welcome back, ${currentUser.name || "Farmer"}! 👋`);
        // Redirect to the page they originally tried to visit
        const intended = sessionStorage.getItem("foodra_redirect")
        if (intended) {
          sessionStorage.removeItem("foodra_redirect")
          router.replace(intended)
          return
        }
      }
      prevAuthRef.current = authenticated;
      if (authenticated && currentUser) {
        const completion = calculateProfileCompletion(currentUser);
        if (completion < 100 && pathname !== "/profile") {
          setShowProfileToast(true);
          const timer = setTimeout(() => setShowProfileToast(false), 10000);
          return () => clearTimeout(timer);
        } else {
          setShowProfileToast(false);
        }
      }
    }, [ready, authenticated, currentUser, isLoading, pathname]);

    if (!ready) return <LoadingScreen message="Starting up..." />;

    if (!authenticated) {
      // Save the intended destination so we can return after login
      if (typeof window !== "undefined") {
        const intended = window.location.pathname + window.location.search
        if (intended !== "/" && intended !== "/login") {
          sessionStorage.setItem("foodra_redirect", intended)
        }
      }

      return (
        <div className="min-h-screen bg-background flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>

          <div className="flex flex-1 flex-col lg:flex-row">
            {/* Left — branding panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a40] to-[#0a5c30] flex-col justify-between p-12">
              {/* Background texture */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
                <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-lime-300 blur-3xl" />
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white font-bold text-xl tracking-tight">Foodra</span>
                </div>
                <p className="text-white/60 text-sm">Nigeria's Farm Marketplace</p>
              </div>

              <div className="relative">
                <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                  Empowering<br />African Farmers
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-10">
                  Connect directly with buyers, access funding, and grow your farm with tools built for Africa.
                </p>
                <div className="space-y-4">
                  {perks.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-white/80 text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="relative text-white/40 text-xs">© 2026 Foodra Technologies Ltd · Benue State, Nigeria</p>
            </div>

            {/* Right — sign in panel */}
            <div className="flex flex-1 items-center justify-center px-6 py-8 sm:py-12 lg:py-0">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-sm"
              >
                {/* Mobile logo */}
                <div className="flex lg:hidden items-center gap-2 mb-8">
                  <div className="w-9 h-9 rounded-xl bg-[#118C4C]/10 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-[#118C4C]" />
                  </div>
                  <span className="text-foreground font-bold text-xl tracking-tight">Foodra</span>
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
                <p className="text-muted-foreground text-sm mb-8">
                  Sign in to your Foodra account to continue.
                </p>

                <div className="mb-6">
                  <SignupButton />
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">New to Foodra?</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Signing in creates your account automatically. No password needed — we use secure email and social login.
                </p>

                {/* Mobile perks */}
                <div className="mt-8 lg:hidden space-y-3">
                  {perks.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-[#118C4C]" />
                      </div>
                      <span className="text-muted-foreground text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) return <LoadingScreen message="Loading your profile..." />;

    if (authenticated && currentUser && pathname.startsWith("/admin") && currentUser.role !== "admin") {
      router.replace("/");
      return <LoadingScreen message="Redirecting..." />;
    }

    if (authenticated && currentUser) {
      return (
        <>
          <WrappedComponent {...props} />
          <AnimatePresence>
            {showProfileToast && (
              <NotificationDiv
                type="warning"
                title="Complete Your Profile"
                message="Please complete your profile to unlock all features and have the best experience."
                actionLabel="Complete Profile Now"
                onAction={() => { window.location.href = "/profile"; }}
                onClose={() => setShowProfileToast(false)}
                duration={10000}
              />
            )}
          </AnimatePresence>
        </>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-6">
            We couldn't load your account. Please refresh the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  };

  return ComponentWithAuth;
};

export default withAuth;
