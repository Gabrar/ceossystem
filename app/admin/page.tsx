"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Loader2 } from "lucide-react";

export default function AdminIndexPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading) {
      if (user && isAdmin) {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [user, isAdmin, loading, router]);

  return (
    <div className="min-h-screen bg-[#071321] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );
}
