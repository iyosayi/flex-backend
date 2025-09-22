import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService, BucketGranularity } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('totals')
  async getTotals(
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const filters = await this.analyticsService.createFilters({ location, from, to });
    return this.analyticsService.getTotals(filters);
  }

  @Get('properties/top')
  async getTopProperties(
    @Query('kind') kind: 'good' | 'bad' = 'good',
    @Query('limit') limit?: string,
    @Query('minReviews') minReviews?: string,
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const filters = await this.analyticsService.createFilters({ location, from, to });
    const parsedLimit = Number(limit) || undefined;
    const parsedMinReviews = Number(minReviews) || undefined;
    const safeKind = kind === 'bad' ? 'bad' : 'good';

    return this.analyticsService.getTopProperties({
      filters,
      kind: safeKind,
      limit: parsedLimit ?? 5,
      minReviews: parsedMinReviews ?? 1,
    });
  }

  @Get('reviews/types')
  async getReviewTypes(
    @Query('bucket') bucket: string = 'month',
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const filters = await this.analyticsService.createFilters({ location, from, to });
    const granularity = this.ensureBucket(bucket);
    return this.analyticsService.getReviewTypes({ filters, bucket: granularity });
  }

  @Get('reviews/volume')
  async getReviewVolume(
    @Query('bucket') bucket: string = 'week',
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const filters = await this.analyticsService.createFilters({ location, from, to });
    const granularity = this.ensureBucket(bucket);
    return this.analyticsService.getReviewVolume({ filters, bucket: granularity });
  }

  @Get('stays/length')
  async getStayLength(
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const filters = await this.analyticsService.createFilters({ location, from, to });
    return this.analyticsService.getStayLengthDistribution(filters);
  }

  @Get('insights')
  async getInsights(
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const filters = await this.analyticsService.createFilters({ location, from, to });
    return this.analyticsService.getInsights(filters);
  }

  private ensureBucket(bucket: string): BucketGranularity {
    if (bucket === 'day' || bucket === 'week' || bucket === 'month') {
      return bucket;
    }
    return 'month';
  }
}
