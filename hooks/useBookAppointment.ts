import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookAppointment } from "@/lib/api";

export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });
}
