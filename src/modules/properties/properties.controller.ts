import { Controller, Get, Param, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async list(
    @Query('dateRange') dateRange?: string,
    @Query('search') search?: string,
    @Query('rating') rating?: string,
    @Query('category') category?: string,
    @Query('channel') channel?: string,
  ): Promise<any> {

    if (dateRange || rating || category || channel) {
      return this.propertiesService.getPropertiesForPage({
        dateRange,
        search,
        rating,
        categoryFilter: category,
        channelFilter: channel,
      });
    }

    // Fallback to basic list if no enhanced parameters
    return this.propertiesService.list({});
  }


  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('dateRange') dateRange?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
  ): Promise<any> {
    return this.propertiesService.getPropertyDetail(id, {
      dateRange,
      status,
      channel
    });
  }


}
