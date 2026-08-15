export enum UserRole {
  ORGANIZER = 'ORGANIZER',
  CLIENT = 'CLIENT',
  GATE = 'GATE',
}

export enum TicketingMode {
  SEATED = 'SEATED', // mapa de assentos (cinema/teatro)
  GENERAL = 'GENERAL', // pista, por quantidade
}

export enum EventCategory {
  SHOW = 'SHOW',
  FILME = 'FILME',
  OUTRO = 'OUTRO',
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  SOLD = 'SOLD',
}

export enum ReservationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum TicketStatus {
  VALID = 'VALID',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}

export enum GateCheckResult {
  VALID = 'VALID',
  INVALID = 'INVALID',
  ALREADY_USED = 'ALREADY_USED',
  WRONG_EVENT = 'WRONG_EVENT',
}
