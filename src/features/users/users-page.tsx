import { ROLES, type Role } from "@/shared/lib/permissions";
import { ErrorState } from "@/shared/ui/error-state";
import { useUpdateRole, useUsers } from "./queries";

export function UsersPage() {
  const { data, isPending, error, refetch } = useUsers();
  const update = useUpdateRole();
  return (
    <section aria-labelledby="users-heading">
      <h1 id="users-heading">Users</h1>
      {isPending ? <p role="status">Loading users…</p> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data ? (
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id}>
                <th scope="row">{u.name}</th>
                <td>{u.email}</td>
                <td>
                  <label>
                    <span className="sr-only">Role for {u.name}</span>
                    <select
                      value={u.role}
                      onChange={(e) => update.mutate({ id: u.id, role: e.target.value as Role })}
                    >
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
