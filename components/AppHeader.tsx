"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { clearTokens } from "@/lib/auth";
import { getMe } from "@/lib/api";

interface Props {
  title: string;
  subtitle: string;
  badge?: string;
}

export function AppHeader({ title, subtitle, badge }: Props) {
  const router = useRouter();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });

  function logout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-200">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold leading-tight tracking-tight">{title}</h1>
              {badge && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {me && (
            <div className="hidden sm:flex items-center gap-2.5 rounded-full border bg-white/60 py-1 pl-1 pr-3">
              <Avatar name={me.username} className="h-8 w-8 text-xs" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">{me.username}</p>
                {me.clinic && <p className="text-[11px] text-muted-foreground">{me.clinic.name}</p>}
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
