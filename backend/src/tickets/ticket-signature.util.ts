import * as crypto from 'crypto';

export interface TicketQrPayload {
  id: string;
  code: string;
  sig: string;
}

// Assina id+eventId+code com HMAC-SHA256. A assinatura viaja dentro do
// próprio QR (campo "sig"). Isso permite à portaria rejeitar um QR
// adulterado (id/código trocados) sem nem precisar consultar o banco — só
// depois disso ela confere se o ingresso está USED/CANCELLED/evento certo.
// (Não incluímos o ownerId na assinatura de propósito: o QR fica visível na
// tela do celular do cliente durante o compartilhamento, e evitamos colocar
// qualquer identificador de dono dentro do próprio código.)
export function signTicket(
  secret: string,
  params: { id: string; eventId: string; code: string },
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${params.id}|${params.eventId}|${params.code}`)
    .digest('hex');
}

export function verifyTicketSignature(
  secret: string,
  params: { id: string; eventId: string; code: string },
  signature: string,
): boolean {
  const expected = signTicket(secret, params);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || '');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateHumanCode(): string {
  // 10 caracteres, sem O/0/I/1 para evitar confusão na digitação manual.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return code;
}
