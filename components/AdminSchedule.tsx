"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetDoctors,
  adminGetDoctorSlots,
  adminCreateAppointment,
  AdminSlot,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, CheckCircle2, CalendarDays, User } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function BookingModal({
  doctorId,
  slot,
  onClose,
}: {
  doctorId: number;
  slot: AdminSlot;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<{
    patient_name: string;
    patient_phone: string;
  }>({ mode: "onTouched" });

  const mutation = useMutation({
    mutationFn: adminCreateAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctor-slots", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      setTimeout(onClose, 1200);
    },
  });

  const time = new Date(slot.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
          <DialogDescription>Slot at {time}</DialogDescription>
        </DialogHeader>

        {mutation.isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-medium text-green-700">Booked successfully!</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((v) => mutation.mutate({ slot_id: slot.id, ...v }))}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Patient name</Label>
              <Input
                {...register("patient_name", { required: "Name is required", minLength: { value: 2, message: "At least 2 characters" } })}
                placeholder="John Doe"
              />
              {errors.patient_name && <p className="text-xs text-destructive">{errors.patient_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                {...register("patient_phone", { required: "Phone is required", pattern: { value: /^\+?[0-9\s\-()]{7,20}$/, message: "Enter a valid phone number" } })}
                placeholder="+7 900 123-45-67"
              />
              {errors.patient_phone && <p className="text-xs text-destructive">{errors.patient_phone.message}</p>}
            </div>
            {mutation.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(mutation.error as Error).message}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                {mutation.isPending ? "Booking…" : "Confirm"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AdminSchedule() {
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState(todayISO());
  const [bookingSlot, setBookingSlot] = useState<AdminSlot | null>(null);

  const { data: doctors } = useQuery({ queryKey: ["admin-doctors"], queryFn: adminGetDoctors });
  const { data: slots, isLoading } = useQuery({
    queryKey: ["admin-doctor-slots", doctorId, date],
    queryFn: () => adminGetDoctorSlots(doctorId!, date),
    enabled: !!doctorId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Doctor schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="gap-1.5"><User className="h-3.5 w-3.5 text-sky-600" /> Doctor</Label>
            <Select value={doctorId?.toString() ?? ""} onValueChange={(v) => setDoctorId(v ? Number(v) : null)}>
              <SelectTrigger><SelectValue placeholder="Select a doctor" /></SelectTrigger>
              <SelectContent>
                {doctors?.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name} · {d.specialization}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-sky-600" /> Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {!doctorId ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <User className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm">Select a doctor to view their schedule.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : slots?.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No slots for this date.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slots?.map((s) => {
              const free = s.status === "free";
              const time = new Date(s.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={s.id} className={`rounded-xl border p-3 ${free ? "bg-card" : "bg-muted/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-sm">
                      <Clock className={`h-3.5 w-3.5 ${free ? "text-sky-600" : "text-muted-foreground"}`} />
                      {time}
                      <span className="font-normal text-muted-foreground">· {s.duration_minutes}m</span>
                    </span>
                    <Badge variant={free ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {free ? "Free" : "Booked"}
                    </Badge>
                  </div>
                  {free ? (
                    <Button size="sm" variant="outline" className="mt-2 w-full h-8" onClick={() => setBookingSlot(s)}>
                      Book
                    </Button>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{s.patient_name}</span> · {s.patient_phone}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {bookingSlot && doctorId && (
        <BookingModal doctorId={doctorId} slot={bookingSlot} onClose={() => setBookingSlot(null)} />
      )}
    </Card>
  );
}
