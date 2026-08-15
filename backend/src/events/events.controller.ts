import { Body, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsDto } from './dto/list-events.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Público — navegação e busca (sem necessidade de login)
  @Get()
  list(@Query() filters: ListEventsDto) {
    return this.eventsService.listPublished(filters);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get('mine')
  listMine(@CurrentUser() user: JwtUser) {
    return this.eventsService.listMine(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOneOrFail(id);
  }

  @Get(':id/seats')
  seats(@Param('id') id: string) {
    return this.eventsService.findSeatsFor(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.userId, dto);
  }
}
