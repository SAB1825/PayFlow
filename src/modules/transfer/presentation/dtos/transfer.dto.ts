import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  fromAccountNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  toAccountNumber: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}
