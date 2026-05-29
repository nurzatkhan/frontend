const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface JWTPayload {
  user_id: number;
  username: string;
  exp: number;
}

function parseJWT(token: string): JWTPayload {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

export async function login(username: string, password: string): Promise<TokenPair> {
  const res = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

export function saveTokens(tokens: TokenPair) {
  localStorage.setItem("access", tokens.access);
  localStorage.setItem("refresh", tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

export type Role = "superadmin" | "clinic_admin" | "doctor";

export function getRole(): Role | null {
  const token = getAccessToken();
  if (!token) return null;
  // SimpleJWT doesn't include role by default — we store it separately at login.
  const role = localStorage.getItem("role");
  return role === "superadmin" || role === "clinic_admin" || role === "doctor" ? role : null;
}

export function saveRole(role: string) {
  localStorage.setItem("role", role);
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const { exp } = parseJWT(token);
    return Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}
