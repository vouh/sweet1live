import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventTicketLayout from "@/components/EventTicketLayout";
import { getEvent } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return { title: "Event not found | Sweet1ne LIVE" };
  }

  return {
    title: `${event.title} | Sweet1ne LIVE`,
    description: event.description || event.subtitle,
  };
}

export default async function LiveEventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  return <EventTicketLayout event={event} />;
}
