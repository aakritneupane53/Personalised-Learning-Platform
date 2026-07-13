// src/course-content/course-content.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CourseContentService } from './course-content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('course-content')
@UseGuards(JwtAuthGuard)
export class CourseContentController {
  constructor(private readonly courseContentService: CourseContentService) {}

  /**
   * 1. Trigger Content Generation via AI (Write to both DB tables)
   * POST /course-content/modules/:moduleId/generate
   */
  @Post('modules/:moduleId/generate')
  async generateModuleContent(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @User('id') user: any,
  ) {
    return await this.courseContentService.generateDeepContentForModule(
      moduleId,
      user.id,
    );
  }

  /**
   * 2. Get all lessons for a specific module
   * GET /course-content/modules/:moduleId/lessons
   */
  @Get('modules/:moduleId/lessons')
  async getLessonsByModule(@Param('moduleId', ParseUUIDPipe) moduleId: string) {
    return await this.courseContentService.findLessonsByModule(moduleId);
  }

  /**
   * 3. Get all quiz questions for a specific module
   * GET /course-content/modules/:moduleId/quizzes
   */
  @Get('modules/:moduleId/quizzes')
  async getQuizzesByModule(@Param('moduleId', ParseUUIDPipe) moduleId: string) {
    return await this.courseContentService.findQuizzesByModule(moduleId);
  }

  /**
   * 4a. Fetch an individual lesson by its primary key
   * GET /course-content/lessons/:id
   */
  @Get('lessons/:id')
  async getLessonById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.courseContentService.findOneLesson(id);
  }

  /**
   * 4b. Fetch an individual quiz question by its primary key
   * GET /course-content/quizzes/:id
   */
  @Get('quizzes/:id')
  async getQuizById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.courseContentService.findOneQuiz(id);
  }
}
