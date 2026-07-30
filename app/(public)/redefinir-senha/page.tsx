import type { Metadata } from "next";

import { ResetPasswordForm } from "@/modules/authentication/presentation/reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <ResetPasswordForm token={(await searchParams).token ?? ""} />;
}
