import { redirect } from "next/navigation";

export default async function CourseSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/cource/${slug}`);
}
