import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "./ui/button";

export default function SignupButton() {
  const { ready, authenticated, login } = usePrivy();

  return (
    <Button
      onClick={() => login()}
      disabled={!ready || authenticated}
      className="px-4 py-2 bg-green-700 text-white rounded"
    >
      {authenticated ? "Already Signed In" : "Sign Up / Log In"}
    </Button>
  );
}
