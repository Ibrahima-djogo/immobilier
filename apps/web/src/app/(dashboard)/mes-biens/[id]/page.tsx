import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  await params;
  redirect("/proprietaire/biens");
}
