import type { Metadata } from "next";
import EventProgrammePage from "@/components/EventProgrammePage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events | Sweet1ne Live", description: "Sweet1ne events hosted at external venues, with clear location details." };

export default function EventsPage() { return <EventProgrammePage kind="external" />; }
