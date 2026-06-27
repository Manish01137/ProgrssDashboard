import { Nav } from "@/components/Nav";

// These pages are personalized (per-user Supabase data) — render on demand,
// never statically prerender at build time.
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4 sm:pb-10">
        {children}
      </main>
    </div>
  );
}
