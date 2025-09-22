export interface MockProperty {
  id: string;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
}

export const mockProperties: MockProperty[] = [
  {
    id: '66f1abc1234567890abc1001',
    name: 'Louvre Loft',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: '66f1abc1234567890abc1002',
    name: 'Seine Retreat',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: '66f1abc1234567890abc1003',
    name: 'Atlas Comfort Suites',
    city: 'Marrakesh',
    country: 'Morocco',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: '66f1abc1234567890abc1004',
    name: 'Lakeview Chalet',
    city: 'Zurich',
    country: 'Switzerland',
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: '66f1abc1234567890abc1005',
    name: 'Tower Bridge View',
    city: 'London',
    country: 'United Kingdom',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: '66f1abc1234567890abc1006',
    name: 'Casbah Palace',
    city: 'Algiers',
    country: 'Algeria',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: '66f1abc1234567890abc1007',
    name: 'Champs Elysees Suite',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: '66f1abc1234567890abc1008',
    name: 'Riverside Apartment',
    city: 'London',
    country: 'United Kingdom',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop&crop=center',
  },
];

export const mockPropertyMap = new Map(
  mockProperties.map((property) => [property.id, property]),
);
