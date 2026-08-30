import LuxuryLoader from "@/components/LuxuryLoader";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LuxuryLoader variant="panel" label="One moment" />
    </div>
  );
}
