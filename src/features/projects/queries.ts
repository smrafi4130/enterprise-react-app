import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/shared/api/client";
import { projectListSchema, projectSchema } from "./schemas";

/** Query keys live next to the queries so invalidation targets can't drift. */
export const projectKeys = {
  all: ["projects"] as const,
};

export const projectsQuery = () =>
  queryOptions({
    queryKey: projectKeys.all,
    queryFn: ({ signal }) => request("/projects", { schema: projectListSchema, signal }),
  });

export const useProjects = () => useQuery(projectsQuery());

export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description: string }) =>
      request("/projects", { method: "POST", body: input, schema: projectSchema }),
    onSuccess: () => client.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
