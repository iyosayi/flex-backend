import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('channel') channel?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('minStayNights') minStayNights?: string,
    @Query('maxStayNights') maxStayNights?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('pageToken') pageToken?: string,
    @Query('limit') limit = '20',
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const limitNumber = this.parseLimit(limit);

    return this.propertiesService.list({
      q,
      city,
      country,
      channel,
      minRating: this.parseNumber(minRating),
      maxRating: this.parseNumber(maxRating),
      minStayNights: this.parseNumber(minStayNights),
      maxStayNights: this.parseNumber(maxStayNights),
      category,
      sort: this.parseSort(sort),
      pageToken,
      limit: limitNumber,
      location,
      from,
      to,
    });
  }

  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(+id, updatePropertyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(+id);
  }

  private parseNumber(value?: string) {
    if (value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseLimit(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 20;
    }
    const normalized = Math.floor(parsed);
    if (normalized < 1) {
      return 1;
    }
    if (normalized > 50) {
      return 50;
    }
    return normalized;
  }

  private parseSort(value?: string): 'topRated' | 'mostReviews' | 'recent' | 'badShare' | undefined {
    if (!value) {
      return undefined;
    }
    switch (value.toLowerCase()) {
      case 'toprated':
        return 'topRated';
      case 'mostreviews':
        return 'mostReviews';
      case 'recent':
        return 'recent';
      case 'badshare':
        return 'badShare';
      default:
        return undefined;
    }
  }
}
