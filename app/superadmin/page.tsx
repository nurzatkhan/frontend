"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAuthenticated, getRole } from "@/lib/auth";
import {
  superGetClinics,
  superCreateClinic,
  superGetAdmins,
  superCreateAdmin,
} from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, UserPlus, Plus, Users, ShieldCheck } from "lucide-react";

export default function SuperAdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated() || getRole() !== "superadmin") router.replace("/login");
  }, [router]);

  const { data: clinics, isLoading: loadingClinics } = useQuery({
    queryKey: ["super-clinics"],
    queryFn: superGetClinics,
  });
  const { data: admins, isLoading: loadingAdmins } = useQuery({
    queryKey: ["super-admins"],
    queryFn: superGetAdmins,
  });

  return (
    <div className="min-h-screen app-bg">
      <AppHeader title="Platform Admin" subtitle="Manage clinics & administrators" badge="Super" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Building2 className="h-5 w-5" />} label="Clinics" value={clinics?.length} loading={loadingClinics} />
          <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Clinic admins" value={admins?.length} loading={loadingAdmins} />
        </div>

        <Tabs defaultValue="clinics">
          <TabsList>
            <TabsTrigger value="clinics" className="gap-2"><Building2 className="h-4 w-4" /> Clinics</TabsTrigger>
            <TabsTrigger value="admins" className="gap-2"><ShieldCheck className="h-4 w-4" /> Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="clinics" className="space-y-5 mt-5">
            <CreateClinicCard onSuccess={() => queryClient.invalidateQueries({ queryKey: ["super-clinics"] })} />
            <Card>
              <CardHeader><CardTitle className="text-base">All clinics</CardTitle></CardHeader>
              <CardContent>
                {loadingClinics ? (
                  <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : clinics?.length === 0 ? (
                  <Empty icon={<Building2 className="h-8 w-8" />} text="No clinics yet." />
                ) : (
                  <ul className="space-y-3">
                    {clinics?.map((c) => (
                      <li key={c.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                        </div>
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <Users className="h-3 w-3" /> {c.doctors_count} doctors
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="space-y-5 mt-5">
            <CreateAdminCard
              clinics={clinics ?? []}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["super-admins"] })}
            />
            <Card>
              <CardHeader><CardTitle className="text-base">Clinic administrators</CardTitle></CardHeader>
              <CardContent>
                {loadingAdmins ? (
                  <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : admins?.length === 0 ? (
                  <Empty icon={<ShieldCheck className="h-8 w-8" />} text="No administrators yet." />
                ) : (
                  <ul className="space-y-3">
                    {admins?.map((a) => (
                      <li key={a.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                        <Avatar name={a.username} className="h-11 w-11 text-sm" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">@{a.username}</p>
                          <p className="text-xs text-muted-foreground">{a.clinic}</p>
                        </div>
                        <Badge variant="secondary" className="font-normal">Admin</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CreateClinicCard({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: superCreateClinic,
    onSuccess: () => { onSuccess(); setName(""); setError(""); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-sky-600" /> Add a clinic</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ name }); }} className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="sr-only">Clinic name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clinic name" required />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="gap-2">
            <Plus className="h-4 w-4" /> {mutation.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}

function CreateAdminCard({
  clinics,
  onSuccess,
}: {
  clinics: { id: number; name: string }[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ clinic_id: "", username: "", password: "" });
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: superCreateAdmin,
    onSuccess: () => { onSuccess(); setForm({ clinic_id: "", username: "", password: "" }); setError(""); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-sky-600" /> Add a clinic admin</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ clinic_id: Number(form.clinic_id), username: form.username, password: form.password });
          }}
          className="space-y-4"
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Clinic</Label>
              <Select value={form.clinic_id} onValueChange={(v) => setForm({ ...form, clinic_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {clinics.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="admin_new" required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min. 6 chars" required />
            </div>
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" disabled={mutation.isPending || !form.clinic_id} className="gap-2">
            <Plus className="h-4 w-4" /> {mutation.isPending ? "Adding…" : "Add admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value?: number; loading: boolean }) {
  return (
    <Card className="bg-gradient-to-br from-white to-sky-50/50">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">{icon}</div>
        <div>
          {loading ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-bold leading-none">{value ?? 0}</p>}
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
      <div className="mb-3 text-muted-foreground/40">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
