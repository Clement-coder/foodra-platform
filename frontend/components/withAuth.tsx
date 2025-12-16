"use client";

import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithAuth = (props: P) => {
    const { ready, authenticated } = usePrivy();
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
      if (ready && !authenticated) {
        setModalOpen(true);
      } else if (ready && authenticated) {
        setModalOpen(false);
      }
    }, [ready, authenticated, router]);

    const handleCloseModal = () => {
      setModalOpen(false);
      router.push("/"); // Redirect to home page if user closes the modal
    };

    if (!ready) {
      return <div>Loading...</div>; // Or a more sophisticated loading spinner
    }

    if (authenticated) {
      return <WrappedComponent {...props} />;
    }

    return (
      <>
        <WrappedComponent {...props} />
        <AuthModal isOpen={modalOpen} onClose={handleCloseModal} />
      </>
    );
  };

  return ComponentWithAuth;
};

export default withAuth;
