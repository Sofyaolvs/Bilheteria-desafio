import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateReservationDto {
  // Para eventos SEATED — ids dos assentos escolhidos no mapa
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  seatIds?: string[];

  // Para eventos GENERAL — quantidade de ingressos de pista
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
