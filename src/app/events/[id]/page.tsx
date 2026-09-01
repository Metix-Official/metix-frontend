import EventDetailClient from './EventDetailClient';

export async function generateStaticParams() {
  try {
    const res = await fetch('https://metix-backend.lufexa.id/api/v1/public/events', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const events = data?.data || data?.events || [];
      if (Array.isArray(events) && events.length > 0) {
        return events.map((evt: any) => ({
          id: String(evt.id || evt.slug),
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to fetch events for generateStaticParams:', e);
  }

  return [
    { id: '1' },
    { id: 'sample' },
  ];
}

export const dynamicParams = true;

export default function PublicEventDetailPage() {
  return <EventDetailClient />;
}
