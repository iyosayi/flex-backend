import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('recent')
  async getRecent(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('location') location?: string | string[],
    @Query('from') from?: string | string[],
    @Query('to') to?: string | string[],
  ) {
    const filters = await this.analyticsService.createFilters({ location, from, to });
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 20);

    return this.analyticsService.getRecentReviews({
      filters,
      page: pageNumber,
      limit: limitNumber,
    });
  }

  @Post()
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
