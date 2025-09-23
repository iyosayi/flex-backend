import { Controller, Get, Query } from '@nestjs/common';
import { OverviewService } from './overview.service';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  async getOverview(
    @Query('dateRange') dateRange?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.overviewService.getOverview({ 
      dateRange: dateRange || '14d', 
      location, 
      search 
    });
  }
}
