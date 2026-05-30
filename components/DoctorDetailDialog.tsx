"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetDoctorSlots, adminCreateAppointment, AdminSlot, Doctor } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, CalendarDays, Phone, CheckCircle2, ArrowLeft } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function DoctorDetailDialog({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [bookSlot, setBookSlot] = useState<AdminSlot | null>(null);

  const { data: slots, isLoading } = useQuery({
    queryKey: ["admin-doctor-slots", doctor.id, date],
    queryFn: () => adminGetDoctorSlots(doctor.id, date),
  });

  const freeCount = slots?.filter((s) => s.status === "free").length ?? 0;
  const bookedCount = slots?.filter((s) => s.status === "booked").length ?? 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Doctor details</DialogTitle>
        </DialogHeader>

        {/* Doctor header */}
        <div className="flex items-center gap-4">
          <Avatar name={doctor.name} className="h-14 w-14 text-lg" />
          <div>
            <h2 className="text-lg font-bold leading-tight">{doctor.name}</h2>
            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
            {doctor.username && <p className="text-xs text-muted-foreground">@{doctor.username}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-sky-50/50 p-3 text-center">
            <p className="text-xl font-bold text-sky-700">{freeCount}</p>
            <p className="text-xs text-muted-foreground">Free slots</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-center">
            <p className="text-xl font-bold">{bookedCount}</p>
            <p className="text-xs text-muted-foreground">Booked</p>
          </div>
        </div>

        {bookSlot ? (
          <InlineBookingForm
            slot={bookSlot}
            onBack={() => setBookSlot(null)}
            onBooked={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-doctor-slots", doctor.id] });
              queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
              setBookSlot(null);
            }}
          />
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-sky-600" /> Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : slots?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No slots for this date.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots?.map((s) => {
                  const free = s.status === "free";
                  const time = new Date(s.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={s.id} className={`rounded-lg border p-2.5 ${free ? "bg-card" : "bg-muted/40"}`}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm font-semibold">
                          <Clock className={`h-3.5 w-3.5 ${free ? "text-sky-600" : "text-muted-foreground"}`} />
                          {time}
                        </span>
                        <Badge variant={free ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {free ? "Free" : "Booked"}
                        </Badge>
                      </div>
                      {free ? (
                        <Button size="sm" variant="outline" className="mt-2 h-7 w-full text-xs" onClick={() => setBookSlot(s)}>
                          Book
                        </Button>
                      ) : (
                        <div className="mt-1.5 text-xs">
                          <p className="font-medium truncate">{s.patient_name}</p>
                          <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{s.patient_phone}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InlineBookingForm({
  slot,
  onBack,
  onBooked,
}: {
  slot: AdminSlot;
  onBack: () => void;
  onBooked: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ patient_name: string; patient_phone: string }>({ mode: "onTouched" });
  const mutation = useMutation({
    mutationFn: adminCreateAppointment,
    onSuccess: () => setTimeout(onBooked, 1000),
  });

  const time = new Date(slot.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="font-medium text-green-700">Booked successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate({ slot_id: slot.id, ...v }))} className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to slots
      </button>
      <p className="text-sm font-medium">Booking slot at {time}</p>
      <div className="space-y-1.5">
        <Label>Patient name</Label>
        <Input {...register("patient_name", { required: "Name is required", minLength: { value: 2, message: "At least 2 characters" } })} placeholder="John Doe" />
        {errors.patient_name && <p className="text-xs text-destructive">{errors.patient_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input {...register("patient_phone", { required: "Phone is required", pattern: { value: /^\+?[0-9\s\-()]{7,20}$/, message: "Enter a valid phone number" } })} placeholder="+7 900 123-45-67" />
        {errors.patient_phone && <p className="text-xs text-destructive">{errors.patient_phone.message}</p>}
      </div>
      {mutation.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{(mutation.error as Error).message}</p>}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Booking…" : "Confirm booking"}
      </Button>
    </form>
  );
}
