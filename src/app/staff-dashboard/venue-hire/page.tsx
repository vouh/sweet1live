import { redirect } from "next/navigation";

/** Private hire is enquiry-only — legacy route forwards to the inbox. */
export default function AdminVenueHirePage() {
  redirect("/staff-dashboard/enquiries?kind=venue");
}
