"use client";

import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import { useUser } from "@/lib/useUser";
import { calculateProfileCompletion } from "@/lib/profileUtils";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithAuth = (props: P) => {
    const { ready, authenticated } = usePrivy();
    const { currentUser, isLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    useEffect(() => {
      if (!ready) return; // Wait for Privy to be ready

      if (!authenticated) {
        setAuthModalOpen(true);
        return;
      }

      // If authenticated, and currentUser is available (not isLoading from useUser)
      if (authenticated && currentUser && !isLoading) {
        const completion = calculateProfileCompletion(currentUser);
        if (completion < 100 && pathname !== "/profile") {
          router.push("/profile");
        }
      }
      setAuthModalOpen(false); // Close auth modal if authenticated
    }, [ready, authenticated, currentUser, isLoading, router]);

    const handleCloseAuthModal = () => {
      setAuthModalOpen(false);
      router.push("/"); // Redirect to home page if user closes the auth modal
    };

    if (!ready) {
      return <div>Loading authentication...</div>; // Privy is not ready yet
    }

    if (!authenticated) {
      return <AuthModal isOpen={authModalOpen} onClose={handleCloseAuthModal} />;
    }

    // At this point, Privy is ready and the user is authenticated.
    // Now, we wait for the currentUser data to be loaded/mocked by useUser.
    if (isLoading) {
      return <div>Loading profile data...</div>; // useUser is still loading the user object
    }

    if (authenticated && currentUser) {
      const completion = calculateProfileCompletion(currentUser);
      if (completion < 100 && pathname !== "/profile") {
        // This case is handled by the useEffect redirect, but we return null here to prevent rendering the wrapped component
        return null;
      }
      return <WrappedComponent {...props} />;
    }

    // Fallback, should ideally not be reached if logic is sound
    return <div>Something went wrong.</div>;
  };

  return ComponentWithAuth;
};

export default withAuth;
