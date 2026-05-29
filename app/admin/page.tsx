"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAuthenticated, getRole } from "@/lib/auth";
import {
  adminGetDoctors,
  adminCreateDoctor,
  adminDeleteDoctor,
  adminGetAppointments,
  Doctor,
} from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { AdminSchedule } from "@/components/AdminSchedule";
import { DoctorDetailDialog } from "@/components/DoctorDetailDialog";
import { Avatar } from "@/components/Avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, UserPlus, Users, CalendarCheck, CalendarDays, Phone, Stethoscope, ChevronRight } from "lucide-react";

function AddDoctorForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", specialization: "", username: "", password: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: adminCreateDoctor,
    onSuccess: () => {
      onSuccess();
      setForm({ name: "", specialization: "", username: "", password: "" });
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={form.name} onChange={field("name")} placeholder="Dr. John Doe" required />
        </div>
        <div className="space-y-1.5">
          <Label>Specialization</Label>
          <Input value={form.specialization} onChange={field("specialization")} placeholder="Cardiologist" required />
        </div>
        <div className="space-y-1.5">
          <Label>Username</Label>
          <Input value={form.username} onChange={field("username")} placeholder="dr_john" required />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={field("password")} placeholder="min. 6 characters" required />
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}
      <Button type="submit" disabled={mutation.isPending} className="gap-2">
        <Plus className="h-4 w-4" /> {mutation.isPending ? "Adding…" : "Add doctor"}
      </Button>
    </form>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated() || getRole() !== "clinic_admin") router.replace("/login");
  }, [router]);

  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: adminGetDoctors,
  });
  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: adminGetAppointments,
  });
  const deleteMutation = useMutation({
    mutationFn: adminDeleteDoctor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-doctors"] }),
  });
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  return (
    <div className="min-h-screen app-bg">
      <AppHeader title="Clinic Admin" subtitle="Manage your clinic" badge="Admin" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Doctors" value={doctors?.length} loading={loadingDoctors} />
          <StatCard icon={<CalendarCheck className="h-5 w-5" />} label="Appointments" value={appointments?.length} loading={loadingAppts} />
        </div>

        <Tabs defaultValue="doctors">
          <TabsList>
            <TabsTrigger value="doctors" className="gap-2"><Users className="h-4 w-4" /> Doctors</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2"><CalendarDays className="h-4 w-4" /> Schedule</TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2"><CalendarCheck className="h-4 w-4" /> Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="doctors" className="space-y-5 mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4 text-sky-600" /> Add a doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddDoctorForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-doctors"] })} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Doctors in clinic</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDoctors ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : doctors?.length === 0 ? (
                  <EmptyState icon={<Stethoscope className="h-8 w-8" />} text="No doctors yet. Add your first one above." />
                ) : (
                  <ul className="space-y-3">
                    {doctors?.map((d: Doctor) => (
                      <li
                        key={d.id}
                        onClick={() => setSelectedDoctor(d)}
                        className="group flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-3 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
                      >
                        <Avatar name={d.name} className="h-11 w-11 text-sm" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.specialization} · @{d.username}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(d.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-5">
            <AdminSchedule />
          </TabsContent>

          <TabsContent value="appointments" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppts ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : appointments?.length === 0 ? (
                  <EmptyState icon={<CalendarCheck className="h-8 w-8" />} text="No appointments yet." />
                ) : (
                  <ul className="space-y-3">
                    {appointments?.map((a) => (
                      <li key={a.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                        <Avatar name={a.patient_name} className="h-11 w-11 text-sm" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{a.patient_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.slot.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <Phone className="h-3 w-3" /> {a.patient_phone}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {selectedDoctor && (
        <DoctorDetailDialog doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}
    </div>
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

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
      <div className="mb-3 text-muted-foreground/40">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
