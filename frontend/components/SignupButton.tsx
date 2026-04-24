import React, { Suspense, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

function SignupButtonInner() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();

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

export default function SignupButton() {
  return (
    <Suspense fallback={
      <Button disabled className="px-4 py-2 bg-[#118C4C] text-white rounded-lg text-sm font-medium opacity-70">
        Sign In
      </Button>
    }>
      <SignupButtonInner />
    </Suspense>
  );
}
