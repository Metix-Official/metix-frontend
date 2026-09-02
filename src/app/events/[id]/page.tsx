import EventDetailClient from './EventDetailClient';

export async function generateStaticParams() {
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
