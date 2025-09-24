import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ReviewsService, ReviewsChartResponse, GuestMentionsResponse, ReviewPerformanceResponse } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get('hostaway')
  async getHostawayReviews(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('status') status?: string,
    @Query('channel') channel?: string,
  ) {
    // This endpoint simulates the Hostaway API response with normalized mock data
    // Fixed to specific property for backward compatibility
    return this.reviewsService.getDynamicReviews({
      page,
      limit,
      status,
      channel,
      propertyName: 'Deluxe 2 Bed Flat with Balcony in Hackney',
      defaultToPublishedOnly: true // Maintain backward compatibility
    });
  }

  @Get()
  async getReviews(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('propertyName') propertyName?: string,
  ) {
    // Dynamic endpoint that can filter by any property or return all reviews
    return this.reviewsService.getDynamicReviews({
      page,
      limit,
      status,
      channel,
      propertyName
    });
  }


  @Get('chart')
  async getReviewsChart(
    @Query('dateRange') dateRange = '14d',
    @Query('location') location?: string,
    @Query('period') period?: 'monthly' | 'weekly' | 'daily'
  ): Promise<ReviewsChartResponse> {
    return this.reviewsService.getReviewsChart({ 
      dateRange, 
      location, 
      period: period || 'monthly' 
    });
  }

  @Get('guest-mentions')
  async getGuestMentions(
    @Query('dateRange') dateRange = '14d',
    @Query('location') location?: string,
    @Query('category') category = 'Cleanliness'
  ): Promise<GuestMentionsResponse> {
    return this.reviewsService.getGuestMentions({
      dateRange,
      location,
      category
    });
  }

  @Get('performance')
  async getReviewPerformance(
    @Query('dateRange') dateRange = '14d',
    @Query('location') location?: string
  ): Promise<ReviewPerformanceResponse> {
    return this.reviewsService.getReviewPerformance({
      dateRange,
      location
    });
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'awaiting' | 'published' }
  ) {
    return this.reviewsService.updateStatus(id, body.status);
  }

}
