import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

interface PropertyListQuery {
  q?: string;
  city?: string;
  country?: string;
  channel?: string;
  minRating?: number;
  maxRating?: number;
  minStayNights?: number;
  maxStayNights?: number;
  category?: string;
  sort?: 'topRated' | 'mostReviews' | 'recent' | 'badShare';
  pageToken?: string;
  limit?: number;
  location?: string | string[];
  from?: string | string[];
  to?: string | string[];
}

@Injectable()
export class PropertiesService {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async list(query: PropertyListQuery) {
    const filters = await this.analyticsService.createFilters({
      location: query.location,
      from: query.from,
      to: query.to,
    });

    const limit = query.limit;
    const search = query.q?.trim();
    const city = query.city?.trim();
    const country = query.country?.trim();
    const channel = query.channel?.trim();
    const category = query.category?.trim();

    return this.analyticsService.getPropertyList({
      filters,
      search,
      city,
      country,
      channel,
      minRating: query.minRating,
      maxRating: query.maxRating,
      minStayNights: query.minStayNights,
      maxStayNights: query.maxStayNights,
      category,
      sort: query.sort,
      pageToken: query.pageToken,
      limit,
    });
  }

  create(createPropertyDto: CreatePropertyDto) {
    return 'This action adds a new property';
  }

  findAll() {
    return `This action returns all properties`;
  }

  findOne(id: number) {
    return `This action returns a #${id} property`;
  }

  update(id: number, updatePropertyDto: UpdatePropertyDto) {
    return `This action updates a #${id} property`;
  }

  remove(id: number) {
    return `This action removes a #${id} property`;
  }
}
