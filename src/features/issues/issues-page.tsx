import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Field, Input, useToast } from "@smrafi/ui";
import { Can, useCan } from "@/features/auth";
import { ErrorState } from "@/shared/ui/error-state";
import { useCreateIssue, useIssues, useUpdateIssueStatus } from "./queries";
import { ISSUE_STATUSES, STATUS_LABEL, type IssueStatus } from "./schemas";

export function IssuesPage() {
  const { projectId = "" } = useParams();
  const { data, isPending, error, refetch } = useIssues(projectId);
  const update = useUpdateIssueStatus(projectId);
  const canUpdate = useCan("issue:update");
  const { toast } = useToast();

  return (
    <section aria-labelledby="issues-heading">
      <h1 id="issues-heading">Issues</h1>
      <Can permission="issue:create">
        <NewIssueForm projectId={projectId} />
      </Can>
      {isPending ? <p role="status">Loading issues…</p> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data?.length === 0 ? <p>No issues yet.</p> : null}
      {data ? (
        <ul className="issues">
          {data.map((issue) => (
            <li key={issue.id} className="card issue">
              <span>{issue.title}</span>
              {canUpdate ? (
                <label>
                  <span className="sr-only">Status for {issue.title}</span>
                  <select
                    value={issue.status}
                    onChange={(e) =>
                      update.mutate(
                        { id: issue.id, status: e.target.value as IssueStatus },
                        {
                          onError: () => toast({ title: "Could not update issue", tone: "danger" }),
                        },
                      )
                    }
                  >
                    {ISSUE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="badge">{STATUS_LABEL[issue.status]}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function NewIssueForm({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState("");
  const create = useCreateIssue(projectId);
  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        create.mutate(title, { onSuccess: () => setTitle("") });
      }}
    >
      <Field>
        <Field.Label>New issue</Field.Label>
        <Field.Control>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field.Control>
      </Field>
      <Button type="submit" loading={create.isPending}>
        Add issue
      </Button>
    </form>
  );
}
