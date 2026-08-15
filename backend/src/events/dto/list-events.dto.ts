import { IsOptional, IsString } from 'class-validator';

export class ListEventsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD
}
