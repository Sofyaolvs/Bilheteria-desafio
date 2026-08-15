import { IsString, Length, Matches, MinLength } from 'class-validator';

export class PayReservationDto {
  @IsString()
  @MinLength(2)
  cardHolder: string;

  // Cartão de teste simulado. Regra de decisão (documentada no README):
  // números terminados em 0000 são recusados de propósito, para exercitar
  // o fluxo de recusa exigido no desafio; qualquer outro número é aprovado.
  @IsString()
  @Matches(/^[0-9\s]{13,19}$/)
  cardNumber: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)
  expiry: string;

  @IsString()
  @Length(3, 4)
  cvv: string;
}
