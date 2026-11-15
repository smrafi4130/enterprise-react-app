import { z } from "zod";

export const ISSUE_STATUSES = ["open", "in_progress", "done"] as const;
export const issueSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  status: z.enum(ISSUE_STATUSES),
  assigneeId: z.string().nullable(),
  createdAt: z.string(),
});
export type Issue = z.infer<typeof issueSchema>;
export type IssueStatus = Issue["status"];
export const issueListSchema = z.array(issueSchema);

export const STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};
