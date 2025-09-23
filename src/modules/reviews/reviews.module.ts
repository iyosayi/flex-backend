import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
