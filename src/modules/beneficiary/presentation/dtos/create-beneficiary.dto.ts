import { IsNotEmpty, IsString } from "class-validator";


export class CreateBeneficiaryDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  nickName: string;
}
