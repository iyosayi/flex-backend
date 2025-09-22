import { Controller, Get, Query } from '@nestjs/common';
import { OverviewService } from './overview.service';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  async getOverview(
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
    @Query('sections') sections?: string | string[],
  ) {
    return this.overviewService.getOverview({ location, from, to, sections });
  }
}
