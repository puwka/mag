import { SubmissionDetail } from "@/components/admin/SubmissionDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminSubmissionDetailPage({ params }: Props) {
  const { id } = await params;
  return <SubmissionDetail submissionId={id} />;
}
