"use client";

import { useForm } from "react-hook-form";
import { Slot } from "@/lib/api";
import { useBookAppointment } from "@/hooks/useBookAppointment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface FormValues {
  patient_name: string;
  patient_phone: string;
}

interface Props {
  slot: Slot;
  onClose: () => void;
}

export function BookingModal({ slot, onClose }: Props) {
  const { mutate, isPending, error, isSuccess } = useBookAppointment();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onTouched" });

  const onSubmit = (values: FormValues) => {
    mutate(
      { slot_id: slot.id, ...values },
      { onSuccess: () => setTimeout(onClose, 1500) }
    );
  };

  const timeLabel = new Date(slot.starts_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
          <DialogDescription>Slot at {timeLabel}</DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-medium text-green-700">Appointment booked successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="patient_name">Full name</Label>
              <Input
                id="patient_name"
                {...register("patient_name", {
                  required: "Name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
                placeholder="John Doe"
              />
              {errors.patient_name && (
                <p className="text-xs text-destructive">{errors.patient_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_phone">Phone</Label>
              <Input
                id="patient_phone"
                {...register("patient_phone", {
                  required: "Phone is required",
                  pattern: {
                    value: /^\+?[0-9\s\-()]{7,20}$/,
                    message: "Enter a valid phone number",
                  },
                })}
                placeholder="+7 900 123-45-67"
              />
              {errors.patient_phone && (
                <p className="text-xs text-destructive">{errors.patient_phone.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(error as Error).message}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Booking…" : "Confirm"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
