"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";

export function useRequireSuperAdmin() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.replace("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  return isAuthorized;
}
