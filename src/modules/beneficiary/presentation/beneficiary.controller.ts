import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { AuthGaurd } from "../../../shared/infrastructure/gaurds/auth.gaurd";
import { CreateBeneficiaryDto } from "./dtos/create-beneficiary.dto";
import { CurrentUser } from "../../../shared/infrastructure/decorators/current-user.decorator";
import { UserDto } from "../../../shared/infrastructure/dto/user.dto";
import { CreateBeneficiaryCommand } from "../application/use-cases/create-beneficiary/create-beneficiary.command";
import { BeneficiaryResponseDto } from "./dtos/beneficiary-response.dto";
import { ListBeneficiariesQuery } from "../application/queries/list-beneficiaries/list-beneficiaries.query";
import { Beneficiary } from "../domain/entity/beneficiary.entity";
import { RemoveBeneficiaryCommand } from "../application/use-cases/remove-beneficiary/remove-beneficiary.command";


@Controller('beneficiary')
export class BeneficiaryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) { }

  @Post()
  @UseGuards(AuthGaurd)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateBeneficiaryDto,
    @CurrentUser() user: UserDto
  ): Promise<void> {
    await this.commandBus.execute<CreateBeneficiaryCommand, void>(
      new CreateBeneficiaryCommand(
        user.sub,
        dto.accountNumber,
        dto.nickName
      )
    )
  }

  @Get()
  @UseGuards(AuthGaurd)
  @HttpCode(HttpStatus.OK)
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

  @Delete(":id")
  @UseGuards(AuthGaurd)
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: UserDto,
    @Param("id", new ParseUUIDPipe()) benefciaryId: string,
  ): Promise<void> {
    await this.commandBus.execute<RemoveBeneficiaryCommand>(
      new RemoveBeneficiaryCommand(
        benefciaryId,
        user.sub,
      )
    )
  }
}
