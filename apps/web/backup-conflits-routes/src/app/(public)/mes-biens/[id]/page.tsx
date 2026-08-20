import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function Page({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  redirect(`/proprietaire/biens/${resolvedParams.id}`);
}
