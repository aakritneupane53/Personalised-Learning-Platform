import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course } from './entities/course.entity';
import { ModuleEntity } from './entities/module.entity';
import { AiModule } from 'src/ai/ai.module';
import { ModulesService } from './module.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, ModuleEntity]), AiModule],
  controllers: [CourseController],
  providers: [CourseService, ModulesService],
  exports: [CourseService, ModulesService], // Exporting CourseService for use in other modules if needed
})
export class CourseModule {}
