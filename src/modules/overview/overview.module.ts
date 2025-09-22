import { Module } from '@nestjs/common';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [AnalyticsModule, ReviewsModule, PropertiesModule],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}
