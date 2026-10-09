import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateBeneficiaryDto } from "./dtos/create-beneficiary.dto";
import { CurrentUser } from "../../../shared/infrastructure/decorators/current-user.decorator";
import { UserDto } from "../../../shared/infrastructure/dto/user.dto";
import { CreateBeneficiaryCommand } from "../application/use-cases/create-beneficiary/create-beneficiary.command";
import { BeneficiaryResponseDto } from "./dtos/beneficiary-response.dto";
import { ListBeneficiariesQuery } from "../application/queries/list-beneficiaries/list-beneficiaries.query";
import { Beneficiary } from "../domain/entity/beneficiary.entity";
import { RemoveBeneficiaryCommand } from "../application/use-cases/remove-beneficiary/remove-beneficiary.command";


@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) { }

  /** POST /beneficiaries — 201 with the saved beneficiary (clients need its id). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateBeneficiaryDto,
    @CurrentUser() user: UserDto
  ): Promise<BeneficiaryResponseDto> {
    const beneficiary = await this.commandBus.execute<
      CreateBeneficiaryCommand,
      Beneficiary
    >(
      new CreateBeneficiaryCommand(
        user.sub,
        dto.accountNumber,
        dto.nickName
      )
    );

    return BeneficiaryResponseDto.fromDomain(beneficiary);
  }

  @Get()
  async listBeneficiaries(
    @CurrentUser() user: UserDto
  ): Promise<BeneficiaryResponseDto[]> {
    const beneficiaries = await this.queryBus.execute<ListBeneficiariesQuery, Beneficiary[]>(
      new ListBeneficiariesQuery(
        user.sub
      )
    )
    return beneficiaries.map((b) => BeneficiaryResponseDto.fromDomain(b));
  }

  /** No body to return — 204 says "done, nothing to read". */
  @Delete(":beneficiaryId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserDto,
    @Param("beneficiaryId", new ParseUUIDPipe()) beneficiaryId: string,
  ): Promise<void> {
    await this.commandBus.execute<RemoveBeneficiaryCommand>(
      new RemoveBeneficiaryCommand(
        beneficiaryId,
        user.sub,
      )
    )
  }
}
