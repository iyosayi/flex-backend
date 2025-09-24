import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { mockProperties } from '../properties/mock/mock-properties';

interface StatusChange {
  status: string;
  timestamp: string;
}

interface ChartDataPoint {
  period: string;
  greatReviewsCount: number;
  neutralReviewsCount: number;
  badReviewsCount: number;
  totalReviews: number;
}

interface ReviewsChartQuery {
  dateRange: string;
  location?: string;
  period?: 'monthly' | 'weekly' | 'daily';
}

interface DateRange {
  start: Date;
  end: Date;
}

export interface ReviewsChartResponse {
  reviewsChart: ChartDataPoint[];
  summary: {
    text: string;
    location: string;
    period: string;
    totalReviews: number;
    averageRating: number;
  };
  filters: {
    dateRange: string;
    location: string;
    period: string;
  };
}

interface GuestMentionsQuery {
  dateRange: string;
  location?: string;
  category?: string;
}

export interface GuestMentionsResponse {
  categories: string[];
  selectedCategory: string;
  locationData: Array<{
    location: string;
    count: number;
  }>;
  summary: {
    totalMentions: number;
    topLocation: string;
    averageMentionsPerLocation: number;
  };
  filters: {
    dateRange: string;
    location: string;
    category: string;
  };
}

interface ReviewPerformanceQuery {
  dateRange: string;
  location?: string;
}

export interface ReviewPerformanceResponse {
  goodReviews: {
    percentage: number;
    count: number;
    insight: string;
    topMentions: Array<{
      mention: string;
      count: number;
    }>;
  };
  badReviews: {
    percentage: number;
    count: number;
    insight: string;
    topMentions: Array<{
      mention: string;
      count: number;
    }>;
  };
  summary: {
    totalReviews: number;
    averageRating: number;
    topPerformingLocation: string;
    worstPerformingLocation: string;
  };
  filters: {
    dateRange: string;
    location: string;
  };
}

@Injectable()
export class ReviewsService implements OnModuleInit {
  private statusChangesFile: string;
  private staticReviewsFile: string;
  private statusChanges: Map<number, StatusChange> = new Map();
  private staticReviews: any[] = [];

  constructor() {
    this.statusChangesFile = path.join(process.cwd(), 'data', 'review-status-changes.json');
    this.staticReviewsFile = path.join(process.cwd(), 'data', 'static-reviews.json');
  }

  async onModuleInit() {
    await this.loadStaticReviews();
    await this.loadStatusChanges();
  }

  private async loadStaticReviews() {
    try {
      if (fs.existsSync(this.staticReviewsFile)) {
        const data = fs.readFileSync(this.staticReviewsFile, 'utf8');
        this.staticReviews = JSON.parse(data);
      } else {
        console.warn('Static reviews file not found, using empty array');
        this.staticReviews = [];
      }
    } catch (error) {
      console.warn('Failed to load static reviews:', error);
      this.staticReviews = [];
    }
  }

  private async loadStatusChanges() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.statusChangesFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.statusChangesFile)) {
        const data = JSON.parse(fs.readFileSync(this.statusChangesFile, 'utf8'));
        
        // Handle migration from old format (string) to new format (object)
        Object.entries(data).forEach(([id, change]) => {
          const reviewId = parseInt(id);
          if (typeof change === 'string') {
            // Old format: just status string
            this.statusChanges.set(reviewId, { 
              status: change, 
              timestamp: new Date().toISOString() // Use current time as fallback
            });
          } else {
            // New format: object with status and timestamp
            this.statusChanges.set(reviewId, change as StatusChange);
          }
        });
        
        // Apply status changes to static reviews
        this.statusChanges.forEach((change, id) => {
          const review = this.staticReviews.find(r => r.id === id);
          if (review) {
            review.status = change.status;
            // Add publishedAt timestamp if the review is published
            if (change.status === 'published') {
              (review as any).publishedAt = change.timestamp;
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load review status changes:', error);
    }
  }

  private async saveStatusChanges() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.statusChangesFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const data = Object.fromEntries(this.statusChanges);
      fs.writeFileSync(this.statusChangesFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to save review status changes:', error);
    }
  }

  findAll() {
    return this.staticReviews;
  }

  async findOne(id: string) {
    const review = this.staticReviews.find(r => r.id.toString() === id);
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }

  async updateStatus(id: string, status: 'awaiting' | 'published') {
    const review = this.staticReviews.find(r => r.id.toString() === id);
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    // Update the review status
    review.status = status;
    
    // Store the status change with timestamp for persistence
    const timestamp = new Date().toISOString();
    this.statusChanges.set(review.id, { status, timestamp });
    
    // Add publishedAt timestamp if the review is published
    if (status === 'published') {
      (review as any).publishedAt = timestamp;
    } else {
      // Remove publishedAt if unpublished
      delete (review as any).publishedAt;
    }
    
    // Save to file
    await this.saveStatusChanges();
    
    return review;
  }

  async getReviewsChart(query: ReviewsChartQuery): Promise<ReviewsChartResponse> {
    const dateRange = this.parseDateRange(query.dateRange);
    const allReviews = this.getLatestReviews();
    
    // Filter by date range
    const filteredReviews = this.filterReviewsByDateRange(allReviews, dateRange);
    
    // Apply location filter
    const locationFilteredReviews = this.applyLocationFilter(filteredReviews, query.location);
    
    // Generate chart data based on period
    const reviewsChart = this.generateChartData(locationFilteredReviews, query.period);
    
    // Generate meaningful summary with actual insights
    const summary = this.generateInsightfulSummary(reviewsChart, locationFilteredReviews, query);
    
    return {
      reviewsChart,
      summary,
      filters: {
        dateRange: query.dateRange,
        location: query.location || 'All Locations',
        period: query.period || 'monthly'
      }
    };
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
      console.warn('Failed to apply status changes in reviews service:', error);
    }
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

  private filterReviewsByDateRange(reviews: any[], dateRange: DateRange): any[] {
    return reviews.filter(review => {
      const reviewDate = new Date(review.submittedAt);
      return reviewDate >= dateRange.start && reviewDate <= dateRange.end;
    });
  }

  private applyLocationFilter(reviews: any[], location?: string): any[] {
    if (!location) return reviews;
    
    return reviews.filter(review => {
      const property = mockProperties.find(p => p.name === review.listingName);
      return property && property.city.toLowerCase().includes(location.toLowerCase());
    });
  }

  private generateChartData(reviews: any[], period?: string): ChartDataPoint[] {
    switch (period) {
      case 'daily':
        return this.generateDailyData(reviews);
      case 'weekly':
        return this.generateWeeklyData(reviews);
      case 'monthly':
      default:
        return this.generateMonthlyData(reviews);
    }
  }

  private generateMonthlyData(reviews: any[]): ChartDataPoint[] {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = new Map<string, { great: number; neutral: number; bad: number }>();

    // Initialize all 12 months of current year (2025)
    for (let month = 0; month < 12; month++) {
      const monthKey = `2025-${String(month + 1).padStart(2, '0')}`;
      monthlyStats.set(monthKey, { great: 0, neutral: 0, bad: 0 });
    }

    // Process reviews
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

    // Convert to response format
    return Array.from(monthlyStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, stats]) => {
        const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
        const total = stats.great + stats.neutral + stats.bad;
        return {
          period: monthNames[monthIndex],
          greatReviewsCount: stats.great,
          neutralReviewsCount: stats.neutral,
          badReviewsCount: stats.bad,
          totalReviews: total,
        };
      });
  }

  private generateWeeklyData(reviews: any[]): ChartDataPoint[] {
    const weeklyStats = new Map<string, { great: number; neutral: number; bad: number }>();
    
    // Get date range from reviews
    if (reviews.length === 0) return [];
    
    const dates = reviews.map(r => new Date(r.submittedAt)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    // Generate weeks
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
      weeklyStats.set(weekKey, { great: 0, neutral: 0, bad: 0 });
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Process reviews
    reviews.forEach(review => {
      const reviewDate = new Date(review.submittedAt);
      const weekStart = new Date(reviewDate);
      weekStart.setDate(weekStart.getDate() - reviewDate.getDay());
      const weekKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
      
      if (weeklyStats.has(weekKey)) {
        const stats = weeklyStats.get(weekKey)!;
        if (review.rating >= 4.0) {
          stats.great++;
        } else if (review.rating >= 2.5) {
          stats.neutral++;
        } else {
          stats.bad++;
        }
      }
    });

    return Array.from(weeklyStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, stats]) => {
        const total = stats.great + stats.neutral + stats.bad;
        return {
          period: weekKey,
          greatReviewsCount: stats.great,
          neutralReviewsCount: stats.neutral,
          badReviewsCount: stats.bad,
          totalReviews: total,
        };
      });
  }

  private generateDailyData(reviews: any[]): ChartDataPoint[] {
    const dailyStats = new Map<string, { great: number; neutral: number; bad: number }>();
    
    // Process reviews
    reviews.forEach(review => {
      const reviewDate = new Date(review.submittedAt);
      const dayKey = reviewDate.toISOString().split('T')[0];
      
      if (!dailyStats.has(dayKey)) {
        dailyStats.set(dayKey, { great: 0, neutral: 0, bad: 0 });
      }
      
      const stats = dailyStats.get(dayKey)!;
      if (review.rating >= 4.0) {
        stats.great++;
      } else if (review.rating >= 2.5) {
        stats.neutral++;
      } else {
        stats.bad++;
      }
    });

    return Array.from(dailyStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dayKey, stats]) => {
        const total = stats.great + stats.neutral + stats.bad;
        return {
          period: dayKey,
          greatReviewsCount: stats.great,
          neutralReviewsCount: stats.neutral,
          badReviewsCount: stats.bad,
          totalReviews: total,
        };
      });
  }

  private generateInsightfulSummary(
    reviewsChart: ChartDataPoint[], 
    reviews: any[], 
    query: ReviewsChartQuery
  ): { text: string; location: string; period: string; totalReviews: number; averageRating: number } {
    const location = query.location || 'All Locations';
    const period = this.getPeriodDescription(query.dateRange);
    
    // Calculate overall statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;
    
    // Analyze trends in the chart data
    const insights = this.analyzeChartTrends(reviewsChart);
    
    // Generate insight-based text
    const text = this.generateInsightText(insights, location, period, totalReviews, averageRating);
    
    return {
      text,
      location,
      period,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10
    };
  }

  private analyzeChartTrends(reviewsChart: ChartDataPoint[]): {
    trend: 'improving' | 'declining' | 'stable';
    peakMonth: string;
    lowestMonth: string;
    averageMonthly: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    volatility: 'low' | 'medium' | 'high';
  } {
    if (reviewsChart.length === 0) {
      return {
        trend: 'stable',
        peakMonth: 'N/A',
        lowestMonth: 'N/A',
        averageMonthly: 0,
        sentiment: 'neutral',
        volatility: 'low'
      };
    }

    // Calculate total reviews per period
    const totals = reviewsChart.map(point => point.totalReviews);
    const greatTotals = reviewsChart.map(point => point.greatReviewsCount);
    
    // Find peak and lowest months
    const peakIndex = totals.indexOf(Math.max(...totals));
    const lowestIndex = totals.indexOf(Math.min(...totals.filter(t => t > 0)));
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(totals.length / 2);
    const firstHalfAvg = totals.slice(0, midPoint).reduce((sum, t) => sum + t, 0) / midPoint;
    const secondHalfAvg = totals.slice(midPoint).reduce((sum, t) => sum + t, 0) / (totals.length - midPoint);
    
    let trend: 'improving' | 'declining' | 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'improving';
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'declining';
    else trend = 'stable';
    
    // Calculate sentiment
    const totalGreat = greatTotals.reduce((sum, g) => sum + g, 0);
    const totalAll = totals.reduce((sum, t) => sum + t, 0);
    const positiveRatio = totalAll > 0 ? totalGreat / totalAll : 0;
    
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (positiveRatio > 0.6) sentiment = 'positive';
    else if (positiveRatio > 0.3) sentiment = 'neutral';
    else sentiment = 'negative';
    
    // Calculate volatility (standard deviation)
    const average = totals.reduce((sum, t) => sum + t, 0) / totals.length;
    const variance = totals.reduce((sum, t) => sum + Math.pow(t - average, 2), 0) / totals.length;
    const volatility = Math.sqrt(variance) / average;
    
    let volatilityLevel: 'low' | 'medium' | 'high';
    if (volatility < 0.2) volatilityLevel = 'low';
    else if (volatility < 0.5) volatilityLevel = 'medium';
    else volatilityLevel = 'high';

    return {
      trend,
      peakMonth: reviewsChart[peakIndex]?.period || 'N/A',
      lowestMonth: reviewsChart[lowestIndex]?.period || 'N/A',
      averageMonthly: Math.round(average),
      sentiment,
      volatility: volatilityLevel
    };
  }

  private generateInsightText(
    insights: any, 
    location: string, 
    period: string, 
    totalReviews: number, 
    averageRating: number
  ): string {
    const { trend, peakMonth, lowestMonth, sentiment, volatility } = insights;
    
    // Base insight
    let insight = `${totalReviews} reviews with ${averageRating.toFixed(2)}★ average rating`;
    
    // Add trend insight
    if (trend === 'improving') {
      insight += `, showing improving review volume`;
    } else if (trend === 'declining') {
      insight += `, with declining review activity`;
    } else {
      insight += `, maintaining steady review levels`;
    }
    
    // Add sentiment insight
    if (sentiment === 'positive') {
      insight += ` and predominantly positive sentiment`;
    } else if (sentiment === 'negative') {
      insight += ` with concerning negative sentiment`;
    } else {
      insight += ` with mixed sentiment`;
    }
    
    // Add peak/valley insights
    if (peakMonth !== 'N/A' && lowestMonth !== 'N/A' && peakMonth !== lowestMonth) {
      insight += `. Peak activity in ${peakMonth}, lowest in ${lowestMonth}`;
    }
    
    // Add volatility insight
    if (volatility === 'high') {
      insight += `, showing high variability in review patterns`;
    } else if (volatility === 'low') {
      insight += `, demonstrating consistent review patterns`;
    }
    
    return insight;
  }

  async getGuestMentions(query: GuestMentionsQuery): Promise<GuestMentionsResponse> {
    const dateRange = this.parseDateRange(query.dateRange);
    const allReviews = this.getLatestReviews();
    
    // Filter by date range
    const filteredReviews = this.filterReviewsByDateRange(allReviews, dateRange);
    
    // Apply location filter
    const locationFilteredReviews = this.applyLocationFilter(filteredReviews, query.location);
    
    // Generate guest mentions data
    const categories = ['Cleanliness', 'Lack of cleanliness', 'Noise complaints', 'Maintenance problems'];
    const selectedCategory = query.category || 'Cleanliness';
    const locationData = this.calculateMentionCountsByLocation(locationFilteredReviews, selectedCategory);
    
    // Generate summary
    const summary = this.generateGuestMentionsSummary(locationData, locationFilteredReviews, selectedCategory);
    
    return {
      categories,
      selectedCategory,
      locationData,
      summary,
      filters: {
        dateRange: query.dateRange,
        location: query.location || 'All Locations',
        category: selectedCategory
      }
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

    // Sort by count descending and limit to top locations
    return Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 locations
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

  private generateGuestMentionsSummary(
    locationData: Array<{ location: string; count: number }>,
    reviews: any[],
    category: string
  ): { totalMentions: number; topLocation: string; averageMentionsPerLocation: number } {
    const totalMentions = locationData.reduce((sum, item) => sum + item.count, 0);
    const topLocation = locationData.length > 0 ? locationData[0].location : 'N/A';
    const averageMentionsPerLocation = locationData.length > 0 
      ? Math.round((totalMentions / locationData.length) * 10) / 10 
      : 0;

    return {
      totalMentions,
      topLocation,
      averageMentionsPerLocation
    };
  }

  async getReviewPerformance(query: ReviewPerformanceQuery): Promise<ReviewPerformanceResponse> {
    const dateRange = this.parseDateRange(query.dateRange);
    const allReviews = this.getLatestReviews();
    
    // Filter by date range
    const filteredReviews = this.filterReviewsByDateRange(allReviews, dateRange);
    
    // Apply location filter
    const locationFilteredReviews = this.applyLocationFilter(filteredReviews, query.location);
    
    // Categorize reviews into good and bad
    const goodReviews = locationFilteredReviews.filter(review => review.rating >= 4.0);
    const badReviews = locationFilteredReviews.filter(review => review.rating < 3.0);
    const totalReviews = locationFilteredReviews.length;
    
    // Calculate percentages
    const goodPercentage = totalReviews > 0 ? Math.round((goodReviews.length / totalReviews) * 100) : 0;
    const badPercentage = totalReviews > 0 ? Math.round((badReviews.length / totalReviews) * 100) : 0;
    
    // Generate insights and top mentions
    const goodInsight = this.generatePerformanceInsight(goodReviews, 'good');
    const badInsight = this.generatePerformanceInsight(badReviews, 'bad');
    
    const goodTopMentions = this.extractTopMentions(goodReviews);
    const badTopMentions = this.extractTopMentions(badReviews);
    
    // Calculate summary metrics
    const averageRating = totalReviews > 0 
      ? locationFilteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;
    
    const locationPerformance = this.calculateLocationPerformance(locationFilteredReviews);
    
    return {
      goodReviews: {
        percentage: goodPercentage,
        count: goodReviews.length,
        insight: goodInsight,
        topMentions: goodTopMentions
      },
      badReviews: {
        percentage: badPercentage,
        count: badReviews.length,
        insight: badInsight,
        topMentions: badTopMentions
      },
      summary: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        topPerformingLocation: locationPerformance.topLocation || 'N/A',
        worstPerformingLocation: locationPerformance.worstLocation || 'N/A'
      },
      filters: {
        dateRange: query.dateRange,
        location: query.location || 'All Locations'
      }
    };
  }

  private generatePerformanceInsight(reviews: any[], type: 'good' | 'bad'): string {
    if (reviews.length === 0) {
      return type === 'good' 
        ? 'No good reviews in this period'
        : 'No bad reviews in this period';
    }

    // Group by location
    const locationCounts = new Map<string, number>();
    reviews.forEach(review => {
      const property = mockProperties.find(p => p.name === review.listingName);
      if (property) {
        const location = property.city;
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      }
    });

    // Get top locations
    const sortedLocations = Array.from(locationCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    if (sortedLocations.length === 0) {
      return type === 'good' 
        ? 'Good performance across all locations'
        : 'Some areas need attention';
    }

    const topLocation = sortedLocations[0][0];
    const secondLocation = sortedLocations[1] ? sortedLocations[1][0] : null;

    if (type === 'good') {
      if (secondLocation) {
        return `Locations like ${topLocation} & ${secondLocation} get consistently good reviews`;
      } else {
        return `${topLocation} properties are performing exceptionally well`;
      }
    } else {
      return `${topLocation} properties have been getting frequent bad reviews lately`;
    }
  }

  private extractTopMentions(reviews: any[]): Array<{ mention: string; count: number }> {
    const mentionCounts = new Map<string, number>();
    
    // Define positive and negative mention keywords
    const positiveKeywords = [
      'clean', 'cleanliness', 'spotless', 'tidy', 'hygiene',
      'great location', 'amazing location', 'perfect location', 'excellent location',
      'comfortable', 'cozy', 'spacious', 'modern', 'beautiful',
      'helpful', 'friendly', 'responsive', 'professional'
    ];
    
    const negativeKeywords = [
      'dirty', 'messy', 'unclean', 'filthy', 'stain', 'dust',
      'noisy', 'loud', 'noise', 'sound',
      'broken', 'maintenance', 'issue', 'problem', 'fix', 'repair',
      'uncomfortable', 'small', 'old', 'outdated'
    ];

    reviews.forEach(review => {
      const reviewText = review.publicReview.toLowerCase();
      
      // Check for positive keywords in good reviews
      if (review.rating >= 4.0) {
        positiveKeywords.forEach(keyword => {
          if (reviewText.includes(keyword)) {
            mentionCounts.set(keyword, (mentionCounts.get(keyword) || 0) + 1);
          }
        });
      }
      
      // Check for negative keywords in bad reviews
      if (review.rating < 3.0) {
        negativeKeywords.forEach(keyword => {
          if (reviewText.includes(keyword)) {
            mentionCounts.set(keyword, (mentionCounts.get(keyword) || 0) + 1);
          }
        });
      }
    });

    // Convert to array and sort by count, then format mentions
    return Array.from(mentionCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([mention, count]) => ({
        mention: this.formatMention(mention),
        count
      }));
  }

  private formatMention(mention: string): string {
    // Format mentions to be more user-friendly
    const formattedMentions: Record<string, string> = {
      'clean': 'Cleanliness',
      'cleanliness': 'Cleanliness',
      'spotless': 'Cleanliness',
      'tidy': 'Cleanliness',
      'hygiene': 'Cleanliness',
      'great location': 'Great locations',
      'amazing location': 'Great locations',
      'perfect location': 'Great locations',
      'excellent location': 'Great locations',
      'comfortable': 'Comfort',
      'cozy': 'Comfort',
      'spacious': 'Space',
      'modern': 'Modern amenities',
      'beautiful': 'Beautiful property',
      'helpful': 'Helpful host',
      'friendly': 'Friendly service',
      'responsive': 'Quick response',
      'professional': 'Professional service',
      'dirty': 'Cleanliness issues',
      'messy': 'Cleanliness issues',
      'unclean': 'Cleanliness issues',
      'filthy': 'Cleanliness issues',
      'stain': 'Cleanliness issues',
      'dust': 'Cleanliness issues',
      'noisy': 'Noise complaints',
      'loud': 'Noise complaints',
      'noise': 'Noise complaints',
      'sound': 'Noise complaints',
      'broken': 'Maintenance issues',
      'maintenance': 'Maintenance issues',
      'issue': 'Maintenance issues',
      'problem': 'Maintenance issues',
      'fix': 'Maintenance issues',
      'repair': 'Maintenance issues',
      'uncomfortable': 'Comfort issues',
      'small': 'Space issues',
      'old': 'Property condition',
      'outdated': 'Property condition'
    };

    return formattedMentions[mention] || mention.charAt(0).toUpperCase() + mention.slice(1);
  }

  private calculateLocationPerformance(reviews: any[]): { topLocation: string; worstLocation: string } {
    const locationStats = new Map<string, { total: number; sum: number }>();
    
    reviews.forEach(review => {
      const property = mockProperties.find(p => p.name === review.listingName);
      if (property) {
        const location = property.city;
        const stats = locationStats.get(location) || { total: 0, sum: 0 };
        stats.total++;
        stats.sum += review.rating;
        locationStats.set(location, stats);
      }
    });

    let topLocation = '';
    let worstLocation = '';
    let highestAvg = 0;
    let lowestAvg = 5;

    locationStats.forEach((stats, location) => {
      const average = stats.sum / stats.total;
      if (average > highestAvg) {
        highestAvg = average;
        topLocation = location;
      }
      if (average < lowestAvg) {
        lowestAvg = average;
        worstLocation = location;
      }
    });

    return { topLocation, worstLocation };
  }

  async getDynamicReviews(query: {
    page?: string;
    limit?: string;
    status?: string;
    channel?: string;
    propertyName?: string;
    defaultToPublishedOnly?: boolean;
  }) {
    const allReviews = this.findAll();
    
    // Apply property name filter if provided
    let filteredReviews = allReviews;
    if (query.propertyName) {
      filteredReviews = filteredReviews.filter(review => 
        review.listingName.toLowerCase().includes(query.propertyName.toLowerCase())
      );
    }
    
    // Apply status filter
    if (query.status && query.status !== 'all') {
      filteredReviews = filteredReviews.filter(review => review.status === query.status);
    } else if (query.defaultToPublishedOnly) {
      // Default to only published reviews for backward compatibility (hostaway endpoint)
      filteredReviews = filteredReviews.filter(review => review.status === 'published');
    }
    // No default filtering - show all reviews by default for main endpoint
    
    // Apply channel filter
    if (query.channel && query.channel !== 'all') {
      filteredReviews = filteredReviews.filter(review => 
        review.channel.toLowerCase() === query.channel.toLowerCase()
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
    const pageNumber = Math.max(1, Number(query.page) || 1);
    const limitNumber = Math.max(1, Math.min(100, Number(query.limit) || 50)); // Max 100 items per page
    const offset = (pageNumber - 1) * limitNumber;
    const total = filteredReviews.length;
    const totalPages = Math.ceil(total / limitNumber);
    
    // Get paginated results
    const paginatedReviews = filteredReviews.slice(offset, offset + limitNumber);
    
    // Transform to match API format
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

  private getPeriodDescription(dateRange: string): string {
    const periodMap: Record<string, string> = {
      '7d': 'last 7 days',
      '14d': 'last 14 days', 
      '30d': 'last 30 days',
      '90d': 'last 90 days',
      '1y': 'last year'
    };
    return periodMap[dateRange] || 'selected period';
  }
}
