"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-100 transition hover:bg-red-500/20"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>
  );
}
