import EventDetailClient from './EventDetailClient';

export async function generateStaticParams() {
  try {
    const res = await fetch('https://metix-backend.lufexa.id/api/v1/public/events', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const events = data?.data || data?.events || [];
      if (Array.isArray(events) && events.length > 0) {
        const params: { id: string }[] = [];
        events.forEach((evt: any) => {
          if (evt.id) params.push({ id: String(evt.id) });
          if (evt.slug) params.push({ id: String(evt.slug) });
        });
        if (params.length > 0) return params;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch events for generateStaticParams:', e);
  }

  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: 'ungu' },
    { id: 'sample' },
  ];
}

export default function PublicEventDetailPage() {
  return <EventDetailClient />;
}
