import EventDetailClient from './EventDetailClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: 'sample' },
  ];
}

export default function PublicEventDetailPage() {
  return <EventDetailClient />;
}
