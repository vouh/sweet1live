import LuxuryLoader from "@/components/LuxuryLoader";

/** Full-screen route transition loader — matches in-page AdminLoading styling. */
export default function AdminRouteLoading({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="admin-shell min-h-screen flex items-center justify-center px-4 py-12">
      <div className="admin-panel w-full max-w-lg overflow-hidden">
        <LuxuryLoader variant="panel" label={label} />
      </div>
    </div>
  );
}
