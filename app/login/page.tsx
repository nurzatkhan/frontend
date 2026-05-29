"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, saveTokens, saveRole } from "@/lib/auth";
import { getMe } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Stethoscope, ArrowLeft } from "lucide-react";

const HOME_BY_ROLE: Record<string, string> = {
  superadmin: "/superadmin",
  clinic_admin: "/admin",
  doctor: "/doctor",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await login(username, password);
      saveTokens(tokens);
      // Роль определяем с бэкенда — работает и для динамически созданных пользователей.
      const me = await getMe();
      saveRole(me.role ?? "");
      router.push(HOME_BY_ROLE[me.role ?? ""] ?? "/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen app-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-xl shadow-sky-200">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your clinic</p>
        </div>

        <Card className="shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin_city" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Demo accounts</p>
              <p>Admin — <code className="font-mono">admin_city</code> / <code className="font-mono">admin123</code></p>
              <p>Doctor — <code className="font-mono">doctor_anna</code> / <code className="font-mono">doctor123</code></p>
            </div>
          </CardContent>
        </Card>

        <a href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to booking
        </a>
      </div>
    </main>
  );
}
