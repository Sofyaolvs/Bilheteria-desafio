import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EventCategory, TicketingMode } from '../../common/enums';

export class CreateEventDto {
  // Referência ao item do catálogo externo que originou o evento (opcional
  // porque o organizador também pode digitar os dados manualmente).
  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsIn(['ticketmaster', 'local', 'manual'])
  externalSource?: string;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(2)
  venueName: string;

  @IsString()
  @MinLength(2)
  venueCity: string;

  @IsOptional()
  @IsString()
  venueAddress?: string;

  @IsDateString()
  startsAt: string;

  @IsEnum(TicketingMode)
  ticketingMode: TicketingMode;

  @IsNumberString()
  price: string;

  // Obrigatório apenas quando ticketingMode = GENERAL
  @IsOptional()
  @IsInt()
  @Min(1)
  generalCapacity?: number;

  // Obrigatórios apenas quando ticketingMode = SEATED
  @IsOptional()
  @IsInt()
  @Min(1)
  seatRows?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  seatsPerRow?: number;
}
