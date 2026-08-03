import { PageHeader } from "@/components/authenticated/page-header";

export function AuditPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <PageHeader eyebrow={eyebrow} title={title} description={description} />;
}
