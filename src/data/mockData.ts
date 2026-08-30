export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
}

export interface StatMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
  iconName: string;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  customerName: string;
  customerEmail: string;
  eventName: string;
  ticketType: string;
  quantity: number;
  amount: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: string;
  status: 'Active' | 'Draft' | 'Completed' | 'Sold Out';
  badgeColor: string;
}

export const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' },
  { name: 'Events', href: '/dashboard', iconName: 'Calendar', badge: '12' },
  { name: 'Tickets', href: '/dashboard', iconName: 'Ticket' },
  { name: 'Transactions', href: '/dashboard', iconName: 'CreditCard' },
  { name: 'Check-in', href: '/dashboard', iconName: 'QrCode' },
  { name: 'Customers', href: '/dashboard', iconName: 'Users' },
  { name: 'Ticket Transfer', href: '/dashboard', iconName: 'Send' },
  { name: 'Settings', href: '/dashboard', iconName: 'Settings' },
];

export const MOCK_STATS: StatMetric[] = [
  {
    id: '1',
    title: 'Total Events',
    value: '24',
    change: '+14.2%',
    isPositive: true,
    period: 'vs last month',
    iconName: 'CalendarDays',
  },
  {
    id: '2',
    title: 'Total Tickets',
    value: '18,450',
    change: '+8.5%',
    isPositive: true,
    period: 'vs last month',
    iconName: 'Ticket',
  },
  {
    id: '3',
    title: 'Tickets Sold',
    value: '14,290',
    change: '+21.3%',
    isPositive: true,
    period: 'vs last month',
    iconName: 'TrendingUp',
  },
  {
    id: '4',
    title: 'Revenue',
    value: 'Rp 428.500.000',
    change: '+18.7%',
    isPositive: true,
    period: 'vs last month',
    iconName: 'DollarSign',
  },
];

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'EVT-001',
    title: 'Jakarta Tech Summit 2026',
    category: 'Technology',
    date: '15 Oct 2026',
    location: 'JCC Senayan, Jakarta',
    ticketsSold: 3200,
    totalTickets: 3500,
    revenue: 'Rp 160.000.000',
    status: 'Active',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  {
    id: 'EVT-002',
    title: 'Soundwave Music Festival',
    category: 'Concert',
    date: '02 Nov 2026',
    location: 'GBK Stadium, Jakarta',
    ticketsSold: 8500,
    totalTickets: 8500,
    revenue: 'Rp 212.500.000',
    status: 'Sold Out',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
  {
    id: 'EVT-003',
    title: 'Indonesia Creative Design Expo',
    category: 'Exhibition',
    date: '20 Dec 2026',
    location: 'ICE BSD, Tangerang',
    ticketsSold: 1450,
    totalTickets: 3000,
    revenue: 'Rp 36.250.000',
    status: 'Active',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  {
    id: 'EVT-004',
    title: 'Startup Founder Workshop #5',
    category: 'Workshop',
    date: '10 Jan 2027',
    location: 'Co-Hive Auditorium, Jakarta',
    ticketsSold: 0,
    totalTickets: 200,
    revenue: 'Rp 0',
    status: 'Draft',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-9021',
    invoiceId: 'INV-20260829-001',
    customerName: 'Budi Santoso',
    customerEmail: 'budi.santoso@gmail.com',
    eventName: 'Jakarta Tech Summit 2026',
    ticketType: 'VIP Pass',
    quantity: 2,
    amount: 'Rp 1.500.000',
    status: 'Completed',
    date: '29 Aug 2026, 17:42',
  },
  {
    id: 'TX-9020',
    invoiceId: 'INV-20260829-002',
    customerName: 'Siti Rahmawati',
    customerEmail: 'siti.rahma@yahoo.com',
    eventName: 'Soundwave Music Festival',
    ticketType: 'General Admission',
    quantity: 4,
    amount: 'Rp 1.000.000',
    status: 'Completed',
    date: '29 Aug 2026, 16:15',
  },
  {
    id: 'TX-9019',
    invoiceId: 'INV-20260829-003',
    customerName: 'Ahmad Rizky',
    customerEmail: 'ahmad.rizky@outlook.com',
    eventName: 'Jakarta Tech Summit 2026',
    ticketType: 'Regular Ticket',
    quantity: 1,
    amount: 'Rp 500.000',
    status: 'Pending',
    date: '29 Aug 2026, 15:30',
  },
  {
    id: 'TX-9018',
    invoiceId: 'INV-20260829-004',
    customerName: 'Dewi Lestari',
    customerEmail: 'dewi.lestari@gmail.com',
    eventName: 'Indonesia Creative Design Expo',
    ticketType: 'Day Pass',
    quantity: 3,
    amount: 'Rp 375.000',
    status: 'Completed',
    date: '29 Aug 2026, 14:05',
  },
  {
    id: 'TX-9017',
    invoiceId: 'INV-20260829-005',
    customerName: 'Reza Rahadian',
    customerEmail: 'reza.r@gmail.com',
    eventName: 'Soundwave Music Festival',
    ticketType: 'VIP Experience',
    quantity: 1,
    amount: 'Rp 1.250.000',
    status: 'Refunded',
    date: '28 Aug 2026, 21:10',
  },
];

export const CURRENT_USER = {
  name: 'Lutfi Fahri',
  email: 'lutfi@metix.id',
  role: 'Event Organizer',
  avatar: 'LF',
  organization: 'Metix Live Events',
};
