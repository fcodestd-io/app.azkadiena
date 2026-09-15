import { getUsers } from "./action";
import { UserClient } from "./page-client";

export default async function UsersPage() {
  const usersList = await getUsers();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <UserClient initialUsers={usersList} />
    </main>
  );
}
