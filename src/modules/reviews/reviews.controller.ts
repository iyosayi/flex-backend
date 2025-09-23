import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

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
    const allReviews = this.reviewsService.findAll();
    
    // Filter by specific property name first
    const propertyName = 'Deluxe 2 Bed Flat with Balcony in Hackney';
    let filteredReviews = allReviews.filter(review => review.listingName === propertyName);
    
    // Apply status filter - default to only published reviews
    if (status && status !== 'all') {
      filteredReviews = filteredReviews.filter(review => review.status === status);
    } else {
      // Default to only published reviews if no status specified
      filteredReviews = filteredReviews.filter(review => review.status === 'published');
    }
    
    if (channel && channel !== 'all') {
      filteredReviews = filteredReviews.filter(review => 
        review.channel.toLowerCase() === channel.toLowerCase()
      );
    }
    
    // Sort by publishedAt timestamp for published reviews, or submittedAt for others
    filteredReviews.sort((a, b) => {
      if (a.status === 'published' && b.status === 'published') {
        const aTime = (a as any).publishedAt || a.submittedAt;
        const bTime = (b as any).publishedAt || b.submittedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime(); // Most recent first
      }
      // For non-published reviews, sort by submittedAt
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    // Calculate pagination
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Math.min(100, Number(limit) || 50)); // Max 100 items per page
    const offset = (pageNumber - 1) * limitNumber;
    const total = filteredReviews.length;
    const totalPages = Math.ceil(total / limitNumber);
    
    // Get paginated results
    const paginatedReviews = filteredReviews.slice(offset, offset + limitNumber);
    
    // Transform to match Hostaway API format
    const transformedReviews = paginatedReviews.map(review => ({
      id: review.id,
      type: 'guest-to-host',
      status: review.status,
      rating: parseFloat(review.rating.toFixed(2)),
      publicReview: review.publicReview,
      reviewCategory: review.reviewCategory.map((category) => ({
        category: category.category,
        rating: parseFloat((category.rating as number).toFixed(2))
      })),
      submittedAt: review.submittedAt,
      publishedAt: (review as any).publishedAt || null,
      guestName: review.guestName,
      listingName: review.listingName,
      channel: review.channel,
    }));

    // Return in standard API response format
    return {
      data: transformedReviews,
      meta: {
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages,
          hasNext: pageNumber < totalPages,
          hasPrev: pageNumber > 1,
        }
      }
    };
  }


  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'awaiting' | 'published' }
  ) {
    return this.reviewsService.updateStatus(id, body.status);
  }

}
