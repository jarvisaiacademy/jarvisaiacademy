import { redirect } from "next/navigation";

export default async function CourcesSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/cource/${slug}`);
}
