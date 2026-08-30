import { Suspense } from "react";
import LuxuryLoader from "@/components/LuxuryLoader";
import SetPasswordForm from "./SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-login min-h-screen flex items-center justify-center bg-[#e8e0d6] px-4">
          <LuxuryLoader variant="panel" label="Preparing your link" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
