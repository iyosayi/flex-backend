import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';

@Module({
  imports: [],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
