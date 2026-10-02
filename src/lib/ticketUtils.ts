/**
 * Utility functions for handling Ticket Types statuses (ACTIVE, INACTIVE, SOLD_OUT)
 * and calculating event starting prices ("Mulai Dari") across Metix.
 */

export type TicketSaleState = 'ON_SALE' | 'UPCOMING' | 'SALE_ENDED' | 'SOLD_OUT' | 'COMING_SOON';

export interface EventTicketPricingResult {
  priceStr: string;
  rawPrice?: number;
  isSoldOut: boolean;
  hasTickets: boolean;
  activeTicketsCount: number;
  saleState: TicketSaleState;
  targetCountdownDate?: Date | null;
  countdownType?: 'UPCOMING' | 'ENDING_SOON' | null;
  countdownString?: string | null;
  earliestSaleStartFormatted?: string | null;
}

/**
 * Checks schedule state for an individual ticket type based on current time.
 */
export function getTicketTypeScheduleState(t: any, now: Date = new Date()): {
  isUpcoming: boolean;
  isExpired: boolean;
  isWithinSalePeriod: boolean;
  startDate: Date | null;
  endDate: Date | null;
  timeLeftFormatted: string | null;
} {
  if (!t) {
    return { isUpcoming: false, isExpired: false, isWithinSalePeriod: true, startDate: null, endDate: null, timeLeftFormatted: null };
  }

  const startStr = t.sale_start_at || t.start_at || null;
  const endStr = t.sale_end_at || t.end_at || null;

  let startDate: Date | null = null;
  if (startStr) {
    const cleanStr = String(startStr).trim().replace(' ', 'T');
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) startDate = d;
  }

  let endDate: Date | null = null;
  if (endStr) {
    const cleanStr = String(endStr).trim().replace(' ', 'T');
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) endDate = d;
  }

  const isUpcoming = Boolean(startDate && now < startDate);
  const isExpired = Boolean(endDate && now > endDate);
  const isWithinSalePeriod = !isUpcoming && !isExpired;

  let timeLeftFormatted: string | null = null;
  if (isUpcoming && startDate) {
    const diff = startDate.getTime() - now.getTime();
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 0) {
        timeLeftFormatted = `${days}h ${hours}j ${minutes}m`;
      } else if (hours > 0) {
        timeLeftFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        timeLeftFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    }
  }

  return { isUpcoming, isExpired, isWithinSalePeriod, startDate, endDate, timeLeftFormatted };
}

/**
 * Calculates remaining time components between a target date and now.
 */
export function getCountdownTimeLeft(targetDate?: Date | null, now: Date = new Date()) {
  if (!targetDate) return null;
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalMs: diff };
}

/**
 * Formats countdown into a sleek, readable short string (e.g. "2h 14j 30m" or "14:30:15").
 */
export function formatCountdownString(timeLeft: { days: number; hours: number; minutes: number; seconds: number }) {
  const { days, hours, minutes, seconds } = timeLeft;
  if (days > 0) {
    return `${days}h ${hours}j ${minutes}m`;
  }
  if (hours > 0) {
    const padH = String(hours).padStart(2, '0');
    const padM = String(minutes).padStart(2, '0');
    const padS = String(seconds).padStart(2, '0');
    return `${padH}:${padM}:${padS}`;
  }
  const padM = String(minutes).padStart(2, '0');
  const padS = String(seconds).padStart(2, '0');
  return `${padM}:${padS}`;
}

/**
 * Checks whether an individual ticket type is considered sold out.
 * Automatically marks as Sold Out if available quota <= 0 OR sale_end_at has passed.
 */
export function isTicketTypeSoldOut(t: any, now: Date = new Date()): boolean {
  if (!t) return false;
  const status = (t.status || 'ACTIVE').toUpperCase();
  if (status === 'SOLD_OUT') return true;
  if (status === 'INACTIVE') return false;

  // If sale_end_at (Selesai Penjualan) has passed, ticket is officially Sold Out
  const endStr = t.sale_end_at || t.end_at || null;
  if (endStr) {
    const cleanStr = String(endStr).trim().replace(' ', 'T');
    const endDate = new Date(cleanStr);
    if (!isNaN(endDate.getTime()) && now > endDate) {
      return true;
    }
  }

  const available =
    t.available_quota !== undefined
      ? Number(t.available_quota)
      : t.available !== undefined
      ? Number(t.available)
      : t.quota !== undefined
      ? Number(t.quota) - Number(t.sold_quantity ?? t.sold_count ?? 0)
      : undefined;

  return available !== undefined && !isNaN(available) && available <= 0;
}

/**
 * Checks whether an individual ticket type is active and available for purchase.
 */
export function isTicketTypeActive(t: any, now: Date = new Date()): boolean {
  if (!t) return false;
  const status = (t.status || 'ACTIVE').toUpperCase();
  if (status !== 'ACTIVE') return false;
  return !isTicketTypeSoldOut(t, now);
}

/**
 * Computes the starting price ("Mulai Dari"), sale state (ON_SALE, UPCOMING, SALE_ENDED, SOLD_OUT),
 * and target countdown date for an event.
 */
export function computeEventPricing(
  ticketTypes?: any[] | null,
  eventStatus?: string,
  now: Date = new Date()
): EventTicketPricingResult {
  const isEventClosed = (eventStatus || '').toLowerCase() === 'closed';

  if (!ticketTypes || ticketTypes.length === 0) {
    return {
      priceStr: 'Coming Soon',
      isSoldOut: isEventClosed,
      hasTickets: false,
      activeTicketsCount: 0,
      saleState: isEventClosed ? 'SOLD_OUT' : 'COMING_SOON',
    };
  }

  // 1. Exclude INACTIVE tickets (hidden from public)
  const validTickets = ticketTypes.filter((t) => {
    const status = (t.status || 'ACTIVE').toUpperCase();
    return status !== 'INACTIVE';
  });

  if (validTickets.length === 0) {
    return {
      priceStr: 'Coming Soon',
      isSoldOut: isEventClosed,
      hasTickets: false,
      activeTicketsCount: 0,
      saleState: isEventClosed ? 'SOLD_OUT' : 'COMING_SOON',
    };
  }

  // 2. Classify tickets considering availability & schedule
  const onSaleTickets: any[] = [];
  const upcomingTickets: any[] = [];
  const soldOutTickets: any[] = [];

  validTickets.forEach((t) => {
    const isSoldOut = isTicketTypeSoldOut(t, now);
    const schedule = getTicketTypeScheduleState(t, now);

    if (isSoldOut || schedule.isExpired) {
      soldOutTickets.push({ ticket: t, schedule });
    } else if (schedule.isUpcoming) {
      upcomingTickets.push({ ticket: t, schedule });
    } else {
      // Currently within sale period & has available quota
      onSaleTickets.push({ ticket: t, schedule });
    }
  });

  // Helper to extract min price
  const getMinPrice = (arr: any[]) => {
    const prices = arr
      .map((item) => Number(item.ticket ? item.ticket.price : item.price))
      .filter((p) => !isNaN(p) && p >= 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const formatPrice = (p: number) => (p === 0 ? 'Gratis' : `Rp ${p.toLocaleString('id-ID')}`);

  // CASE 1: At least 1 ticket is CURRENTLY on sale (Active, in schedule, not sold out)
  if (onSaleTickets.length > 0 && !isEventClosed) {
    const minPrice = getMinPrice(onSaleTickets);

    // Check if any on-sale ticket has sale_end_at within the next 24 hours (FOMO urgency)
    const upcomingDeadlines = onSaleTickets
      .map((item) => item.schedule.endDate)
      .filter((d): d is Date => Boolean(d && d.getTime() > now.getTime() && d.getTime() - now.getTime() <= 24 * 60 * 60 * 1000))
      .sort((a, b) => a.getTime() - b.getTime());

    const nearestEndingDate = upcomingDeadlines[0] || null;
    let cdStr: string | null = null;
    if (nearestEndingDate) {
      const tl = getCountdownTimeLeft(nearestEndingDate, now);
      if (tl) cdStr = formatCountdownString(tl);
    }

    return {
      priceStr: formatPrice(minPrice),
      rawPrice: minPrice,
      isSoldOut: false,
      hasTickets: true,
      activeTicketsCount: onSaleTickets.length,
      saleState: 'ON_SALE',
      targetCountdownDate: nearestEndingDate,
      countdownType: nearestEndingDate ? 'ENDING_SOON' : null,
      countdownString: cdStr,
    };
  }

  // CASE 2: No tickets currently on sale, BUT there are UPCOMING tickets (Future sale start)
  if (upcomingTickets.length > 0 && !isEventClosed) {
    const minUpcomingPrice = getMinPrice(upcomingTickets);

    // Find the earliest start date among upcoming tickets
    const sortedUpcomingDates = upcomingTickets
      .map((item) => item.schedule.startDate)
      .filter((d): d is Date => Boolean(d && d.getTime() > now.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const earliestStart = sortedUpcomingDates[0] || null;
    let earliestFormatted: string | null = null;
    let cdStr: string | null = null;
    if (earliestStart) {
      earliestFormatted = earliestStart.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const tl = getCountdownTimeLeft(earliestStart, now);
      if (tl) cdStr = formatCountdownString(tl);
    }

    return {
      priceStr: formatPrice(minUpcomingPrice),
      rawPrice: minUpcomingPrice,
      isSoldOut: false,
      hasTickets: true,
      activeTicketsCount: 0,
      saleState: 'UPCOMING',
      targetCountdownDate: earliestStart,
      countdownType: 'UPCOMING',
      countdownString: cdStr,
      earliestSaleStartFormatted: earliestFormatted,
    };
  }

  // CASE 3: All tickets are SOLD OUT (quota reached 0 or sale_end_at has passed)
  if (soldOutTickets.length > 0 && validTickets.every((t) => isTicketTypeSoldOut(t, now))) {
    const minSoldOutPrice = getMinPrice(soldOutTickets);
    return {
      priceStr: formatPrice(minSoldOutPrice),
      rawPrice: minSoldOutPrice,
      isSoldOut: true,
      hasTickets: true,
      activeTicketsCount: 0,
      saleState: 'SOLD_OUT',
    };
  }

  // Fallback (if event is closed or all valid tickets are sold out)
  if (isEventClosed || (soldOutTickets.length > 0 && soldOutTickets.length === validTickets.length)) {
    const minSoldOutPrice = soldOutTickets.length > 0 ? getMinPrice(soldOutTickets) : 0;
    return {
      priceStr: minSoldOutPrice > 0 ? formatPrice(minSoldOutPrice) : 'Sold Out',
      rawPrice: minSoldOutPrice,
      isSoldOut: true,
      hasTickets: validTickets.length > 0,
      activeTicketsCount: 0,
      saleState: 'SOLD_OUT',
    };
  }

  // Fallback
  return {
    priceStr: 'Coming Soon',
    isSoldOut: isEventClosed,
    hasTickets: false,
    activeTicketsCount: 0,
    saleState: isEventClosed ? 'SOLD_OUT' : 'COMING_SOON',
  };
}
