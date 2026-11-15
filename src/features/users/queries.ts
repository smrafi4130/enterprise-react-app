import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "@/shared/api/client";
import { userSchema } from "@/features/auth";
import type { Role } from "@/shared/lib/permissions";

const userListSchema = z.array(userSchema);
const key = ["users"] as const;

export const useUsers = () =>
  useQuery({
    queryKey: key,
    queryFn: ({ signal }) => request("/users", { schema: userListSchema, signal }),
  });

export function useUpdateRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      request(`/users/${id}`, { method: "PATCH", body: { role }, schema: userSchema }),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
