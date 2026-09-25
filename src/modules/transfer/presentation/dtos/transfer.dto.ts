import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

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
  @IsNotEmpty()
  amount: number;
}
