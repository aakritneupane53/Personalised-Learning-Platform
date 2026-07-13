import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { CourseTestController } from './ai.controller';

@Module({
  providers: [AiService],
  controllers: [CourseTestController],
  exports: [AiService],
})
export class AiModule {}
