import React, { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

export default function SignupButton() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();

  // After login, redirect back to the page the user came from
  useEffect(() => {
    if (authenticated) {
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.replace(redirect);
      }
    }
  }, [authenticated, searchParams, router]);

  return (
    <Button
      onClick={() => login()}
      disabled={!ready || authenticated}
      className="px-4 py-2 bg-[#118C4C] hover:bg-[#0d6d3a] text-white rounded-lg text-sm font-medium"
    >
      {authenticated ? "Signed In" : "Sign In"}
    </Button>
  );
}
