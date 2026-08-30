import { redirect } from "next/navigation";

export default function PortalVenueHirePage() {
  redirect("/portal/enquiries?kind=venue");
}
