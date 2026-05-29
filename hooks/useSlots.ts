import { useQuery } from "@tanstack/react-query";
import { getSlots } from "@/lib/api";

export function useSlots(doctorId: number | null, date: string) {
  return useQuery({
    queryKey: ["slots", doctorId, date],
    queryFn: () => getSlots(doctorId!, date),
    enabled: !!doctorId && !!date,
  });
}
