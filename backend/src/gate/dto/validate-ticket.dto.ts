import { IsOptional, IsString } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  eventId: string;

  // Preencha "code" (digitação manual) OU "qrPayload" (JSON lido da câmera).
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  qrPayload?: string;
}
