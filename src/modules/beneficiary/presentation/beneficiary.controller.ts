import { Controller, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { AuthGaurd } from "../../../shared/infrastructure/gaurds/auth.gaurd";
import { CreateBeneficiaryDto } from "./dtos/create-beneficiary.dto";
import { CurrentUser } from "../../../shared/infrastructure/decorators/current-user.decorator";
import { UserDto } from "../../../shared/infrastructure/dto/user.dto";
import { CreateBeneficiaryCommand } from "../application/use-cases/create-beneficiary/create-beneficiary.command";


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
    @Query() dto: CreateBeneficiaryDto,
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
}
