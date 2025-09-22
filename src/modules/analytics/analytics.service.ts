import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from '../reviews/entities/review.entity';
import { Property } from '../properties/entities/property.entity';

type ReviewRecord = Review;

export type BucketGranularity = 'day' | 'week' | 'month';

type PropertyStat = {
  propertyId: string;
  name: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  avgRating: number;
  reviews: number;
  lastReviewDate?: string;
  goodCount: number;
  neutralCount: number;
  badCount: number;
  channelCounts: Record<string, number>;
  categoryAverages: Record<string, number>;
  stayNights: {
    count: number;
    sum: number;
    min?: number;
    max?: number;
  };
};

type TopProperty = {
  propertyId: string;
  name: string;
  city?: string;
  avgRating: number;
  reviews: number;
};

export interface AnalyticsFilters {
  location?: string;
  from?: Date;
  to?: Date;
  propertyIds?: string[];
}

export interface FilterQuery {
  location?: string | string[];
  from?: string | string[];
  to?: string | string[];
}

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_RECENT_LIMIT = 5;
const DEFAULT_TOP_LIMIT = 5;
const DEFAULT_MIN_REVIEWS = 1;
const MAX_PROPERTY_LIST_LIMIT = 50;

const CATEGORY_KEYS = [
  'cleanliness',
  'communication',
  'location',
  'checkin',
  'accuracy',
  'value',
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  cleanliness: 'Cleanliness',
  communication: 'Communication',
  location: 'Location',
  checkin: 'Check-in',
  accuracy: 'Accuracy',
  value: 'Value',
};

const ALLOWED_CHANNELS = ['airbnb', 'booking', 'direct', 'google'] as const;
type ChannelCode = (typeof ALLOWED_CHANNELS)[number];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Property.name) private propertyModel: Model<Property>,
  ) {}
  async createFilters(query: FilterQuery): Promise<AnalyticsFilters> {
    const location = this.unwrap(query.location)?.trim();
    const from = this.parseDate(this.unwrap(query.from));
    const to = this.parseDate(this.unwrap(query.to));

    let propertyIds: string[] | undefined;
    if (location) {
      const properties = await this.propertyModel.find({
        $or: [
          { city: { $regex: location, $options: 'i' } },
          { country: { $regex: location, $options: 'i' } },
          { name: { $regex: location, $options: 'i' } },
        ],
      }).select('_id');
      propertyIds = properties.map(p => p._id.toString());
    }

    return {
      location: location || undefined,
      from,
      to,
      propertyIds,
    };
  }

  async filterReviews(filters: AnalyticsFilters): Promise<ReviewRecord[]> {
    const matchStage: any = { approvedForPublic: true };

    // Date filtering
    if (filters.from || filters.to) {
      matchStage.reviewDate = {};
      if (filters.from) {
        matchStage.reviewDate.$gte = filters.from;
      }
      if (filters.to) {
        matchStage.reviewDate.$lte = filters.to;
      }
    }

    // Property filtering (for location-based filtering)
    if (filters.propertyIds) {
      matchStage.propertyId = { $in: filters.propertyIds };
    }

    return this.reviewModel.find(matchStage).lean().exec();
  }

  async getTotals(filters: AnalyticsFilters) {
    const reviews = await this.filterReviews(filters);
    return this.aggregateTotals(reviews);
  }

  async getRecentReviews({
    filters,
    page,
    limit,
  }: {
    filters: AnalyticsFilters;
    page: number;
    limit: number;
  }) {
    const reviews = await this.filterReviews(filters);
    return await this.aggregateRecent(reviews, { page, limit });
  }

  async getTopProperties({
    filters,
    kind,
    limit,
    minReviews,
  }: {
    filters: AnalyticsFilters;
    kind: 'good' | 'bad';
    limit: number;
    minReviews: number;
  }) {
    const reviews = await this.filterReviews(filters);
    const stats = await this.computePropertyStats(reviews);
    return this.pickTop(stats, kind === 'good' ? 'desc' : 'asc', {
      limit,
      minReviews,
    });
  }

  async getReviewTypes({
    filters,
    bucket,
  }: {
    filters: AnalyticsFilters;
    bucket: BucketGranularity;
  }) {
    const reviews = await this.filterReviews(filters);
    return this.aggregateTypes(reviews, bucket);
  }

  async getReviewVolume({
    filters,
    bucket,
  }: {
    filters: AnalyticsFilters;
    bucket: BucketGranularity;
  }) {
    const reviews = await this.filterReviews(filters);
    return this.aggregateVolume(reviews, bucket);
  }

  async getStayLengthDistribution(filters: AnalyticsFilters) {
    const reviews = await this.filterReviews(filters);
    return this.aggregateStays(reviews);
  }

  async getInsights(filters: AnalyticsFilters) {
    const reviews = await this.filterReviews(filters);
    const types = this.aggregateTypes(reviews, 'month');
    return await this.aggregateInsights(reviews, types);
  }

  async getPropertyList({
    filters,
    search,
    city,
    country,
    channel,
    minRating,
    maxRating,
    minStayNights,
    maxStayNights,
    category,
    sort,
    pageToken,
    limit,
  }: {
    filters: AnalyticsFilters;
    search?: string;
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
  }) {
    const reviews = await this.filterReviews(filters);
    const stats = await this.computePropertyStats(reviews);

    const normalizedSearch = search?.trim().toLowerCase();
    const normalizedCity = city?.trim().toLowerCase();
    const normalizedCountry = country?.trim().toLowerCase();
    const normalizedChannel = channel?.trim().toLowerCase();
    const normalizedCategory = category?.trim().toLowerCase();

    const channelKey =
      normalizedChannel && (ALLOWED_CHANNELS as readonly string[]).includes(normalizedChannel)
        ? (normalizedChannel as ChannelCode)
        : undefined;
    const categoryKey =
      normalizedCategory && (CATEGORY_KEYS as readonly string[]).includes(normalizedCategory)
        ? (normalizedCategory as CategoryKey)
        : undefined;

    const filtered = stats.filter((stat) => {
      if (normalizedSearch && !stat.name.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (normalizedCity) {
        const cityName = stat.city?.toLowerCase() ?? '';
        if (!cityName.includes(normalizedCity)) {
          return false;
        }
      }

      if (normalizedCountry) {
        const countryName = stat.country?.toLowerCase() ?? '';
        if (!countryName.includes(normalizedCountry)) {
          return false;
        }
      }

      if (channelKey) {
        if (!(stat.channelCounts[channelKey] && stat.channelCounts[channelKey] > 0)) {
          return false;
        }
      }

      if (typeof minRating === 'number' && stat.avgRating < minRating) {
        return false;
      }

      if (typeof maxRating === 'number' && stat.avgRating > maxRating) {
        return false;
      }

      if (typeof minStayNights === 'number' || typeof maxStayNights === 'number') {
        const avgStay = stat.stayNights.count > 0 ? stat.stayNights.sum / stat.stayNights.count : undefined;
        if (typeof minStayNights === 'number' && (avgStay === undefined || avgStay < minStayNights)) {
          return false;
        }
        if (typeof maxStayNights === 'number' && (avgStay === undefined || avgStay > maxStayNights)) {
          return false;
        }
      }

      if (categoryKey) {
        const categoryScore = stat.categoryAverages[categoryKey];
        if (categoryScore === undefined) {
          return false;
        }
      }

      return true;
    });

    const sorted = this.sortPropertyStats(filtered, sort);

    const safeLimit = this.normalizeLimit(limit);
    const offset = this.decodePageToken(pageToken);
    const total = sorted.length;
    const slice = sorted.slice(offset, offset + safeLimit);
    const nextOffset = offset + slice.length;
    const nextPageToken = nextOffset < total ? this.encodePageToken(nextOffset) : null;

    const cards = slice.map((stat) => this.buildPropertyCard(stat));

    const appliedFilters = Object.fromEntries(
      Object.entries({
        search,
        city,
        country,
        channel,
        minRating,
        maxRating,
        minStayNights,
        maxStayNights,
        category,
        location: filters.location,
        from: filters.from ? filters.from.toISOString() : undefined,
        to: filters.to ? filters.to.toISOString() : undefined,
      }).filter(([, value]) => value !== undefined && value !== ''),
    );

    return {
      data: cards,
      meta: {
        total,
        sort: sort ?? 'topRated',
        appliedFilters,
      },
      cursor: {
        nextPageToken,
        limit: safeLimit,
      },
    };
  }

  aggregateTotals(reviews: ReviewRecord[]) {
    const totalProperties = new Set(reviews.map((review) => review.propertyId.toString()));

    return {
      totalReviews: reviews.length,
      totalProperties: totalProperties.size,
    };
  }

  async aggregateRecent(
    reviews: ReviewRecord[],
    options?: { page?: number; limit?: number },
  ) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.max(1, options?.limit ?? DEFAULT_RECENT_LIMIT);
    
    // Use MongoDB aggregation to get reviews with populated property data
    const pipeline = [
      {
        $match: {
          _id: { $in: reviews.map(r => r._id) }
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: '_id',
          as: 'property'
        }
      },
      {
        $unwind: {
          path: '$property',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: {
          reviewDate: -1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      },
      {
        $project: {
          id: '$sourceReviewId',
          source: 1,
          channel: 1,
          rating: 1,
          text: 1,
          reviewDate: 1,
          property: {
            id: { $toString: '$propertyId' },
            name: '$property.name',
            city: '$property.city',
            country: '$property.country'
          }
        }
      }
    ];

    const data = await this.reviewModel.aggregate(pipeline as any);
    const total = reviews.length;
    const hasNext = (page * limit) < total;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        hasNext,
      },
    };
  }

  async computePropertyStats(reviews: ReviewRecord[]): Promise<PropertyStat[]> {
    // Ultra-fast: Single aggregation with lookup
    const propertyIds = reviews.map(r => r.propertyId);
    
    const pipeline = [
      {
        $match: {
          propertyId: { $in: propertyIds },
          approvedForPublic: true
        }
      },
      {
        $group: {
          _id: '$propertyId',
          reviewCount: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          goodCount: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
          neutralCount: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          badCount: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } },
          lastReviewDate: { $max: '$reviewDate' },
          airbnbCount: { $sum: { $cond: [{ $eq: ['$channel', 'airbnb'] }, 1, 0] } },
          bookingCount: { $sum: { $cond: [{ $eq: ['$channel', 'booking'] }, 1, 0] } },
          directCount: { $sum: { $cond: [{ $eq: ['$channel', 'direct'] }, 1, 0] } },
          googleCount: { $sum: { $cond: [{ $eq: ['$channel', 'google'] }, 1, 0] } },
          // Category averages
          avgCleanliness: { $avg: '$categories.cleanliness' },
          avgCommunication: { $avg: '$categories.communication' },
          avgLocation: { $avg: '$categories.location' },
          avgCheckin: { $avg: '$categories.checkin' },
          avgAccuracy: { $avg: '$categories.accuracy' },
          avgValue: { $avg: '$categories.value' }
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: '_id',
          foreignField: '_id',
          as: 'property',
          pipeline: [{ $project: { _id: 1, name: 1, city: 1, country: 1, imageUrl: 1 } }]
        }
      },
      {
        $unwind: '$property'
      },
      {
        $project: {
          propertyId: '$_id',
          name: '$property.name',
          city: '$property.city',
          country: '$property.country',
          imageUrl: '$property.imageUrl',
          avgRating: { $round: ['$avgRating', 2] },
          reviews: '$reviewCount',
          lastReviewDate: '$lastReviewDate',
          goodCount: '$goodCount',
          neutralCount: '$neutralCount',
          badCount: '$badCount',
          airbnbCount: '$airbnbCount',
          bookingCount: '$bookingCount',
          directCount: '$directCount',
          googleCount: '$googleCount',
          // Category averages
          avgCleanliness: { $round: ['$avgCleanliness', 1] },
          avgCommunication: { $round: ['$avgCommunication', 1] },
          avgLocation: { $round: ['$avgLocation', 1] },
          avgCheckin: { $round: ['$avgCheckin', 1] },
          avgAccuracy: { $round: ['$avgAccuracy', 1] },
          avgValue: { $round: ['$avgValue', 1] }
        }
      }
    ];

    const results = await this.reviewModel.aggregate(pipeline);
    
    return results.map(result => {
      const channelCounts: Record<string, number> = {};
      if (result.airbnbCount > 0) channelCounts.airbnb = result.airbnbCount;
      if (result.bookingCount > 0) channelCounts.booking = result.bookingCount;
      if (result.directCount > 0) channelCounts.direct = result.directCount;
      if (result.googleCount > 0) channelCounts.google = result.googleCount;
      
      // Build worthyMentions from category averages
      const categoryAverages: Record<string, number> = {};
      if (result.avgCleanliness) categoryAverages.cleanliness = result.avgCleanliness;
      if (result.avgCommunication) categoryAverages.communication = result.avgCommunication;
      if (result.avgLocation) categoryAverages.location = result.avgLocation;
      if (result.avgCheckin) categoryAverages.checkin = result.avgCheckin;
      if (result.avgAccuracy) categoryAverages.accuracy = result.avgAccuracy;
      if (result.avgValue) categoryAverages.value = result.avgValue;
      
      return {
        propertyId: result.propertyId.toString(),
        name: result.name,
        city: result.city,
        country: result.country,
        imageUrl: result.imageUrl,
        avgRating: result.avgRating,
        reviews: result.reviews,
        lastReviewDate: result.lastReviewDate ? new Date(result.lastReviewDate).toISOString() : undefined,
        goodCount: result.goodCount,
        neutralCount: result.neutralCount,
        badCount: result.badCount,
        channelCounts,
        categoryAverages,
        stayNights: { count: 0, sum: 0 }, // Will be populated if needed
      };
    });
  }

  pickTop(
    propertyStats: PropertyStat[],
    order: 'asc' | 'desc',
    options?: { limit?: number; minReviews?: number },
  ): TopProperty[] {
    const limit = Math.max(1, options?.limit ?? DEFAULT_TOP_LIMIT);
    const minReviews = Math.max(1, options?.minReviews ?? DEFAULT_MIN_REVIEWS);

    return propertyStats
      .filter((stat) => stat.reviews >= minReviews)
      .sort((a, b) =>
        order === 'asc'
          ? a.avgRating - b.avgRating || a.reviews - b.reviews
          : b.avgRating - a.avgRating || b.reviews - a.reviews,
      )
      .slice(0, limit)
      .map((stat) => ({
        propertyId: stat.propertyId,
        name: stat.name,
        city: stat.city,
        avgRating: Number(stat.avgRating.toFixed(2)),
        reviews: stat.reviews,
      }));
  }

  aggregateTypes(reviews: ReviewRecord[], bucket: BucketGranularity) {
    if (reviews.length === 0) {
      return {
        goodPct: 0,
        neutralPct: 0,
        badPct: 0,
        timeSeries: [],
      };
    }

    const totals = {
      good: 0,
      neutral: 0,
      bad: 0,
    };

    const series = new Map<
      string,
      { good: number; neutral: number; bad: number; total: number }
    >();

    for (const review of reviews) {
      const classification = this.classifyRating(review.rating);
      totals[classification] += 1;

      const key = this.bucketKey(review.reviewDate, bucket);
      const entry = series.get(key) ?? { good: 0, neutral: 0, bad: 0, total: 0 };
      entry[classification] += 1;
      entry.total += 1;
      series.set(key, entry);
    }

    const totalReviews = reviews.length;

    return {
      goodPct: Number((totals.good / totalReviews).toFixed(2)),
      neutralPct: Number((totals.neutral / totalReviews).toFixed(2)),
      badPct: Number((totals.bad / totalReviews).toFixed(2)),
      timeSeries: Array.from(series.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([bucketKey, entry]) => ({
          t: bucketKey,
          good: Number((entry.good / entry.total).toFixed(2)),
          neutral: Number((entry.neutral / entry.total).toFixed(2)),
          bad: Number((entry.bad / entry.total).toFixed(2)),
        })),
    };
  }

  aggregateVolume(reviews: ReviewRecord[], bucket: BucketGranularity) {
    const histogram = new Map<string, number>();

    for (const review of reviews) {
      const key = this.bucketKey(review.reviewDate, bucket);
      histogram.set(key, (histogram.get(key) ?? 0) + 1);
    }

    return {
      histogram: Array.from(histogram.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([bucketKey, count]) => ({ bucket: bucketKey, count })),
    };
  }

  aggregateStays(reviews: ReviewRecord[]) {
    const counts = {
      '1-2': 0,
      '3-5': 0,
      '6+': 0,
    } as Record<'1-2' | '3-5' | '6+', number>;

    let nightsAvailable = false;

    for (const review of reviews) {
      const nights = this.getStayNights(review);
      if (typeof nights !== 'number' || Number.isNaN(nights)) {
        continue;
      }
      nightsAvailable = true;
      if (nights <= 2) {
        counts['1-2'] += 1;
      } else if (nights <= 5) {
        counts['3-5'] += 1;
      } else {
        counts['6+'] += 1;
      }
    }

    if (!nightsAvailable) {
      throw new NotImplementedException({ reason: 'stay_length_unavailable' });
    }

    const total = counts['1-2'] + counts['3-5'] + counts['6+'];
    if (total === 0) {
      return { lengthDist: [] };
    }

    return {
      lengthDist: (
        [
          { label: '1-2', value: counts['1-2'] },
          { label: '3-5', value: counts['3-5'] },
          { label: '6+', value: counts['6+'] },
        ] as const
      )
        .filter((entry) => entry.value > 0)
        .map((entry) => ({
          nights: entry.label,
          pct: Number((entry.value / total).toFixed(2)),
        })),
    };
  }

  async aggregateInsights(
    reviews: ReviewRecord[],
    typesSection: { goodPct: number; badPct: number },
  ) {
    if (reviews.length === 0) {
      return {
        goodBlurb: 'No reviews available for the selected filters yet.',
        badBlurb: 'No negative signals due to lack of reviews.',
        goodPct: 0,
        badPct: 0,
        links: [],
      };
    }

    const propertyStats = await this.computePropertyStats(reviews);
    const topGood = this.pickTop(propertyStats, 'desc', { limit: 3 });
    const topBad = this.pickTop(propertyStats, 'asc', { limit: 3 });

    // Generate location-based insights
    const locationStats = new Map<string, { good: number; bad: number; total: number; names: string[] }>();
    
    for (const stat of propertyStats) {
      const location = stat.city || 'Unknown';
      if (!locationStats.has(location)) {
        locationStats.set(location, { good: 0, bad: 0, total: 0, names: [] });
      }
      
      const locationData = locationStats.get(location)!;
      locationData.good += stat.goodCount;
      locationData.bad += stat.badCount;
      locationData.total += stat.reviews;
      locationData.names.push(stat.name);
    }

    // Find best and worst performing locations
    let bestLocation = '';
    let worstLocation = '';
    let bestGoodRatio = 0;
    let worstBadRatio = 0;

    for (const [location, data] of locationStats) {
      if (data.total >= 2) { // Only consider locations with multiple reviews
        const goodRatio = data.good / data.total;
        const badRatio = data.bad / data.total;
        
        if (goodRatio > bestGoodRatio) {
          bestGoodRatio = goodRatio;
          bestLocation = location;
        }
        
        if (badRatio > worstBadRatio) {
          worstBadRatio = badRatio;
          worstLocation = location;
        }
      }
    }

    const goodBlurb = bestLocation && bestGoodRatio > 0.7
      ? `Locations like ${bestLocation} get consistently good reviews`
      : topGood.length
      ? `Guests love ${topGood[0].name} (${topGood[0].avgRating}★ avg).`
      : 'Properties are earning positive feedback.';

    const badBlurb = worstLocation && worstBadRatio > 0.3
      ? `${worstLocation} properties have frequent bad reviews lately`
      : topBad.length
      ? `${topBad[0].name} is trending down with ${topBad[0].avgRating}★.`
      : 'No notable negative trends detected.';

    return {
      goodBlurb,
      badBlurb,
      goodPct: typesSection.goodPct,
      badPct: typesSection.badPct,
      links: this.buildInsightLinks(topGood, topBad),
    };
  }

  private sortPropertyStats(
    stats: PropertyStat[],
    sort: 'topRated' | 'mostReviews' | 'recent' | 'badShare' | undefined,
  ) {
    const sorted = stats.slice();

    switch (sort) {
      case 'mostReviews':
        sorted.sort((a, b) =>
          b.reviews - a.reviews || b.avgRating - a.avgRating || this.compareDates(b, a),
        );
        break;
      case 'recent':
        sorted.sort((a, b) => this.compareDates(b, a) || b.reviews - a.reviews);
        break;
      case 'badShare':
        sorted.sort((a, b) =>
          this.computeShare(b.badCount, b.reviews) - this.computeShare(a.badCount, a.reviews) ||
          b.reviews - a.reviews,
        );
        break;
      case 'topRated':
      default:
        sorted.sort((a, b) =>
          b.avgRating - a.avgRating || b.reviews - a.reviews || this.compareDates(b, a),
        );
        break;
    }

    return sorted;
  }

  private compareDates(a: PropertyStat, b: PropertyStat) {
    const aTime = a.lastReviewDate ? new Date(a.lastReviewDate).valueOf() : 0;
    const bTime = b.lastReviewDate ? new Date(b.lastReviewDate).valueOf() : 0;
    return aTime - bTime;
  }

  private buildPropertyCard(stat: PropertyStat) {
    const goodShare = this.computeShare(stat.goodCount, stat.reviews);
    const neutralShare = this.computeShare(stat.neutralCount, stat.reviews);
    const badShare = this.computeShare(stat.badCount, stat.reviews);

    const averageStay =
      stat.stayNights.count > 0 ? stat.stayNights.sum / stat.stayNights.count : undefined;

    const worthyMentions = this.buildWorthyMentions(stat.categoryAverages);

    return {
      id: stat.propertyId,
      name: stat.name,
      city: stat.city ?? null,
      country: stat.country ?? null,
      imageUrl: stat.imageUrl ?? null,
      avgRating: Number(stat.avgRating.toFixed(2)),
      totalReviews: stat.reviews,
      lastReviewDate: stat.lastReviewDate ?? null,
      goodShare: Number(goodShare.toFixed(2)),
      neutralShare: Number(neutralShare.toFixed(2)),
      badShare: Number(badShare.toFixed(2)),
      worthyMentions,
      channels: Object.entries(stat.channelCounts)
        .map(([code, count]) => ({ channel: code, count }))
        .sort((a, b) => b.count - a.count),
      staySummary:
        stat.stayNights.count > 0
          ? {
              averageNights: Number((averageStay ?? 0).toFixed(1)),
              minNights: stat.stayNights.min ?? null,
              maxNights: stat.stayNights.max ?? null,
            }
          : null,
      links: {
        reviews: `/drilldown/reviews?propertyId=${stat.propertyId}`,
        insights: `/analytics/properties/${stat.propertyId}`,
      },
    };
  }

  private buildWorthyMentions(categoryAverages: Record<string, number>) {
    return Object.entries(categoryAverages)
      .filter(([, value]) => typeof value === 'number' && !Number.isNaN(value))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, score]) => ({
        category,
        label: this.formatCategoryLabel(category),
        score: Number(score.toFixed(2)),
      }));
  }

  private normalizeLimit(limit?: number) {
    if (typeof limit !== 'number' || Number.isNaN(limit)) {
      return 20;
    }
    const rounded = Math.floor(limit);
    return Math.min(Math.max(1, rounded), MAX_PROPERTY_LIST_LIMIT);
  }

  private decodePageToken(token?: string) {
    if (!token) {
      return 0;
    }
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded) as { offset?: number };
      if (typeof parsed.offset === 'number' && parsed.offset >= 0) {
        return parsed.offset;
      }
    } catch {
      return 0;
    }
    return 0;
  }

  private encodePageToken(offset: number) {
    if (offset <= 0) {
      return null;
    }
    return Buffer.from(JSON.stringify({ offset })).toString('base64');
  }

  private computeShare(count: number, total: number) {
    if (!total || total <= 0) {
      return 0;
    }
    return count / total;
  }

  private formatCategoryLabel(category: string) {
    const normalized = category.toLowerCase();
    if ((CATEGORY_KEYS as readonly string[]).includes(normalized)) {
      return CATEGORY_LABELS[normalized as CategoryKey];
    }
    return normalized
      .split(/\s|_/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private buildInsightLinks(topGood: TopProperty[], topBad: TopProperty[]) {
    const links: Array<{ label: string; href: string }> = [];

    if (topGood.length) {
      links.push({
        label: `See positive reviews for ${topGood[0].name}`,
        href: `/drilldown/reviews?propertyId=${topGood[0].propertyId}&kind=good`,
      });
    }

    if (topBad.length) {
      links.push({
        label: `See issues for ${topBad[0].name}`,
        href: `/drilldown/reviews?propertyId=${topBad[0].propertyId}&kind=bad`,
      });
    }

    return links;
  }

  private classifyRating(rating: number): 'good' | 'neutral' | 'bad' {
    if (rating >= 4) {
      return 'good';
    }
    if (rating <= 2) {
      return 'bad';
    }
    return 'neutral';
  }

  private bucketKey(dateLike: string | Date, bucket: BucketGranularity) {
    switch (bucket) {
      case 'day':
        return this.formatDay(dateLike);
      case 'week':
        return this.formatIsoWeek(dateLike);
      default:
        return this.formatMonth(dateLike);
    }
  }

  private formatDay(dateLike: string | Date) {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatMonth(dateLike: string | Date) {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private formatIsoWeek(dateLike: string | Date) {
    const source = typeof dateLike === 'string' ? new Date(dateLike) : new Date(dateLike.valueOf());
    const date = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / MS_IN_DAY + 1) / 7);
    const week = String(weekNum).padStart(2, '0');
    return `${date.getUTCFullYear()}-W${week}`;
  }

  private getStayNights(review: ReviewRecord): number | undefined {
    const nightsRaw = (review as { stayNights?: number }).stayNights;
    if (typeof nightsRaw === 'number' && nightsRaw > 0) {
      return nightsRaw;
    }

    const checkoutDate = (review as { checkoutDate?: string | Date }).checkoutDate;
    if (review.stayDate && checkoutDate) {
      const start = new Date(review.stayDate);
      const end = new Date(checkoutDate);
      const diff = Math.round((end.getTime() - start.getTime()) / MS_IN_DAY);
      return diff > 0 ? diff : undefined;
    }

    return undefined;
  }

  private unwrap(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private parseDate(value?: string) {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
  }
}
