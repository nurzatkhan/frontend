"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAuthenticated, getRole } from "@/lib/auth";
import { doctorGetSlots, doctorCreateSlot, doctorDeleteSlot, doctorGetAppointments } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Clock, CalendarDays, CalendarCheck, Phone, CalendarPlus } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function DoctorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isAuthenticated() || getRole() !== "doctor") router.replace("/login");
  }, [router]);

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["doctor-slots", date],
    queryFn: () => doctorGetSlots(date),
  });
  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["doctor-appointments"],
    queryFn: doctorGetAppointments,
  });

  const createMutation = useMutation({
    mutationFn: doctorCreateSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-slots"] });
      setStartsAt("");
      setCreateError("");
    },
    onError: (e: Error) => setCreateError(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: doctorDeleteSlot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["doctor-slots"] }),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    createMutation.mutate({ starts_at: new Date(startsAt).toISOString(), duration_minutes: duration });
  }

  return (
    <div className="min-h-screen app-bg">
      <AppHeader title="Doctor Dashboard" subtitle="Manage your slots & appointments" badge="Doctor" />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Tabs defaultValue="slots">
          <TabsList>
            <TabsTrigger value="slots" className="gap-2"><CalendarDays className="h-4 w-4" /> My Slots</TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2"><CalendarCheck className="h-4 w-4" /> Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="slots" className="space-y-5 mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarPlus className="h-4 w-4 text-sky-600" /> Add a slot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Date & time</Label>
                      <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Duration (min)</Label>
                      <Input type="number" min={5} max={480} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                    </div>
                  </div>
                  {createError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{createError}</p>}
                  <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                    <Plus className="h-4 w-4" /> {createMutation.isPending ? "Adding…" : "Add slot"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Slots</CardTitle>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44 h-9" />
              </CardHeader>
              <CardContent>
                {loadingSlots ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : slots?.length === 0 ? (
                  <EmptyState icon={<CalendarDays className="h-8 w-8" />} text="No slots for this date." />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots?.map((s) => {
                      const free = s.status === "free";
                      return (
                        <div
                          key={s.id}
                          className={`group relative rounded-xl border p-3 ${free ? "bg-card hover:border-sky-200" : "bg-muted/40"}`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Clock className={`h-3.5 w-3.5 ${free ? "text-sky-600" : "text-muted-foreground"}`} />
                            {new Date(s.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{s.duration_minutes} min</span>
                            <Badge variant={free ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {free ? "Free" : "Booked"}
                            </Badge>
                          </div>
                          {free && (
                            <button
                              onClick={() => deleteMutation.mutate(s.id)}
                              className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md group-hover:flex"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-5">
            <Card>
              <CardHeader><CardTitle className="text-base">My appointments</CardTitle></CardHeader>
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
    </div>
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
