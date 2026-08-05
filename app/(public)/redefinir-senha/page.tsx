import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/modules/authentication/presentation/reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <ResetPasswordForm token={(await searchParams).token ?? ""} />;
}
