"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import { useUser } from "@/lib/useUser";
import { calculateProfileCompletion } from "@/lib/profileUtils";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { NotificationDiv } from "./NotificationDiv";
import { useToast } from "@/lib/toast";

const TermsModal = ({ onAccept }: { onAccept: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#118C4C]/10 rounded-xl">
          <ShieldCheck className="h-6 w-6 text-[#118C4C]" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Terms of Service</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Before using Foodra, please read and accept our{" "}
        <a href="/terms" target="_blank" className="text-[#118C4C] underline underline-offset-2 font-medium">Terms of Service</a>{" "}
        and{" "}
        <a href="/privacy" target="_blank" className="text-[#118C4C] underline underline-offset-2 font-medium">Privacy Policy</a>.
        By continuing, you agree that Foodra may process your data to provide marketplace, training, funding, and wallet services.
      </p>
      <div className="bg-[#118C4C]/5 border border-[#118C4C]/20 rounded-xl p-3 mb-5 text-xs text-muted-foreground space-y-1">
        <p>✓ Your data is stored securely on Supabase</p>
        <p>✓ Payments are secured via blockchain escrow</p>
        <p>✓ You can delete your account at any time</p>
      </div>
      <button
        onClick={onAccept}
        className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-semibold py-3 rounded-xl transition-colors"
      >
        I Accept — Continue to Foodra
      </button>
    </motion.div>
  </div>
);

// Beautiful Loading Component
const LoadingScreen = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto"
          >
            <div className="w-full h-full rounded-full border-4 border-transparent border-t-[#118C4C] border-r-[#118C4C]"></div>
          </motion.div>
          
          {/* Inner pulsing circle */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#118C4C] rounded-full opacity-20"
          ></motion.div>
          
          {/* Center icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loader2 className="h-6 w-6 text-[#118C4C] animate-spin" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
          <div className="flex gap-1 justify-center">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 bg-[#118C4C] rounded-full"
            ></motion.div>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-[#118C4C] rounded-full"
            ></motion.div>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-[#118C4C] rounded-full"
            ></motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Module-level flag — persists across page navigations (HOC remounts)
let termsModalShownThisSession = false;

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithAuth = (props: P) => {
    const { ready, authenticated } = usePrivy();
    const { currentUser, isLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [showProfileToast, setShowProfileToast] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const prevAuthRef = useRef<boolean | null>(null);

    useEffect(() => {
      if (!ready || isLoading) return;

      if (!authenticated) {
        setAuthModalOpen(true);
        prevAuthRef.current = false;
        return;
      }

      // Fire login toast only on transition from unauthenticated → authenticated
      if (prevAuthRef.current === false && authenticated && currentUser) {
        toast.success(`Welcome back, ${currentUser.name || "Farmer"}! 👋`);
      }
      prevAuthRef.current = authenticated;

      setAuthModalOpen(false);

      // Show terms once — only on first load after login, never again this session
      if (authenticated && currentUser && !currentUser.termsAcceptedAt && !termsModalShownThisSession) {
        termsModalShownThisSession = true;
        setShowTerms(true);
        return;
      }

      // Check profile completion and show toast if incomplete
      if (authenticated && currentUser) {
        const completion = calculateProfileCompletion(currentUser);
        
        // Show toast notification if profile is incomplete and not on profile page
        if (completion < 100 && pathname !== "/profile") {
          setShowProfileToast(true);
          
          // Auto-hide toast after 10 seconds
          const timer = setTimeout(() => {
            setShowProfileToast(false);
          }, 10000);
          
          return () => clearTimeout(timer);
        } else {
          setShowProfileToast(false);
        }
      }
    }, [ready, authenticated, currentUser, isLoading, pathname]);

    const handleCloseAuthModal = () => {
      setAuthModalOpen(false);
      router.push("/");
    };

    // Privy is not ready yet
    if (!ready) {
      return <LoadingScreen message="Initializing..." />;
    }

    // User is not authenticated
    if (!authenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-lime-50">
          <div className="text-center p-8 max-w-sm">
            <div className="w-16 h-16 bg-[#118C4C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#118C4C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in required</h2>
            <p className="text-gray-500 text-sm mb-6">You need to be signed in to access this page.</p>
            <AuthModal isOpen={authModalOpen} onClose={handleCloseAuthModal} />
          </div>
        </div>
      );
    }

    // Loading user profile data
    if (isLoading) {
      return <LoadingScreen message="Loading your profile..." />;
    }

    // Block non-admins from /admin
    if (authenticated && currentUser && pathname.startsWith("/admin") && currentUser.role !== "admin") {
      router.replace("/");
      return <LoadingScreen message="Redirecting..." />;
    }

    // User is authenticated and profile data is loaded
    if (authenticated && currentUser) {
      const handleAcceptTerms = async () => {
        const now = new Date().toISOString();
        await fetch("/api/users/sync", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ privyId: currentUser.id, terms_accepted_at: now }),
        });
        termsModalShownThisSession = true; // keep suppressed for rest of session
        setShowTerms(false);
      };

      return (
        <>
          {showTerms && <TermsModal onAccept={handleAcceptTerms} />}
          <WrappedComponent {...props} />
          <AnimatePresence>
            {showProfileToast && (
              <NotificationDiv
                type="warning"
                title="Complete Your Profile"
                message="Please complete your profile to unlock all features and have the best experience."
                actionLabel="Complete Profile Now"
                onAction={() => {
                  window.location.href = "/profile";
                }}
                onClose={() => setShowProfileToast(false)}
                duration={10000}
              />
            )}
          </AnimatePresence>
        </>
      );
    }

    // Fallback error state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            We couldn't load your account. Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-medium px-6 py-3 rounded-lg transition-colors"
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
