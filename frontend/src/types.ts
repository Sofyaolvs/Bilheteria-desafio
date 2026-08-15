export type UserRole = 'ORGANIZER' | 'CLIENT' | 'GATE';
export type TicketingMode = 'SEATED' | 'GENERAL';
export type EventCategory = 'SHOW' | 'FILME' | 'OUTRO';
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD';
export type ReservationStatus = 'PENDING_PAYMENT' | 'PAID' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';
export type GateResult = 'VALID' | 'INVALID' | 'ALREADY_USED' | 'WRONG_EVENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface EventItem {
  id: string;
  organizerId: string;
  externalSource: string;
  externalId: string | null;
  category: EventCategory;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  description: string | null;
  venueName: string;
  venueCity: string;
  venueAddress: string | null;
  startsAt: string;
  ticketingMode: TicketingMode;
  price: string;
  generalCapacity: number | null;
  generalAvailable: number | null;
  seatRows: number | null;
  seatsPerRow: number | null;
  published: boolean;
  createdAt: string;
}

export interface Seat {
  id: string;
  eventId: string;
  row: string;
  number: number;
  status: SeatStatus;
}

export interface Reservation {
  id: string;
  eventId: string;
  clientId: string;
  status: ReservationStatus;
  quantity: number | null;
  totalPrice: string;
  holdsExpireAt: string;
  event?: EventItem;
}

export interface Ticket {
  id: string;
  eventId: string;
  ownerId: string;
  seatId: string | null;
  code: string;
  shareToken: string;
  status: TicketStatus;
  usedAt: string | null;
  createdAt: string;
  event?: EventItem;
  seat?: Seat | null;
  qrCode?: string;
  shareUrl?: string;
}

export interface CatalogItem {
  externalId: string;
  source: 'ticketmaster' | 'local';
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  venueName: string;
  venueCity: string;
  suggestedDate: string | null;
  classification: string | null;
}
