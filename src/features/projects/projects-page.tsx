import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Dialog, Field, Input, useToast } from "@smrafi/ui";
import { Can } from "@/features/auth";
import { formatDate } from "@/shared/lib/format";
import { ErrorState } from "@/shared/ui/error-state";
import { useCreateProject, useProjects } from "./queries";

export function ProjectsPage() {
  const { data, isPending, error, refetch } = useProjects();

  return (
    <section aria-labelledby="projects-heading">
      <header className="page-header">
        <h1 id="projects-heading">Projects</h1>
        <Can permission="project:create">
          <NewProjectDialog />
        </Can>
      </header>
      {isPending ? <p role="status">Loading projects…</p> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data ? (
        <ul className="cards">
          {data.map((project) => (
            <li key={project.id} className="card">
              <h2>
                <Link to={`/projects/${project.id}`}>{project.name}</Link>
              </h2>
              <p>{project.description}</p>
              <p className="muted">
                {project.openIssues} open · created {formatDate(project.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateProject();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const invalid = create.isError
    ? "Could not create the project."
    : submitted && name.trim() === ""
      ? "Name is required"
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>New project</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>New project</Dialog.Title>
        <Dialog.Description>Projects group related issues.</Dialog.Description>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            if (!name.trim()) return;
            create.mutate(
              { name, description: "" },
              {
                onSuccess: () => {
                  toast({ title: "Project created", tone: "success" });
                  setName("");
                  setSubmitted(false);
                  setOpen(false);
                },
              },
            );
          }}
        >
          <Field error={invalid} required>
            <Field.Label>Name</Field.Label>
            <Field.Control>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field.Control>
          </Field>
          <Button type="submit" loading={create.isPending}>
            Create
          </Button>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
