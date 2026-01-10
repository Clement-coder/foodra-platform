"use client";

import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import { useUser } from "@/lib/useUser";
import { calculateProfileCompletion } from "@/lib/profileUtils";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";

// Toast Notification Component
const ProfileIncompleteToast = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="fixed bottom-6 right-6 z-50 max-w-md"
    >
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-lg shadow-2xl border border-orange-400/50 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Complete Your Profile</h3>
            <p className="text-xs text-white/90 leading-relaxed">
              Please complete your profile to unlock all features and have the best experience.
            </p>
            
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3">
          <button
            onClick={() => {
              window.location.href = "/profile";
            }}
            className="w-full bg-white text-orange-600 hover:bg-orange-50 font-medium text-xs py-2 px-4 rounded-md transition-colors"
          >
            Complete Profile Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

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

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithAuth = (props: P) => {
    const { ready, authenticated } = usePrivy();
    const { currentUser, isLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [showProfileToast, setShowProfileToast] = useState(false);

    useEffect(() => {
      // Wait for both Privy and user data to be ready
      if (!ready || isLoading) return;

      if (!authenticated) {
        setAuthModalOpen(true);
        return;
      }

      // User is authenticated, close auth modal
      setAuthModalOpen(false);

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
      return <AuthModal isOpen={authModalOpen} onClose={handleCloseAuthModal} />;
    }

    // Loading user profile data
    if (isLoading) {
      return <LoadingScreen message="Loading your profile..." />;
    }

    // User is authenticated and profile data is loaded
    if (authenticated && currentUser) {
      return (
        <>
          <WrappedComponent {...props} />
          <AnimatePresence>
            {showProfileToast && (
              <ProfileIncompleteToast onClose={() => setShowProfileToast(false)} />
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