// src/course-content/course-content.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseContentService } from './course-content.service';
import { CourseContentController } from './course-content.controller'; // Added placeholder controller import
import { Lesson } from './entities/lesson.entity';
import { QuizQuestionEntity } from './entities/quiz-question.entity';
import { CourseModule } from '../course/course.module'; // Imports your ModulesService & CourseService
import { AiModule } from '../ai/ai.module'; // Imports your configured AiService with groqDeep

@Module({
  imports: [
    // Register the specific structural repositories managed within this domain boundary
    TypeOrmModule.forFeature([Lesson, QuizQuestionEntity]),

    // Leverage cross-module exported features
    CourseModule,
    AiModule,
  ],
  providers: [CourseContentService],
  controllers: [CourseContentController], // Wired up for the route handling layer
  exports: [CourseContentService], // Exported in case you ever need to reference it externally
})
export class CourseContentModule {}
