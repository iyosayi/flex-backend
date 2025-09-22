import { MockProperty } from '../../properties/mock/mock-properties';

export interface GeneratedReview {
  source: string;
  sourceReviewId: string;
  propertyId: string;
  channel: string;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  title: string;
  text: string;
  language: string;
  stayDate: string;
  stayNights: number;
  reviewDate: string;
  categories: {
    cleanliness: number;
    communication: number;
    location: number;
    checkin: number;
    accuracy: number;
    value: number;
  };
  approvedForPublic: boolean;
  tags: string[];
  moderation: {
    approvedBy: string;
    approvedAt: string;
  };
  raw: {
    listingId: string;
    platform: string;
    reviewId: string;
  };
}

// Review quality profiles for different properties
const REVIEW_PROFILES = {
  '66f1abc1234567890abc1001': { // Louvre Loft - Excellent
    goodRatio: 0.85,
    avgRating: 4.7,
    categoryBias: { cleanliness: 0.1, communication: 0.1, location: 0.2, checkin: 0.0, accuracy: 0.1, value: 0.1 }
  },
  '66f1abc1234567890abc1002': { // Seine Retreat - Good
    goodRatio: 0.75,
    avgRating: 4.3,
    categoryBias: { cleanliness: 0.0, communication: 0.1, location: 0.2, checkin: 0.1, accuracy: 0.0, value: 0.1 }
  },
  '66f1abc1234567890abc1003': { // Atlas Comfort Suites - Mixed
    goodRatio: 0.60,
    avgRating: 3.8,
    categoryBias: { cleanliness: -0.1, communication: 0.0, location: 0.1, checkin: -0.1, accuracy: 0.0, value: 0.0 }
  },
  '66f1abc1234567890abc1004': { // Lakeview Chalet - Excellent
    goodRatio: 0.90,
    avgRating: 4.8,
    categoryBias: { cleanliness: 0.2, communication: 0.1, location: 0.3, checkin: 0.1, accuracy: 0.1, value: 0.1 }
  },
  '66f1abc1234567890abc1005': { // Tower Bridge View - Good
    goodRatio: 0.70,
    avgRating: 4.2,
    categoryBias: { cleanliness: 0.0, communication: 0.0, location: 0.3, checkin: 0.0, accuracy: 0.0, value: -0.1 }
  },
  '66f1abc1234567890abc1006': { // Casbah Palace - Poor
    goodRatio: 0.35,
    avgRating: 2.9,
    categoryBias: { cleanliness: -0.2, communication: -0.1, location: 0.1, checkin: -0.2, accuracy: -0.1, value: -0.2 }
  },
  '66f1abc1234567890abc1007': { // Champs Elysees Suite - Excellent
    goodRatio: 0.88,
    avgRating: 4.6,
    categoryBias: { cleanliness: 0.1, communication: 0.1, location: 0.2, checkin: 0.1, accuracy: 0.1, value: 0.0 }
  },
  '66f1abc1234567890abc1008': { // Riverside Apartment - Mixed
    goodRatio: 0.65,
    avgRating: 3.9,
    categoryBias: { cleanliness: 0.0, communication: 0.0, location: 0.2, checkin: 0.0, accuracy: 0.0, value: -0.1 }
  }
};

const CHANNELS = ['airbnb', 'booking', 'direct', 'google'];
const LANGUAGES = ['en', 'fr', 'es', 'de', 'it'];
const REVIEW_TITLES = {
  positive: [
    'Amazing stay!', 'Perfect location', 'Excellent host', 'Beautiful property', 'Highly recommend',
    'Fantastic experience', 'Great value', 'Wonderful place', 'Outstanding service', 'Loved it!'
  ],
  neutral: [
    'Good stay', 'Nice place', 'Decent location', 'Average experience', 'Okay for the price',
    'Standard accommodation', 'Fair value', 'Acceptable', 'Not bad', 'Met expectations'
  ],
  negative: [
    'Disappointing', 'Not as described', 'Poor communication', 'Overpriced', 'Noisy location',
    'Cleanliness issues', 'Check-in problems', 'Uncomfortable', 'Would not recommend', 'Below expectations'
  ]
};

const REVIEW_TEXTS = {
  positive: [
    'The apartment was spotless and very central. Highly recommend!',
    'Perfect location with amazing views. The host was very responsive.',
    'Beautiful property with all amenities. Will definitely stay again.',
    'Excellent communication and check-in process. The place exceeded expectations.',
    'Great value for money. Clean, comfortable, and well-located.',
    'Fantastic experience from start to finish. The host was wonderful.',
    'Outstanding property with great attention to detail.',
    'Loved every minute of our stay. Highly recommend this place.',
    'Perfect for our needs. Clean, modern, and in a great location.',
    'Exceptional service and beautiful accommodation.'
  ],
  neutral: [
    'The place was okay for the price. Location was decent.',
    'Standard accommodation. Nothing special but met our basic needs.',
    'Average experience. The place was clean but could use some updates.',
    'Fair value for money. Good location but some minor issues.',
    'Acceptable stay. The property was functional but not exceptional.',
    'Decent place to stay. Some pros and cons but overall okay.',
    'Met our expectations. Nothing outstanding but nothing terrible either.',
    'Standard experience. The place served its purpose.',
    'Average accommodation. Good location but room for improvement.',
    'Acceptable for a short stay. Basic amenities provided.'
  ],
  negative: [
    'The apartment was not as described. Several issues with cleanliness.',
    'Poor communication from the host. Check-in was problematic.',
    'Overpriced for what you get. The location was noisy.',
    'Disappointing experience. The property needs significant updates.',
    'Would not recommend. Multiple issues during our stay.',
    'Below expectations. The place was not well maintained.',
    'Uncomfortable stay. Several problems that were not addressed.',
    'Not worth the money. The property had multiple issues.',
    'Poor value for money. The place was not as advertised.',
    'Disappointing. The host was unresponsive to our concerns.'
  ]
};

const AUTHOR_NAMES = [
  'Alice Johnson', 'Marco Rossi', 'Sarah Chen', 'Pierre Dubois', 'Emma Wilson',
  'Carlos Rodriguez', 'Anna Mueller', 'James Smith', 'Sophie Martin', 'David Brown',
  'Maria Garcia', 'Thomas Anderson', 'Lisa Taylor', 'Michael Johnson', 'Jennifer Davis',
  'Robert Miller', 'Linda Wilson', 'William Moore', 'Patricia Taylor', 'Christopher Anderson',
  'Barbara Thomas', 'Daniel Jackson', 'Susan White', 'Matthew Harris', 'Jessica Martin',
  'Anthony Thompson', 'Nancy Garcia', 'Mark Martinez', 'Betty Robinson', 'Donald Clark',
  'Dorothy Rodriguez', 'Steven Lewis', 'Sandra Lee', 'Paul Walker', 'Donna Hall',
  'Andrew Allen', 'Carol Young', 'Joshua King', 'Ruth Wright', 'Kenneth Lopez',
  'Sharon Hill', 'Kevin Scott', 'Michelle Green', 'Brian Adams', 'Laura Baker',
  'Edward Gonzalez', 'Deborah Nelson', 'Ronald Carter', 'Amy Mitchell', 'Timothy Perez',
  'Angela Roberts', 'Jason Turner', 'Brenda Phillips', 'Jeffrey Campbell', 'Pamela Parker',
  'Ryan Evans', 'Shirley Edwards', 'Jacob Collins', 'Cynthia Stewart', 'Gary Sanchez',
  'Kathleen Morris', 'Nicholas Rogers', 'Helen Reed', 'Eric Cook', 'Marie Morgan',
  'Jonathan Bell', 'Janet Murphy', 'Stephen Bailey', 'Frances Rivera', 'Larry Cooper',
  'Christine Richardson', 'Scott Cox', 'Martha Ward', 'Wayne Torres', 'Joan Peterson',
  'Raymond Gray', 'Evelyn Ramirez', 'Patrick James', 'Gloria Watson', 'Peter Brooks',
  'Virginia Kelly', 'Harold Sanders', 'Judith Price', 'Douglas Bennett', 'Mildred Wood',
  'Arthur Barnes', 'Elizabeth Ross', 'Frank Henderson', 'Lois Coleman', 'Jack Jenkins',
  'Ruby Perry', 'Lawrence Powell', 'Irene Long', 'Eugene Patterson', 'Florence Hughes',
  'Howard Flores', 'Marilyn Washington', 'Louis Butler', 'Lillian Simmons', 'Ralph Foster'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

function generateCategories(rating: number, bias: Record<string, number>): {
  cleanliness: number;
  communication: number;
  location: number;
  checkin: number;
  accuracy: number;
  value: number;
} {
  const baseRating = rating;
  return {
    cleanliness: Math.max(1, Math.min(5, Math.round(baseRating + (bias.cleanliness || 0) + (Math.random() - 0.5) * 0.5))),
    communication: Math.max(1, Math.min(5, Math.round(baseRating + (bias.communication || 0) + (Math.random() - 0.5) * 0.5))),
    location: Math.max(1, Math.min(5, Math.round(baseRating + (bias.location || 0) + (Math.random() - 0.5) * 0.5))),
    checkin: Math.max(1, Math.min(5, Math.round(baseRating + (bias.checkin || 0) + (Math.random() - 0.5) * 0.5))),
    accuracy: Math.max(1, Math.min(5, Math.round(baseRating + (bias.accuracy || 0) + (Math.random() - 0.5) * 0.5))),
    value: Math.max(1, Math.min(5, Math.round(baseRating + (bias.value || 0) + (Math.random() - 0.5) * 0.5)))
  };
}

function generateReview(property: MockProperty, reviewIndex: number): GeneratedReview {
  const profile = REVIEW_PROFILES[property.id];
  const isGoodReview = Math.random() < profile.goodRatio;
  
  let rating: number;
  let title: string;
  let text: string;
  let tags: string[];
  
  if (isGoodReview) {
    rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
    title = getRandomElement(REVIEW_TITLES.positive);
    text = getRandomElement(REVIEW_TEXTS.positive);
    tags = ['positive', getRandomElement(['family', 'business', 'couple', 'solo'])];
  } else if (Math.random() < 0.3) {
    rating = 3; // Neutral
    title = getRandomElement(REVIEW_TITLES.neutral);
    text = getRandomElement(REVIEW_TEXTS.neutral);
    tags = ['neutral', getRandomElement(['family', 'business', 'couple', 'solo'])];
  } else {
    rating = Math.floor(Math.random() * 2) + 1; // 1 or 2
    title = getRandomElement(REVIEW_TITLES.negative);
    text = getRandomElement(REVIEW_TEXTS.negative);
    tags = ['negative', getRandomElement(['family', 'business', 'couple', 'solo'])];
  }
  
  const stayDate = getRandomDate(new Date('2024-01-01'), new Date('2025-09-01'));
  const reviewDate = getRandomDate(new Date(stayDate), new Date());
  const stayNights = Math.floor(Math.random() * 14) + 1; // 1-14 nights
  
  return {
    source: 'hostaway',
    sourceReviewId: `rvw_${property.id.slice(-4)}_${reviewIndex.toString().padStart(3, '0')}`,
    propertyId: property.id,
    channel: getRandomElement(CHANNELS),
    authorName: getRandomElement(AUTHOR_NAMES),
    authorAvatarUrl: `https://example.com/avatar/${Math.random().toString(36).substr(2, 9)}.jpg`,
    rating,
    title,
    text,
    language: getRandomElement(LANGUAGES),
    stayDate,
    stayNights,
    reviewDate,
    categories: generateCategories(rating, profile.categoryBias),
    approvedForPublic: true,
    tags,
    moderation: {
      approvedBy: '66f1manager001',
      approvedAt: new Date(reviewDate).toISOString()
    },
    raw: {
      listingId: `hst_${property.id.slice(-4)}`,
      platform: getRandomElement(CHANNELS),
      reviewId: `rvw_${property.id.slice(-4)}_${reviewIndex.toString().padStart(3, '0')}`
    }
  };
}

export function generateReviewsForProperties(properties: MockProperty[]): GeneratedReview[] {
  const allReviews: GeneratedReview[] = [];
  
  for (const property of properties) {
    for (let i = 1; i <= 100; i++) {
      allReviews.push(generateReview(property, i));
    }
  }
  
  return allReviews;
}
