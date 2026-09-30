/**
 * Utility functions for handling Ticket Types statuses (ACTIVE, INACTIVE, SOLD_OUT)
 * and calculating event starting prices ("Mulai Dari") across Metix.
 */

export interface EventTicketPricingResult {
  priceStr: string;
  isSoldOut: boolean;
  hasTickets: boolean;
  activeTicketsCount: number;
}

/**
 * Checks whether an individual ticket type is considered sold out.
 */
export function isTicketTypeSoldOut(t: any): boolean {
  if (!t) return false;
  const status = (t.status || 'ACTIVE').toUpperCase();
  if (status === 'SOLD_OUT') return true;
  if (status === 'INACTIVE') return false;

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
export function isTicketTypeActive(t: any): boolean {
  if (!t) return false;
  const status = (t.status || 'ACTIVE').toUpperCase();
  if (status !== 'ACTIVE') return false;
  return !isTicketTypeSoldOut(t);
}

/**
 * Computes the starting price ("Mulai Dari") and sold out status for an event.
 *
 * Rules:
 * 1. INACTIVE ticket types are completely ignored (hidden / excluded).
 * 2. If there are ACTIVE ticket types, "Mulai Dari" ALWAYS takes the lowest price among the ACTIVE tickets,
 *    even if a SOLD_OUT ticket has a lower price. The event is NOT sold out.
 * 3. Only if ALL valid ticket types are SOLD_OUT (or event is closed), the event is marked SOLD OUT,
 *    and the price is displayed with a strikethrough and a "Sold Out" indicator.
 */
export function computeEventPricing(
  ticketTypes?: any[] | null,
  eventStatus?: string
): EventTicketPricingResult {
  const isEventClosed = (eventStatus || '').toLowerCase() === 'closed';

  if (!ticketTypes || ticketTypes.length === 0) {
    return {
      priceStr: 'Coming Soon',
      isSoldOut: isEventClosed,
      hasTickets: false,
      activeTicketsCount: 0,
    };
  }

  // 1. Exclude INACTIVE tickets
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
    };
  }

  // 2. Separate into ACTIVE vs SOLD_OUT
  const activeTickets = validTickets.filter((t) => isTicketTypeActive(t));
  const soldOutTickets = validTickets.filter((t) => isTicketTypeSoldOut(t));

  // Case A: There are active tickets available
  if (activeTickets.length > 0 && !isEventClosed) {
    const activePrices = activeTickets
      .map((t) => Number(t.price))
      .filter((p) => !isNaN(p) && p >= 0);

    const minActivePrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
    const priceStr = minActivePrice === 0 ? 'Gratis' : `Rp ${minActivePrice.toLocaleString('id-ID')}`;

    return {
      priceStr,
      isSoldOut: false,
      hasTickets: true,
      activeTicketsCount: activeTickets.length,
    };
  }

  // Case B: All valid tickets are SOLD_OUT
  const soldOutPrices = (soldOutTickets.length > 0 ? soldOutTickets : validTickets)
    .map((t) => Number(t.price))
    .filter((p) => !isNaN(p) && p >= 0);

  const minSoldOutPrice = soldOutPrices.length > 0 ? Math.min(...soldOutPrices) : 0;
  const priceStr = minSoldOutPrice === 0 ? 'Gratis' : `Rp ${minSoldOutPrice.toLocaleString('id-ID')}`;

  return {
    priceStr,
    isSoldOut: true,
    hasTickets: true,
    activeTicketsCount: 0,
  };
}
