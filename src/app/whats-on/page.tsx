import type { Metadata } from "next";
import EventProgrammePage from "@/components/EventProgrammePage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "What's On | Sweet1ne Live", description: "In-house live nights and ticketed events at Sweet1ne Live." };

export default function WhatsOnPage() { return <EventProgrammePage kind="in_house" />; }
