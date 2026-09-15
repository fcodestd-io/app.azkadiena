import { getAttributes } from "./action";
import { PageClient } from "./page-client";

export default async function AttributesPage() {
  const data = await getAttributes();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageClient initialData={data} />
    </main>
  );
}
