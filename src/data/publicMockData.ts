export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  eventCount: number;
}

export interface PublicEvent {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  language?: string;
  organizer: string;
  dateBadge: {
    month: string;
    day: string;
  };
  dateFull: string;
  timeRange: string;
  venue: string;
  city: string;
  country: string;
  price: string;
  isSoldOut?: boolean;
  isPopular?: boolean;
  imageTheme: string;
}

export const CATEGORIES: PublicCategory[] = [
  { id: 'c1', name: 'Concert', slug: 'concert', iconName: 'Music', eventCount: 54 },
  { id: 'c2', name: 'Festival', slug: 'festival', iconName: 'Sparkles', eventCount: 28 },
  { id: 'c3', name: 'BGM / Live', slug: 'bgm', iconName: 'Radio', eventCount: 19 },
  { id: 'c4', name: 'Conference', slug: 'conference', iconName: 'Presentation', eventCount: 32 },
  { id: 'c5', name: 'Workshop', slug: 'workshop', iconName: 'Briefcase', eventCount: 22 },
  { id: 'c6', name: 'Sports', slug: 'sports', iconName: 'Trophy', eventCount: 16 },
];

export const HERO_FEATURED_EVENT: PublicEvent = {
  id: 'hero-1',
  title: 'Primal Scream + The Jesus and Mary Chain',
  category: 'Concert',
  subCategory: 'BGM',
  language: 'English',
  organizer: 'Live Nation Indonesia',
  dateBadge: { month: 'Sep', day: '03' },
  dateFull: 'Wed, 03 Sep 2026',
  timeRange: '10:00 PM to 05:00 AM',
  venue: 'Crystal Palace Bowl, GBK Senayan',
  city: 'Jakarta',
  country: 'ID',
  price: 'Rp 150.000 - Rp 450.000',
  imageTheme: 'from-blue-600 via-blue-700 to-indigo-700',
};

export const POPULAR_EVENTS: PublicEvent[] = [
  {
    id: 'pop-1',
    title: 'Primal Scream + The Jesus and Mary Chain',
    category: 'Concert',
    organizer: 'Live Nation',
    dateBadge: { month: 'Sep', day: '03' },
    dateFull: '03 Sep 2026',
    timeRange: '22:00 WIB',
    venue: 'GBK Senayan',
    city: 'Jakarta',
    country: 'ID',
    price: 'Rp 150.000 - Rp 350.000',
    imageTheme: 'from-blue-600 via-blue-500 to-indigo-600',
  },
  {
    id: 'pop-2',
    title: 'Amicorum Soundwave Live',
    category: 'Festival',
    organizer: 'Amicorum Ent',
    dateBadge: { month: 'Sep', day: '03' },
    dateFull: '03 Sep 2026',
    timeRange: '18:00 WIB',
    venue: 'Town Center, BSD City',
    city: 'Tangerang',
    country: 'ID',
    price: 'Rp 209.900',
    imageTheme: 'from-sky-500 via-blue-600 to-indigo-700',
  },
  {
    id: 'pop-3',
    title: 'Tomorrowland Indonesia Experience',
    category: 'Festival',
    organizer: 'Tomorrowland World',
    dateBadge: { month: 'Sep', day: '03' },
    dateFull: '03 Sep 2026',
    timeRange: '15:00 WIB',
    venue: 'GWK Cultural Park',
    city: 'Badung',
    country: 'ID',
    price: 'Sold Out',
    isSoldOut: true,
    imageTheme: 'from-blue-500 via-indigo-600 to-blue-700',
  },
  {
    id: 'pop-4',
    title: 'Sunburning Music Fest',
    category: 'Concert',
    organizer: 'Sunburning ID',
    dateBadge: { month: 'Sep', day: '03' },
    dateFull: '03 Sep 2026',
    timeRange: '16:00 WIB',
    venue: 'Crystal Palace Bowl',
    city: 'Bandung',
    country: 'ID',
    price: 'Rp 350.000',
    imageTheme: 'from-blue-600 via-cyan-600 to-indigo-600',
  },
  {
    id: 'pop-5',
    title: 'Cosmos Symphony Night',
    category: 'Concert',
    organizer: 'Cosmos Orchestra',
    dateBadge: { month: 'Sep', day: '03' },
    dateFull: '03 Sep 2026',
    timeRange: '19:30 WIB',
    venue: 'JCC Plenary Hall',
    city: 'Jakarta',
    country: 'ID',
    price: 'Rp 350.000',
    imageTheme: 'from-sky-600 via-blue-600 to-indigo-800',
  },
  {
    id: 'pop-6',
    title: 'Nucleus Underground Rave',
    category: 'BGM',
    organizer: 'Nucleus Club',
    dateBadge: { month: 'Sep', day: '03' },
    dateFull: '03 Sep 2026',
    timeRange: '23:00 WIB',
    venue: 'Warehouse Stage',
    city: 'Surabaya',
    country: 'ID',
    price: 'Rp 350.000',
    imageTheme: 'from-indigo-600 via-blue-600 to-cyan-600',
  },
];

export const UPCOMING_EVENTS: PublicEvent[] = [
  {
    id: 'up-1',
    title: 'Jakarta Tech & AI Summit 2026',
    category: 'Conference',
    organizer: 'IndoTech Foundation',
    dateBadge: { month: 'Oct', day: '15' },
    dateFull: '15 Oct 2026',
    timeRange: '09:00 WIB',
    venue: 'Jakarta Convention Center (JCC)',
    city: 'Jakarta',
    country: 'ID',
    price: 'Rp 250.000',
    imageTheme: 'from-cyan-500 via-blue-600 to-indigo-600',
  },
  {
    id: 'up-2',
    title: 'UI/UX Design Masterclass 2026',
    category: 'Workshop',
    organizer: 'Designlab ID',
    dateBadge: { month: 'Oct', day: '28' },
    dateFull: '28 Oct 2026',
    timeRange: '10:00 WIB',
    venue: 'Co-Hive Auditorium',
    city: 'Jakarta',
    country: 'ID',
    price: 'Rp 150.000',
    imageTheme: 'from-blue-600 via-indigo-600 to-sky-600',
  },
  {
    id: 'up-3',
    title: 'Bandung Night Run Marathon',
    category: 'Sports',
    organizer: 'Runners ID',
    dateBadge: { month: 'Nov', day: '12' },
    dateFull: '12 Nov 2026',
    timeRange: '18:30 WIB',
    venue: 'Gedung Sate',
    city: 'Bandung',
    country: 'ID',
    price: 'Rp 200.000',
    imageTheme: 'from-blue-500 via-teal-600 to-indigo-600',
  },
];
