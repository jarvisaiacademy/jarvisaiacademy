import type { Metadata } from "next";

/**
 * The page beside this is a Client Component, so metadata needs a Server Component — the same
 * reason `src/app/admin/layout.tsx` exists.
 *
 * `canonical` is set per teacher because the root layout's `canonical: "/"` is inherited by any
 * route that does not override it, and one teacher's profile claiming to be the homepage is
 * worse than useless. Being a child of `/admin`, this inherits its `noindex` too.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Teacher",
    // Spelled out rather than inherited from `/admin`, so nothing about the dashboard's
    // discoverability depends on a metadata merge staying the way it is today.
    robots: { index: false, follow: false },
    alternates: { canonical: `/admin/teachers/${id}` },
  };
}

export default function AdminTeacherProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
