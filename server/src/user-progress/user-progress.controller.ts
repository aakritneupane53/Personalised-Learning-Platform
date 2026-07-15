import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserProgressService } from './user-progress.service';
import { MarkProgressDto } from './dto/mark-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('user-progress')
@UseGuards(JwtAuthGuard)
export class UserProgressController {
  constructor(private readonly userProgressService: UserProgressService) {}

  /**
   * Mark a lesson as completed/incomplete for the authenticated user (upsert).
   * PATCH /user-progress/lessons/:lessonId
   */
  @Patch('lessons/:lessonId')
  async markLessonProgress(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() markProgressDto: MarkProgressDto,
    @User() user: any,
  ) {
    return await this.userProgressService.markProgress(
      user.id,
      lessonId,
      markProgressDto.completed,
    );
  }

  /**
   * Get the authenticated user's progress for a single lesson.
   * GET /user-progress/lessons/:lessonId
   */
  @Get('lessons/:lessonId')
  async getLessonProgress(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @User() user: any,
  ) {
    return await this.userProgressService.findByLesson(user.id, lessonId);
  }

  /**
   * Get the authenticated user's progress across every lesson in a module.
   * GET /user-progress/modules/:moduleId
   */
  @Get('modules/:moduleId')
  async getModuleProgress(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @User() user: any,
  ) {
    return await this.userProgressService.findByModule(user.id, moduleId);
  }

  /**
   * Get all progress records for the authenticated user.
   * GET /user-progress/me
   */
  @Get('me')
  async getMyProgress(@User() user: any) {
    return await this.userProgressService.findAllForUser(user.id);
  }

  /**
   * Get the authenticated user's dashboard summary: overall stats plus
   * a per-course lesson-completion breakdown.
   * GET /user-progress/summary
   */
  @Get('summary')
  async getSummary(@User() user: any) {
    return await this.userProgressService.getSummary(user.id);
  }
}
