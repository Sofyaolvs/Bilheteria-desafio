import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('search')
  search(@Query('keyword') keyword?: string, @Query('city') city?: string) {
    return this.catalogService.search(keyword, city);
  }
}
