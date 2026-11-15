import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/shared/api/client";
import { issueListSchema, issueSchema, type Issue, type IssueStatus } from "./schemas";

export const issueKeys = {
  byProject: (projectId: string) => ["projects", projectId, "issues"] as const,
};

export const useIssues = (projectId: string) =>
  useQuery({
    queryKey: issueKeys.byProject(projectId),
    queryFn: ({ signal }) =>
      request(`/projects/${projectId}/issues`, { schema: issueListSchema, signal }),
  });

export function useCreateIssue(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      request(`/projects/${projectId}/issues`, {
        method: "POST",
        body: { title },
        schema: issueSchema,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
      // The project list shows an open-issue count, so it is now stale too.
      void client.invalidateQueries({ queryKey: ["projects"], exact: true });
    },
  });
}

/**
 * Optimistic status change: the card moves immediately, rolls back if the
 * server rejects it, and always reconciles with the server afterwards.
 */
export function useUpdateIssueStatus(projectId: string) {
  const client = useQueryClient();
  const key = issueKeys.byProject(projectId);
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) =>
      request(`/issues/${id}`, { method: "PATCH", body: { status }, schema: issueSchema }),
    onMutate: async ({ id, status }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<Issue[]>(key);
      client.setQueryData<Issue[]>(key, (issues) =>
        issues?.map((i) => (i.id === id ? { ...i, status } : i)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({ queryKey: ["projects"], exact: true });
    },
  });
}
