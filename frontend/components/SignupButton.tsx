import React, { Suspense, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";

function SignupButtonInner() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (authenticated) {
      const redirect = searchParams.get("redirect");
      if (redirect) router.replace(redirect);
    }
  }, [authenticated, searchParams, router]);

  return (
    <button
      onClick={() => !authenticated && login()}
      disabled={authenticated}
      className="w-full flex items-center justify-center gap-2 bg-[#118C4C] hover:bg-[#0d6d3a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
    >
      <LogIn className="h-4 w-4" />
      {authenticated ? "Signed In" : !ready ? "Loading..." : "Sign In to Foodra"}
    </button>
  );
}

export default function SignupButton() {
  return (
    <Suspense fallback={
      <button disabled className="w-full flex items-center justify-center gap-2 bg-[#118C4C] opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm">
        <LogIn className="h-4 w-4" />
        Sign In to Foodra
      </button>
    }>
      <SignupButtonInner />
    </Suspense>
  );
}
