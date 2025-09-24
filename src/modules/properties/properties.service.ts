import { Injectable, NotFoundException } from '@nestjs/common';
import { mockProperties } from './mock/mock-properties';
import * as fs from 'fs';
import * as path from 'path';

interface PropertyListQuery {
  // Simplified parameters for enhanced properties page
  dateRange?: string;
  search?: string;
  rating?: string;
  categoryFilter?: string;
  channelFilter?: string;
}

interface WorthyMention {
  category: string;
  rating: string;
}

interface PropertyResponse {
  id: string;
  imageUrl: string;
  name: string;
  location: string;
  badge: string | null;
  totalReviews: number;
  worthyMentions: WorthyMention[];
  goodReviewsPercentage: number;
  badReviewsPercentage: number;
}

interface PropertiesApiResponse {
  data: PropertyResponse[];
  metadata: {
    totalProperties: number;
    filteredBy: string;
    availableFilters: {
      locations: string[];
      ratingRanges: string[];
      channels: string[];
      lengthOfStay: string[];
      categories: string[];
    };
  };
}

interface TopComponent {
  name: string;
  percentage: number;
  description: string;
}

interface FrequentComplaint {
  name: string;
  mentions: number;
  trend: string;
  trendValue: number;
}

interface CategoryRating {
  category: string;
  rating: string;
}

interface AverageRatingDetails {
  overallRating: string;
  changeVsLastMonth: string;
  basedOnReviews: number;
  categoryRatings: CategoryRating[];
}

interface RatingHealth {
  period: string;
  positiveReviews: {
    description: string;
    percentage: number;
    trend: string;
  };
  neutralReviews: {
    description: string;
    percentage: number;
    trend: string;
  };
  negativeReviews: {
    description: string;
    percentage: number;
    trend: string;
  };
}

interface RecentReview {
  id: number;
  guestName: string;
  timeAgo: string;
  channel: string;
  stayDuration: string;
  reviewTitle: string;
  reviewText: string;
  rating: number;
  categoryRatings: CategoryRating[];
  status: string;
}

interface PropertyDetailResponse {
  id: string;
  name: string;
  location: string;
  description: string;
  mainImageUrl: string;
  galleryImages: string[];
  badge: string | null;
  averageRating: string;
  totalReviews: number;
  guestCapacity: number;
  propertyType: string;
  selfCheckInAvailable: boolean;
  worthyMentions: WorthyMention[];
  topComponents: TopComponent[];
  frequentComplaints: FrequentComplaint[];
  averageRatingDetails: AverageRatingDetails;
  ratingHealth: RatingHealth;
  recentReviews: RecentReview[];
}

@Injectable()
export class PropertiesService {
  private staticReviews: any[] = [];

  constructor() {
    this.loadStaticReviews();
  }

  private loadStaticReviews() {
    try {
      const staticReviewsFile = path.join(process.cwd(), 'data', 'static-reviews.json');
      if (fs.existsSync(staticReviewsFile)) {
        const data = fs.readFileSync(staticReviewsFile, 'utf8');
        this.staticReviews = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load static reviews in properties service:', error);
      this.staticReviews = [];
    }
  }

  private getLatestReviews() {
    // Load fresh static reviews and apply status changes
    this.loadStaticReviews();
    this.applyStatusChanges();
    return this.staticReviews;
  }

  private applyStatusChanges() {
    try {
      const statusChangesFile = path.join(process.cwd(), 'data', 'review-status-changes.json');
      if (fs.existsSync(statusChangesFile)) {
        const data = JSON.parse(fs.readFileSync(statusChangesFile, 'utf8'));
        
        // Apply status changes to static reviews
        Object.entries(data).forEach(([id, change]) => {
          const reviewId = parseInt(id);
          const review = this.staticReviews.find(r => r.id === reviewId);
          if (review) {
            if (typeof change === 'string') {
              // Old format: just status string
              review.status = change;
            } else {
              // New format: object with status and timestamp
              const statusChange = change as { status: string; timestamp: string };
              review.status = statusChange.status;
              if (statusChange.status === 'published') {
                (review as any).publishedAt = statusChange.timestamp;
              } else {
                delete (review as any).publishedAt;
              }
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to apply status changes in properties service:', error);
    }
  }

  // New enhanced method for properties page
  async getPropertiesForPage(query: PropertyListQuery): Promise<PropertiesApiResponse> {
    const dateRange = this.parseDateRange(query.dateRange || '7d');
    const latestReviews = this.getLatestReviews();
    const filteredReviews = this.filterReviewsByDateRange(latestReviews, dateRange);
    
    // Apply filters to properties
    let filteredProperties = [...mockProperties];
    
    // Apply search filter
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredProperties = filteredProperties.filter(property =>
        property.name.toLowerCase().includes(searchTerm) ||
        property.city.toLowerCase().includes(searchTerm) ||
        property.country.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply rating filter (single star value)
    if (query.rating && query.rating !== 'all') {
      const targetRating = parseFloat(query.rating);
      filteredProperties = filteredProperties.filter(property =>
        Math.floor(property.avgRating) === targetRating
      );
    }
    
    // Apply category filter
    if (query.categoryFilter && query.categoryFilter !== 'all') {
      filteredProperties = filteredProperties.filter(property =>
        property.reviewCategory.some(cat => 
          cat.category === query.categoryFilter && cat.score >= 4.0
        )
      );
    }
    
    // Apply channel filter
    if (query.channelFilter && query.channelFilter !== 'all') {
      filteredProperties = filteredProperties.filter(property =>
        property.channels.some(ch => 
          ch.channel.toLowerCase() === query.channelFilter?.toLowerCase()
        )
      );
    }
    
    // Transform properties to the new format
    const transformedProperties = filteredProperties.map(property => 
      this.transformPropertyToResponse(property, filteredReviews)
    );
    
    // Get available filter options
    const availableFilters = this.getAvailableFilters();
    
    return {
      data: transformedProperties,
      metadata: {
        totalProperties: transformedProperties.length,
        filteredBy: this.getFilteredByText(query.dateRange || '7d'),
        availableFilters
      }
    };
  }

  async list(query: PropertyListQuery = {}) {
    // Simple list method that returns all properties
    // This is used as a fallback when no enhanced parameters are provided
    return {
      data: mockProperties,
      meta: {
        total: mockProperties.length,
        sort: 'topRated',
        appliedFilters: {},
      },
      cursor: {
        nextPageToken: null,
        limit: 20,
      },
    };
  }


  findAll() {
    return mockProperties;
  }

  async findOne(id: string) {
    const property = mockProperties.find(p => p.id === id);
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }
    return property;
  }

  // Enhanced method for property detail page
  async getPropertyDetail(
    id: string, 
    filters?: {
      dateRange?: string;
      status?: string;
      channel?: string;
    }
  ): Promise<PropertyDetailResponse> {
    const property = mockProperties.find(p => p.id === id);
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    // Get reviews for this property with optional filtering
    const dateRange = this.parseDateRange(filters?.dateRange || '30d');
    const latestReviews = this.getLatestReviews();
    let propertyReviews = latestReviews.filter(review => review.listingName === property.name);

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      propertyReviews = propertyReviews.filter(review => review.status === filters.status);
    }

    // Apply channel filter
    if (filters?.channel && filters.channel !== 'all') {
      propertyReviews = propertyReviews.filter(review => 
        review.channel.toLowerCase() === filters.channel.toLowerCase()
      );
    }

    // Apply date range filter
    propertyReviews = this.filterReviewsByDateRange(propertyReviews, dateRange);

    // Get all reviews for this property (for calculations) - without filters
    const allPropertyReviews = latestReviews.filter(review => review.listingName === property.name);

    return {
      id: property.id,
      name: property.name,
      location: `${property.city}, ${property.country}`,
      description: this.generatePropertyDescription(property),
      mainImageUrl: property.imageUrl,
      galleryImages: this.generateGalleryImages(property),
      badge: this.determineBadge(property),
      averageRating: property.avgRating.toFixed(1),
      totalReviews: property.totalReviews,
      guestCapacity: this.getGuestCapacity(property),
      propertyType: this.getPropertyType(property),
      selfCheckInAvailable: this.getSelfCheckInAvailability(property),
      worthyMentions: this.mapWorthyMentions(property.reviewCategory),
      topComponents: this.generateTopComponents(property, allPropertyReviews),
      frequentComplaints: this.generateFrequentComplaints(property, allPropertyReviews),
      averageRatingDetails: this.generateAverageRatingDetails(property, allPropertyReviews),
      ratingHealth: this.generateRatingHealth(property, allPropertyReviews),
      recentReviews: this.generateRecentReviews(propertyReviews)
    };
  }


  // Helper methods for the enhanced properties API
  private parseDateRange(dateRange: string): { start: Date; end: Date } {
    const today = new Date('2025-09-22');
    const end = new Date(today);
    let start = new Date(today);

    switch (dateRange) {
      case '7d':
        start.setDate(today.getDate() - 7);
        break;
      case '14d':
        start.setDate(today.getDate() - 14);
        break;
      case '30d':
        start.setDate(today.getDate() - 30);
        break;
      case '90d':
        start.setDate(today.getDate() - 90);
        break;
      case '1y':
        start.setDate(today.getDate() - 365);
        break;
      default:
        start.setDate(today.getDate() - 7);
    }

    return { start, end };
  }

  private filterReviewsByDateRange(reviews: any[], dateRange: { start: Date; end: Date }): any[] {
    return reviews.filter(review => {
      const reviewDate = new Date(review.submittedAt);
      return reviewDate >= dateRange.start && reviewDate <= dateRange.end;
    });
  }

  private transformPropertyToResponse(property: any, reviews: any[]): PropertyResponse {
    const badge = this.determineBadge(property);
    const worthyMentions = this.mapWorthyMentions(property.reviewCategory);
    const reviewStats = this.calculateReviewStats(property, reviews);

    return {
      id: property.id,
      imageUrl: property.imageUrl,
      name: property.name,
      location: `${property.city}, ${property.country}`,
      badge,
      totalReviews: property.totalReviews,
      worthyMentions,
      goodReviewsPercentage: reviewStats.goodPercentage,
      badReviewsPercentage: reviewStats.badPercentage
    };
  }

  private determineBadge(property: any): string | null {
    // "Top rated" - Properties with high average ratings and many reviews
    if (property.avgRating >= 4.5 && property.totalReviews >= 1000) {
      return 'Top rated';
    }
    
    // "Guest favorite" - Properties with good ratings, many reviews, and high good share
    if (property.avgRating >= 4.3 && property.totalReviews >= 800 && property.goodShare >= 85) {
      return 'Guest favorite';
    }
    
    // "Great for families" - Properties with longer average stays and good space/comfort ratings
    if (property.avgRating >= 4.0 && property.staySummary.averageNights >= 4) {
      const hasFamilyFriendlyCategories = property.reviewCategory.some((cat: any) => 
        ['space', 'comfort', 'amenities'].includes(cat.category) && cat.score >= 4.5
      );
      if (hasFamilyFriendlyCategories) {
        return 'Great for families';
      }
    }
    
    return null;
  }

  private mapWorthyMentions(reviewCategory: any[]): WorthyMention[] {
    const categoryMapping: Record<string, string> = {
      'cleanliness': 'Cleanliness',
      'location': 'Good location',
      'service': 'Service',
      'communication': 'Communication',
      'value': 'Value for money',
      'check-in': 'Check-in',
      'amenities': 'Amenities',
      'space': 'Space',
      'comfort': 'Comfort'
    };

    return reviewCategory
      .sort((a, b) => b.score - a.score) // Sort by highest score first
      .slice(0, 3) // Take top 3
      .map(cat => ({
        category: categoryMapping[cat.category] || cat.category,
        rating: cat.score.toFixed(1)
      }));
  }

  private calculateReviewStats(property: any, reviews: any[]): { goodPercentage: number; badPercentage: number } {
    // Use the property's existing goodShare and badShare from mock data
    // In a real implementation, you'd calculate this from the filtered reviews
    return {
      goodPercentage: Math.round(property.goodShare),
      badPercentage: Math.round(property.badShare)
    };
  }


  private getAvailableFilters() {
    return {
      locations: ['London', 'Paris', 'Zurich', 'Marrakesh', 'Algiers'],
      ratingRanges: ['4.0-5.0', '3.0-4.0', '2.0-3.0', '1.0-2.0'],
      channels: ['Airbnb', 'booking.com', 'homeaway', 'expedia', 'marriott'],
      lengthOfStay: ['1-3 days', '4-7 days', '8-14 days', '15+ days'],
      categories: ['cleanliness', 'communication', 'respect_house_rules', 'check-in', 'amenities', 'location', 'service', 'space', 'comfort']
    };
  }

  private getFilteredByText(dateRange: string): string {
    switch (dateRange) {
      case '7d': return 'Last 7 days';
      case '14d': return 'Last 14 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last 1 year';
      default: return 'Last 7 days';
    }
  }

  // Helper methods for property detail page
  private generatePropertyDescription(property: any): string {
    const descriptions = {
      'Louvre Loft': 'This thoughtfully designed apartment places you moments from the Louvre Museum. Guests love the open plan living space, calming bedroom and light-filled interiors that make longer stays comfortable.',
      'Seine Retreat': 'This beautifully appointed retreat offers stunning views of the Seine River. The modern amenities and prime location make it perfect for both business and leisure travelers.',
      'Atlas Comfort Suites': 'Located in the heart of Marrakesh, this comfortable suite provides easy access to the vibrant souks and historic medina. Perfect for exploring the rich culture of Morocco.',
      'Lakeview Chalet': 'Nestled by the pristine Lake Zurich, this charming chalet offers breathtaking mountain views and modern comforts. Ideal for nature lovers and those seeking tranquility.',
      'Tower Bridge View': 'Experience London from this modern apartment with spectacular views of the iconic Tower Bridge. The central location provides easy access to all major attractions.',
      'Casbah Palace': 'Immerse yourself in the authentic atmosphere of Algiers in this historic palace-style accommodation. Rich in character and perfectly located for cultural exploration.',
      'Champs Elysees Suite': 'Luxury meets convenience in this elegant suite on the famous Champs-Elysees. High-end amenities and world-class shopping at your doorstep.',
      'Riverside Apartment': 'Enjoy the peaceful riverside setting while being just minutes from London\'s bustling center. This modern apartment offers the perfect balance of tranquility and accessibility.'
    };
    return descriptions[property.name] || 'A thoughtfully designed property that offers comfort and convenience for your stay.';
  }

  private generateGalleryImages(property: any): string[] {
    // Generate 3 additional gallery images based on the main image
    const baseUrl = property.imageUrl.split('?')[0];
    return [
      property.imageUrl,
      `${baseUrl}?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `${baseUrl}?w=800&h=600&fit=crop&crop=top&auto=format&q=80`
    ];
  }

  private getGuestCapacity(property: any): number {
    // Determine guest capacity based on property name
    const capacityMap = {
      'Louvre Loft': 2,
      'Seine Retreat': 4,
      'Atlas Comfort Suites': 3,
      'Lakeview Chalet': 6,
      'Tower Bridge View': 2,
      'Casbah Palace': 4,
      'Champs Elysees Suite': 2,
      'Riverside Apartment': 3
    };
    return capacityMap[property.name] || 2;
  }

  private getPropertyType(property: any): string {
    const typeMap = {
      'Louvre Loft': 'Entire apartment',
      'Seine Retreat': 'Entire apartment',
      'Atlas Comfort Suites': 'Hotel suite',
      'Lakeview Chalet': 'Entire chalet',
      'Tower Bridge View': 'Entire apartment',
      'Casbah Palace': 'Hotel room',
      'Champs Elysees Suite': 'Entire apartment',
      'Riverside Apartment': 'Entire apartment'
    };
    return typeMap[property.name] || 'Entire apartment';
  }

  private getSelfCheckInAvailability(property: any): boolean {
    // Most properties have self check-in available
    return Math.random() > 0.3; // 70% chance of self check-in
  }

  private generateTopComponents(property: any, reviews: any[]): TopComponent[] {
    const components = [
      {
        name: 'Seamless check-in',
        percentage: 82,
        description: 'Guests love the easy self check-in process'
      },
      {
        name: 'Comfortable beds',
        percentage: 74,
        description: 'Highlighted in 65% of 5 star reviews'
      },
      {
        name: 'Thoughtful amenities',
        percentage: 68,
        description: 'Coffee machine, fast Wi-Fi and workspace'
      },
      {
        name: 'Responsive host',
        percentage: 64,
        description: 'Guests mention quick replies within minutes'
      }
    ];
    
    // Sort by percentage and return top 4
    return components.sort((a, b) => b.percentage - a.percentage).slice(0, 4);
  }

  private generateFrequentComplaints(property: any, reviews: any[]): FrequentComplaint[] {
    const complaints = [
      {
        name: 'Street noise late at night',
        mentions: 6,
        trend: '-3 vs last month',
        trendValue: -3
      },
      {
        name: 'Hot water pressure',
        mentions: 4,
        trend: 'Stable',
        trendValue: 0
      },
      {
        name: 'Parking availability',
        mentions: 3,
        trend: '+1 vs last month',
        trendValue: 1
      }
    ];
    
    // Filter out complaints with 0 mentions and return top 3
    return complaints.filter(c => c.mentions > 0).slice(0, 3);
  }

  private generateAverageRatingDetails(property: any, reviews: any[]): AverageRatingDetails {
    const changeVsLastMonth = (Math.random() * 0.8 - 0.4).toFixed(1); // Random change between -0.4 and +0.4
    const sign = parseFloat(changeVsLastMonth) >= 0 ? '+' : '';
    
    return {
      overallRating: property.avgRating.toFixed(1),
      changeVsLastMonth: `${sign}${changeVsLastMonth}`,
      basedOnReviews: property.totalReviews,
      categoryRatings: this.mapWorthyMentions(property.reviewCategory)
    };
  }

  private generateRatingHealth(property: any, reviews: any[]): RatingHealth {
    // Calculate rating health from actual reviews
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        period: 'This quarter',
        positiveReviews: {
          description: 'Guests loved their stay',
          percentage: 0,
          trend: 'neutral'
        },
        neutralReviews: {
          description: 'Mentions of minor issues',
          percentage: 0,
          trend: 'neutral'
        },
        negativeReviews: {
          description: 'Requires host follow-up',
          percentage: 0,
          trend: 'neutral'
        }
      };
    }

    // Count reviews by rating ranges
    const positiveCount = reviews.filter(r => r.rating >= 4.0).length;
    const neutralCount = reviews.filter(r => r.rating >= 2.5 && r.rating < 4.0).length;
    const negativeCount = reviews.filter(r => r.rating < 2.5).length;

    // Calculate percentages
    const positivePercentage = Math.round((positiveCount / totalReviews) * 100);
    const neutralPercentage = Math.round((neutralCount / totalReviews) * 100);
    const negativePercentage = Math.round((negativeCount / totalReviews) * 100);

    // Ensure percentages add up to 100% (adjust for rounding)
    const totalPercentage = positivePercentage + neutralPercentage + negativePercentage;
    const adjustment = 100 - totalPercentage;
    
    // Apply adjustment to the largest category
    let adjustedPositive = positivePercentage;
    let adjustedNeutral = neutralPercentage;
    let adjustedNegative = negativePercentage;
    
    if (adjustment !== 0) {
      if (positivePercentage >= neutralPercentage && positivePercentage >= negativePercentage) {
        adjustedPositive += adjustment;
      } else if (neutralPercentage >= negativePercentage) {
        adjustedNeutral += adjustment;
      } else {
        adjustedNegative += adjustment;
      }
    }

    return {
      period: 'This quarter',
      positiveReviews: {
        description: 'Guests loved their stay',
        percentage: adjustedPositive,
        trend: 'up'
      },
      neutralReviews: {
        description: 'Mentions of minor issues',
        percentage: adjustedNeutral,
        trend: 'neutral'
      },
      negativeReviews: {
        description: 'Requires host follow-up',
        percentage: adjustedNegative,
        trend: 'down'
      }
    };
  }

  private generateRecentReviews(reviews: any[]): RecentReview[] {
    return reviews
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
      .map(review => {
        const daysAgo = Math.floor((new Date('2025-09-22').getTime() - new Date(review.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        const stayDuration = Math.floor(Math.random() * 20) + 1;
        
        return {
          id: review.id,
          guestName: review.guestName,
          timeAgo: daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`,
          channel: review.channel,
          stayDuration: `${stayDuration} day stay`,
          reviewTitle: this.generateReviewTitle(review.rating),
          reviewText: review.publicReview,
          rating: review.rating,
          categoryRatings: review.reviewCategory.map((cat: any) => ({
            category: this.mapCategoryName(cat.category),
            rating: cat.rating.toString()
          })),
          status: review.status
        };
      });
  }

  private generateReviewTitle(rating: number): string {
    if (rating >= 4.5) return 'Exceptional experience';
    if (rating >= 4.0) return 'Great stay overall';
    if (rating >= 3.0) return 'Good accommodation';
    if (rating >= 2.0) return 'Average experience';
    return 'Below expectations';
  }

  private mapCategoryName(category: string): string {
    const categoryMapping: Record<string, string> = {
      'cleanliness': 'Cleanliness',
      'communication': 'Communication',
      'respect_house_rules': 'House rules',
      'check-in': 'Check-in',
      'amenities': 'Amenities',
      'location': 'Good location',
      'service': 'Service',
      'space': 'Space',
      'comfort': 'Comfort',
      'value': 'Value for money'
    };
    return categoryMapping[category] || category;
  }
}
