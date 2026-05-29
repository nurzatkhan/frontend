"use client";

import { useState } from "react";
import { useDoctors } from "@/hooks/useDoctors";
import { useSlots } from "@/hooks/useSlots";
import { SlotList } from "@/components/SlotList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, CalendarDays, UserRound } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function HomePage() {
  const { data: doctors, isLoading: loadingDoctors, error: doctorsError } = useDoctors();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState(todayISO());

  const { data: slots, isLoading: loadingSlots, error: slotsError } = useSlots(doctorId, date);

  return (
    <div className="min-h-screen app-bg">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-200">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight">MedClinic</span>
          </div>
          <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Staff login →
          </a>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Book an appointment</h1>
          <p className="text-muted-foreground mt-1">Choose a doctor and date to see open time slots.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Find a slot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="gap-1.5"><UserRound className="h-3.5 w-3.5 text-sky-600" /> Doctor</Label>
              {loadingDoctors ? (
                <Skeleton className="h-9 w-full" />
              ) : doctorsError ? (
                <p className="text-sm text-destructive">Failed to load doctors.</p>
              ) : (
                <Select value={doctorId?.toString() ?? ""} onValueChange={(v) => setDoctorId(v ? Number(v) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} · {d.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-sky-600" /> Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available slots</CardTitle>
          </CardHeader>
          <CardContent>
            {!doctorId ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <UserRound className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm">Select a doctor to see available slots.</p>
              </div>
            ) : loadingSlots ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : slotsError ? (
              <p className="text-sm text-destructive">{(slotsError as Error).message}</p>
            ) : (
              <SlotList slots={slots ?? []} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
