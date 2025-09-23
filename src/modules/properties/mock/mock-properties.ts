export interface MockProperty {
  id: string;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
  avgRating: number;
  totalReviews: number;
  goodShare: number;
  badShare: number;
  reviewCategory: Array<{
    category: string;
    score: number;
  }>;
  channels: Array<{
    channel: string;
    count: number;
  }>;
  staySummary: {
    averageNights: number;
    minNights: number;
    maxNights: number;
  };
  links: {
    reviews: string;
    insights: string;
  };
}

export const mockProperties: MockProperty[] = [
  {
    id: '66f1abc1234567890abc1001',
    name: 'Deluxe 2 Bed Flat with Balcony in Hackney',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center',
    avgRating: 4.8,
    totalReviews: 1240,
    goodShare: 90.0,
    badShare: 4.5,
    reviewCategory: [
      { category: 'cleanliness', score: 5.0 },
      { category: 'location', score: 5.0 },
      { category: 'service', score: 5.0 }
    ],
    channels: [
      { channel: 'airbnb', count: 800 },
      { channel: 'booking', count: 440 }
    ],
    staySummary: {
      averageNights: 3.2,
      minNights: 1,
      maxNights: 14
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1001',
      insights: '/analytics/properties/66f1abc1234567890abc1001'
    }
  },
  {
    id: '66f1abc1234567890abc1002',
    name: 'Seine Retreat',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center',
    avgRating: 4.6,
    totalReviews: 890,
    goodShare: 85.2,
    badShare: 6.8,
    reviewCategory: [
      { category: 'cleanliness', score: 4.8 },
      { category: 'location', score: 4.9 },
      { category: 'communication', score: 4.7 }
    ],
    channels: [
      { channel: 'airbnb', count: 600 },
      { channel: 'booking', count: 290 }
    ],
    staySummary: {
      averageNights: 2.8,
      minNights: 1,
      maxNights: 10
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1002',
      insights: '/analytics/properties/66f1abc1234567890abc1002'
    }
  },
  {
    id: '66f1abc1234567890abc1003',
    name: 'Atlas Comfort Suites',
    city: 'Marrakesh',
    country: 'Morocco',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop&crop=center',
    avgRating: 3.6,
    totalReviews: 450,
    goodShare: 65.0,
    badShare: 15.2,
    reviewCategory: [
      { category: 'location', score: 4.2 },
      { category: 'value', score: 4.0 },
      { category: 'cleanliness', score: 3.8 }
    ],
    channels: [
      { channel: 'booking', count: 300 },
      { channel: 'direct', count: 150 }
    ],
    staySummary: {
      averageNights: 4.1,
      minNights: 2,
      maxNights: 21
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1003',
      insights: '/analytics/properties/66f1abc1234567890abc1003'
    }
  },
  {
    id: '66f1abc1234567890abc1004',
    name: 'Lakeview Chalet',
    city: 'Zurich',
    country: 'Switzerland',
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&crop=center',
    avgRating: 4.9,
    totalReviews: 2100,
    goodShare: 94.5,
    badShare: 2.1,
    reviewCategory: [
      { category: 'cleanliness', score: 5.0 },
      { category: 'location', score: 5.0 },
      { category: 'communication', score: 4.9 },
      { category: 'value', score: 4.8 }
    ],
    channels: [
      { channel: 'airbnb', count: 1200 },
      { channel: 'booking', count: 700 },
      { channel: 'google', count: 200 }
    ],
    staySummary: {
      averageNights: 5.2,
      minNights: 2,
      maxNights: 28
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1004',
      insights: '/analytics/properties/66f1abc1234567890abc1004'
    }
  },
  {
    id: '66f1abc1234567890abc1005',
    name: 'Tower Bridge View',
    city: 'London',
    country: 'United Kingdom',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=center',
    avgRating: 4.3,
    totalReviews: 1680,
    goodShare: 78.5,
    badShare: 8.9,
    reviewCategory: [
      { category: 'location', score: 4.8 },
      { category: 'cleanliness', score: 4.2 },
      { category: 'communication', score: 4.1 }
    ],
    channels: [
      { channel: 'airbnb', count: 1000 },
      { channel: 'booking', count: 500 },
      { channel: 'direct', count: 180 }
    ],
    staySummary: {
      averageNights: 3.5,
      minNights: 1,
      maxNights: 14
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1005',
      insights: '/analytics/properties/66f1abc1234567890abc1005'
    }
  },
  {
    id: '66f1abc1234567890abc1006',
    name: 'Casbah Palace',
    city: 'Algiers',
    country: 'Algeria',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
    avgRating: 2.9,
    totalReviews: 320,
    goodShare: 45.0,
    badShare: 25.8,
    reviewCategory: [
      { category: 'location', score: 3.5 },
      { category: 'value', score: 3.2 },
      { category: 'cleanliness', score: 2.8 }
    ],
    channels: [
      { channel: 'booking', count: 200 },
      { channel: 'direct', count: 120 }
    ],
    staySummary: {
      averageNights: 6.8,
      minNights: 3,
      maxNights: 30
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1006',
      insights: '/analytics/properties/66f1abc1234567890abc1006'
    }
  },
  {
    id: '66f1abc1234567890abc1007',
    name: 'Champs Elysees Suite',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
    avgRating: 4.7,
    totalReviews: 980,
    goodShare: 88.2,
    badShare: 5.1,
    reviewCategory: [
      { category: 'location', score: 5.0 },
      { category: 'cleanliness', score: 4.8 },
      { category: 'communication', score: 4.6 }
    ],
    channels: [
      { channel: 'airbnb', count: 650 },
      { channel: 'booking', count: 330 }
    ],
    staySummary: {
      averageNights: 2.9,
      minNights: 1,
      maxNights: 12
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1007',
      insights: '/analytics/properties/66f1abc1234567890abc1007'
    }
  },
  {
    id: '66f1abc1234567890abc1008',
    name: 'Riverside Apartment',
    city: 'London',
    country: 'United Kingdom',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop&crop=center',
    avgRating: 4.1,
    totalReviews: 720,
    goodShare: 72.5,
    badShare: 12.3,
    reviewCategory: [
      { category: 'location', score: 4.5 },
      { category: 'cleanliness', score: 4.0 },
      { category: 'value', score: 3.9 }
    ],
    channels: [
      { channel: 'airbnb', count: 450 },
      { channel: 'booking', count: 270 }
    ],
    staySummary: {
      averageNights: 4.2,
      minNights: 2,
      maxNights: 21
    },
    links: {
      reviews: '/drilldown/reviews?propertyId=66f1abc1234567890abc1008',
      insights: '/analytics/properties/66f1abc1234567890abc1008'
    }
  }
];

export const mockPropertyMap = new Map(
  mockProperties.map((property) => [property.id, property]),
);
