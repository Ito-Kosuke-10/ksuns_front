"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { setAccessToken } from "@/lib/auth-token";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("access_token");
    if (token) {
      setAccessToken(token);
    }
    router.replace("/dashboard");
  }, [router, searchParams]);

  return null;
}
