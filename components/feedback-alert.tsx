import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function FeedbackAlert({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  if (!success && !error) return null;
  return (
    <Alert variant={error ? "destructive" : "default"} className="mb-6">
      {error ? <AlertCircle /> : <CheckCircle2 />}
      <AlertDescription>{error ?? success}</AlertDescription>
    </Alert>
  );
}
