import { getConfections } from "./action";
import { ConfectionPageClient } from "./page-client";

export default async function ConfectionPage() {
  const branchList = await getConfections();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <ConfectionPageClient initialBranches={branchList} />
    </main>
  );
}
