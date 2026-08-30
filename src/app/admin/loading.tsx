import LuxuryLoader from "@/components/LuxuryLoader";

export default function AdminLoading() {
  return (
    <div className="admin-login min-h-screen flex items-center justify-center bg-[#e8e0d6] px-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl shadow-xl">
        <LuxuryLoader variant="panel" label="Opening the staff entrance" />
      </div>
    </div>
  );
}
