"use client";

import { useState } from "react";
import { Slot } from "@/lib/api";
import { BookingModal } from "./BookingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Props {
  slots: Slot[];
}

export function SlotList({ slots }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">No slots available for this date.</p>;
  }

  return (
    <>
      <ul className="space-y-2">
        {slots.map((slot) => {
          const time = new Date(slot.starts_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const isFree = slot.status === "free";

          return (
            <li key={slot.id}>
              <Button
                variant={isFree ? "outline" : "ghost"}
                disabled={!isFree}
                onClick={() => setSelectedSlot(slot)}
                className="w-full justify-between h-12 px-4"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {time}
                </span>
                <Badge variant={isFree ? "default" : "secondary"}>
                  {isFree ? "Free" : "Booked"}
                </Badge>
              </Button>
            </li>
          );
        })}
      </ul>

      {selectedSlot && (
        <BookingModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
      )}
    </>
  );
}
