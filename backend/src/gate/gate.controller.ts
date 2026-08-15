import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { GateService } from './gate.service';
import { ValidateTicketDto } from './dto/validate-ticket.dto';

@Controller('gate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.GATE)
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Post('validate')
  validate(@Body() dto: ValidateTicketDto, @CurrentUser() user: JwtUser) {
    return this.gateService.validate(dto, user.userId);
  }
}
