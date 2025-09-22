import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property } from '../src/modules/properties/entities/property.entity';
import { Review } from '../src/modules/reviews/entities/review.entity';
import { mockProperties } from '../src/modules/properties/mock/mock-properties';
import { generateReviewsForProperties } from '../src/modules/reviews/mock/review-generator';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const propertyModel = app.get<Model<Property>>(getModelToken('Property'));
  const reviewModel = app.get<Model<Review>>(getModelToken('Review'));

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      propertyModel.deleteMany({}),
      reviewModel.deleteMany({})
    ]);
    console.log('✅ Existing data cleared');

    // Seed properties
    console.log('🏠 Seeding properties...');
    const propertyDocuments = mockProperties.map(prop => ({
      _id: new Types.ObjectId(prop.id),
      name: prop.name,
      city: prop.city,
      country: prop.country,
      imageUrl: prop.imageUrl,
      external: {
        provider: 'hostaway' as const,
        propertyId: `hst_${prop.id.slice(-4)}`,
      },
      channelCodes: ['airbnb', 'booking', 'direct'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const insertedProperties = await propertyModel.insertMany(propertyDocuments);
    console.log(`✅ Inserted ${insertedProperties.length} properties`);

    // Generate and seed reviews
    console.log('⭐ Generating reviews...');
    const generatedReviews = generateReviewsForProperties(mockProperties);
    console.log(`📝 Generated ${generatedReviews.length} reviews`);
    
    console.log('⭐ Seeding reviews...');
    const reviewDocuments = generatedReviews.map(review => ({
      source: review.source,
      sourceReviewId: review.sourceReviewId,
      propertyId: new Types.ObjectId(review.propertyId),
      channel: review.channel,
      authorName: review.authorName,
      authorAvatarUrl: review.authorAvatarUrl,
      rating: review.rating,
      title: review.title,
      text: review.text,
      language: review.language,
      stayDate: review.stayDate ? new Date(review.stayDate) : undefined,
      stayNights: review.stayNights,
      reviewDate: new Date(review.reviewDate),
      categories: review.categories,
      approvedForPublic: review.approvedForPublic,
      tags: review.tags,
      moderation: review.moderation ? {
        ...review.moderation,
        approvedBy: undefined, // Mock data - no actual user references
        approvedAt: review.moderation.approvedAt ? new Date(review.moderation.approvedAt) : undefined,
      } : {},
      raw: review.raw,
    }));

    const insertedReviews = await reviewModel.insertMany(reviewDocuments);
    console.log(`✅ Inserted ${insertedReviews.length} reviews`);

    // Verify relationships
    console.log('🔍 Verifying data integrity...');
    const propertyCount = await propertyModel.countDocuments();
    const reviewCount = await reviewModel.countDocuments();
    const reviewsWithValidProperties = await reviewModel.countDocuments({
      propertyId: { $in: insertedProperties.map(p => p._id) }
    });

    console.log(`📊 Database Summary:`);
    console.log(`   Properties: ${propertyCount}`);
    console.log(`   Reviews: ${reviewCount}`);
    console.log(`   Reviews with valid properties: ${reviewsWithValidProperties}`);

    if (reviewsWithValidProperties === reviewCount) {
      console.log('✅ All reviews have valid property references');
    } else {
      console.log('❌ Some reviews have invalid property references');
    }

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the seeding function
seedDatabase()
  .then(() => {
    console.log('✨ Seeding script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding script failed:', error);
    process.exit(1);
  });
