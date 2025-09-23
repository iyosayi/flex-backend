import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { OverviewModule } from './modules/overview/overview.module';
import { PropertiesModule } from './modules/properties/properties.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    ReviewsModule,
    OverviewModule,
    PropertiesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
