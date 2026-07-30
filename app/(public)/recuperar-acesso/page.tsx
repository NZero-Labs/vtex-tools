import type { Metadata } from "next";

import { RecoveryForm } from "@/modules/authentication/presentation/recovery-form";

export const metadata: Metadata = { title: "Recuperar acesso" };

export default function RecoveryPage() {
  return <RecoveryForm />;
}
