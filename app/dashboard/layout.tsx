import { Navbar } from "@/components/navbar";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen w-full bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
      <Navbar user={session?.user} />
      {children}
    </div>
  );
}
