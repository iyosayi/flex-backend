import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { mockProperties } from '../properties/mock/mock-properties';

interface OverviewQuery {
  dateRange: string;
  location?: string;
  search?: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface Metrics {
  totalReviews: {
    count: number;
    change: number;
    changeType: 'increase' | 'decrease';
    comparisonPeriod: string;
  };
  allProperties: {
    count: number;
    change: number;
    changeType: 'increase' | 'decrease';
    comparisonPeriod: string;
  };
}

interface RecentReview {
  id: number;
  propertyImageSrc: string;
  reviewTitle: string;
  propertyType: string;
  propertyLocation: string;
  reviewCity: string;
  stayDuration: string;
  rating: string;
  publicReviewText: string;
  submittedAt: string;
  guestName: string;
  channel: string;
}

interface PropertyPerformance {
  id: string;
  propertyImageSrc: string;
  propertyName: string;
  propertyLocation: string;
  averageRating: string;
  numberOfReviews: number;
  totalReviews: number;
}

interface MonthlyData {
  month: string;
  greatReviewsCount: number;
  neutralReviewsCount: number;
  badReviewsCount: number;
}

interface ReviewsChart {
  monthlyData: MonthlyData[];
  summary: {
    text: string;
    location: string;
    period: string;
  };
}

interface GuestMentions {
  categories: string[];
  selectedCategory: string;
  locationData: Array<{
    location: string;
    count: number;
  }>;
}

interface OverviewResponse {
  metrics: Metrics;
  recentReviews: RecentReview[];
  topRatedProperties: PropertyPerformance[];
  below3StarProperties: PropertyPerformance[];
  reviewsChart: ReviewsChart;
  guestMentions: GuestMentions;
}

@Injectable()
export class OverviewService {
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
      console.warn('Failed to load static reviews in overview service:', error);
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
      console.warn('Failed to apply status changes in overview service:', error);
    }
  }

  async getOverview(query: OverviewQuery): Promise<OverviewResponse> {
    const dateRange = this.parseDateRange(query.dateRange);
    const previousDateRange = this.getPreviousDateRange(dateRange);
    
    // Filter reviews by date range
    const latestReviews = this.getLatestReviews();
    const currentReviews = this.filterReviewsByDateRange(latestReviews, dateRange);
    const previousReviews = this.filterReviewsByDateRange(latestReviews, previousDateRange);
    
    // Apply location and search filters
    const filteredReviews = this.applyFilters(currentReviews, query);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(currentReviews, previousReviews, query.dateRange);
    
    // Get recent reviews
    const recentReviews = this.getRecentReviews(filteredReviews);
    
    // Get property performance
    const topRatedProperties = this.getTopRatedProperties(filteredReviews);
    const below3StarProperties = this.getBelow3StarProperties(filteredReviews);
    
    // Get chart data
    const reviewsChart = this.getReviewsChart(latestReviews, query);
    
    // Get guest mentions
    const guestMentions = this.getGuestMentions(filteredReviews);

    return {
      metrics,
      recentReviews,
      topRatedProperties,
      below3StarProperties,
      reviewsChart,
      guestMentions,
    };
  }

  private parseDateRange(dateRange: string): DateRange {
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
        start.setDate(today.getDate() - 14);
    }

    return { start, end };
  }

  private getPreviousDateRange(currentRange: DateRange): DateRange {
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    const end = new Date(currentRange.start);
    const start = new Date(end.getTime() - duration);
    
    return { start, end };
  }

  private filterReviewsByDateRange(reviews: any[], dateRange: DateRange): any[] {
    return reviews.filter(review => {
      const reviewDate = new Date(review.submittedAt);
      return reviewDate >= dateRange.start && reviewDate <= dateRange.end;
    });
  }

  private applyFilters(reviews: any[], query: OverviewQuery): any[] {
    let filtered = reviews;

    // Apply location filter
    if (query.location) {
      filtered = filtered.filter(review => {
        const property = mockProperties.find(p => p.id === this.getPropertyIdFromListingName(review.listingName));
        return property && property.city.toLowerCase().includes(query.location.toLowerCase());
      });
    }

    // Apply search filter
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(review => {
        const property = mockProperties.find(p => p.id === this.getPropertyIdFromListingName(review.listingName));
        return (
          review.publicReview.toLowerCase().includes(searchLower) ||
          review.listingName.toLowerCase().includes(searchLower) ||
          (property && property.city.toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  }

  private getPropertyIdFromListingName(listingName: string): string {
    const property = mockProperties.find(p => p.name === listingName);
    return property ? property.id : '';
  }

  private calculateMetrics(currentReviews: any[], previousReviews: any[], dateRange: string): Metrics {
    const currentCount = currentReviews.length;
    const previousCount = previousReviews.length;
    const change = currentCount - previousCount;
    
    const currentProperties = new Set(currentReviews.map(r => this.getPropertyIdFromListingName(r.listingName))).size;
    const previousProperties = new Set(previousReviews.map(r => this.getPropertyIdFromListingName(r.listingName))).size;
    const propertiesChange = currentProperties - previousProperties;

    return {
      totalReviews: {
        count: currentCount,
        change: Math.abs(change),
        changeType: change >= 0 ? 'increase' : 'decrease',
        comparisonPeriod: `VS ${dateRange.toUpperCase()}`,
      },
      allProperties: {
        count: currentProperties,
        change: Math.abs(propertiesChange),
        changeType: propertiesChange >= 0 ? 'increase' : 'decrease',
        comparisonPeriod: `VS ${dateRange.toUpperCase()}`,
      },
    };
  }

  private getRecentReviews(reviews: any[]): RecentReview[] {
    return reviews
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
      .map(review => {
        const property = mockProperties.find(p => p.name === review.listingName);
        return {
          id: review.id,
          propertyImageSrc: property?.imageUrl || '',
          reviewTitle: this.generateReviewTitle(review.rating),
          propertyType: review.listingName,
          propertyLocation: property?.city || '',
          reviewCity: property?.city?.toUpperCase() || '',
          stayDuration: `${Math.floor(Math.random() * 20) + 1} day stay`,
          rating: review.rating.toFixed(2),
          publicReviewText: review.publicReview,
          submittedAt: review.submittedAt,
          guestName: review.guestName,
          channel: review.channel,
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

  private getTopRatedProperties(reviews: any[]): PropertyPerformance[] {
    const propertyStats = this.calculatePropertyStats(reviews);
    
    return propertyStats
      .filter(stat => parseFloat(stat.averageRating) >= 3.5)
      .sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating))
      .slice(0, 8)
      .map(stat => {
        const property = mockProperties.find(p => p.id === stat.propertyId);
        return {
          id: stat.propertyId,
          propertyImageSrc: property?.imageUrl || '',
          propertyName: property?.name || '',
          propertyLocation: property?.city || '',
          averageRating: stat.averageRating,
          numberOfReviews: stat.reviewCount,
          totalReviews: property?.totalReviews || 0,
        };
      });
  }

  private getBelow3StarProperties(reviews: any[]): PropertyPerformance[] {
    const propertyStats = this.calculatePropertyStats(reviews);
    
    return propertyStats
      .filter(stat => parseFloat(stat.averageRating) <= 3.5)
      .sort((a, b) => parseFloat(a.averageRating) - parseFloat(b.averageRating))
      .slice(0, 8)
      .map(stat => {
        const property = mockProperties.find(p => p.id === stat.propertyId);
        return {
          id: stat.propertyId,
          propertyImageSrc: property?.imageUrl || '',
          propertyName: property?.name || '',
          propertyLocation: property?.city || '',
          averageRating: stat.averageRating,
          numberOfReviews: stat.reviewCount,
          totalReviews: property?.totalReviews || 0,
        };
      });
  }

  private calculatePropertyStats(reviews: any[]): Array<{
    propertyId: string;
    averageRating: string;
    reviewCount: number;
  }> {
    const propertyMap = new Map<string, { ratings: number[]; count: number }>();

    reviews.forEach(review => {
      const propertyId = this.getPropertyIdFromListingName(review.listingName);
      if (propertyId) {
        if (!propertyMap.has(propertyId)) {
          propertyMap.set(propertyId, { ratings: [], count: 0 });
        }
        const stats = propertyMap.get(propertyId)!;
        stats.ratings.push(review.rating);
        stats.count++;
      }
    });

    return Array.from(propertyMap.entries()).map(([propertyId, stats]) => ({
      propertyId,
      averageRating: (stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length).toFixed(2),
      reviewCount: stats.count,
    }));
  }

  private getReviewsChart(allReviews: any[], query: OverviewQuery): ReviewsChart {
    const monthlyData = this.generateMonthlyData(allReviews);
    const summary = this.generateChartSummary(monthlyData, query);

    return {
      monthlyData,
      summary,
    };
  }

  private generateMonthlyData(reviews: any[]): MonthlyData[] {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = new Map<string, { great: number; neutral: number; bad: number }>();

    // Initialize all 12 months of the current year (2025)
    for (let month = 0; month < 12; month++) {
      const monthKey = `2025-${String(month + 1).padStart(2, '0')}`;
      monthlyStats.set(monthKey, { great: 0, neutral: 0, bad: 0 });
    }

    // Count reviews by month and sentiment
    reviews.forEach(review => {
      const reviewDate = new Date(review.submittedAt);
      const monthKey = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyStats.has(monthKey)) {
        const stats = monthlyStats.get(monthKey)!;
        if (review.rating >= 4.0) {
          stats.great++;
        } else if (review.rating >= 2.5) {
          stats.neutral++;
        } else {
          stats.bad++;
        }
      }
    });

    // Return months in order from January to December
    return Array.from(monthlyStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, stats]) => {
        const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
        return {
          month: monthNames[monthIndex],
          greatReviewsCount: stats.great,
          neutralReviewsCount: stats.neutral,
          badReviewsCount: stats.bad,
        };
      });
  }

  private generateChartSummary(monthlyData: MonthlyData[], query: OverviewQuery): { text: string; location: string; period: string } {
    const last3Months = monthlyData.slice(-3);
    const totalReviews = last3Months.reduce((sum, month) => sum + month.greatReviewsCount + month.neutralReviewsCount + month.badReviewsCount, 0);
    const neutralReviews = last3Months.reduce((sum, month) => sum + month.neutralReviewsCount, 0);
    const neutralPercentage = totalReviews > 0 ? (neutralReviews / totalReviews) * 100 : 0;

    const location = query.location || 'London';
    const isConsistentlyNeutral = neutralPercentage > 50;

    return {
      text: isConsistentlyNeutral 
        ? `Consistently neutral reviews over the last 3 months for properties in ${location}`
        : `Mixed review sentiment over the last 3 months for properties in ${location}`,
      location,
      period: 'last 3 months',
    };
  }

  private getGuestMentions(reviews: any[]): GuestMentions {
    const categories = ['Cleanliness', 'Lack of cleanliness', 'Noise complaints', 'Maintenance problems'];
    const selectedCategory = 'Cleanliness';
    
    const locationData = this.calculateMentionCountsByLocation(reviews, selectedCategory);

    return {
      categories,
      selectedCategory,
      locationData,
    };
  }

  private calculateMentionCountsByLocation(reviews: any[], category: string): Array<{ location: string; count: number }> {
    const locationCounts = new Map<string, number>();
    const categoryKeywords = this.getCategoryKeywords(category);

    reviews.forEach(review => {
      const property = mockProperties.find(p => p.name === review.listingName);
      if (property) {
        const location = property.city;
        const reviewText = review.publicReview.toLowerCase();
        
        const hasMention = categoryKeywords.some(keyword => reviewText.includes(keyword));
        if (hasMention) {
          locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
        }
      }
    });

    return Array.from(locationCounts.entries()).map(([location, count]) => ({
      location,
      count,
    }));
  }

  private getCategoryKeywords(category: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'Cleanliness': ['clean', 'dirty', 'spotless', 'messy', 'hygiene', 'tidy'],
      'Lack of cleanliness': ['dirty', 'messy', 'unclean', 'filthy', 'stain', 'dust'],
      'Noise complaints': ['noisy', 'loud', 'quiet', 'noise', 'sound', 'peaceful'],
      'Maintenance problems': ['broken', 'fix', 'repair', 'maintenance', 'issue', 'problem'],
    };
    
    return keywordMap[category] || [];
  }
}
