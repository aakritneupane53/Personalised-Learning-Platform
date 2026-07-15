import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from './entities/user-progress.entity';
import { Course } from '../course/entities/course.entity';
import { ModuleEntity } from '../course/entities/module.entity';
import { Lesson } from '../course-content/entities/lesson.entity';

export interface CourseProgressSummary {
  courseId: string;
  title: string;
  category: string;
  status: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  lastActivityAt: string | null;
}

export interface UserProgressSummary {
  totalCourses: number;
  coursesCompleted: number;
  coursesInProgress: number;
  coursesNotStarted: number;
  totalLessonsCompleted: number;
  totalLessons: number;
  overallPercentComplete: number;
  courses: CourseProgressSummary[];
}

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepository: Repository<UserProgress>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  /**
   * Upserts the progress row for a user/lesson pair — one row per pair,
   * enforced by the unique(userId, lessonId) constraint on the entity.
   */
  async markProgress(
    userId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<UserProgress> {
    let progress = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      progress = this.progressRepository.create({ userId, lessonId });
    }

    progress.completed = completed;
    progress.completedAt = completed ? new Date() : null;

    return await this.progressRepository.save(progress);
  }

  /**
   * Returns null rather than throwing — "no progress yet" is a normal state
   * for a lesson the user hasn't started, not an error.
   */
  async findByLesson(
    userId: string,
    lessonId: string,
  ): Promise<UserProgress | null> {
    return await this.progressRepository.findOne({
      where: { userId, lessonId },
    });
  }

  async findByModule(
    userId: string,
    moduleId: string,
  ): Promise<UserProgress[]> {
    return await this.progressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.lesson', 'lesson')
      .where('progress.userId = :userId', { userId })
      .andWhere('lesson.moduleId = :moduleId', { moduleId })
      .getMany();
  }

  async findAllForUser(userId: string): Promise<UserProgress[]> {
    return await this.progressRepository.find({ where: { userId } });
  }

  /**
   * One aggregate query per user: courses -> modules -> lessons -> progress,
   * grouped by course. No userId filter is needed on the progress join —
   * courses (and therefore their lessons) belong to exactly one owner, so
   * every progress row reachable from this user's courses is already theirs.
   */
  async getSummary(userId: string): Promise<UserProgressSummary> {
    const raw = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin(ModuleEntity, 'module', 'module.courseId = course.id')
      .leftJoin(Lesson, 'lesson', 'lesson.moduleId = module.id')
      .leftJoin(UserProgress, 'progress', 'progress.lessonId = lesson.id')
      .where('course.userId = :userId', { userId })
      .select('course.id', 'courseId')
      .addSelect('course.title', 'title')
      .addSelect('course.category', 'category')
      .addSelect('course.status', 'status')
      .addSelect('COUNT(DISTINCT lesson.id)', 'totalLessons')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN progress.completed = true THEN progress.lessonId END)',
        'completedLessons',
      )
      .addSelect('MAX(progress.completedAt)', 'lastActivityAt')
      .groupBy('course.id')
      .orderBy('course.createdAt', 'DESC')
      .getRawMany<{
        courseId: string;
        title: string;
        category: string;
        status: string;
        totalLessons: string;
        completedLessons: string;
        lastActivityAt: string | null;
      }>();

    const courses: CourseProgressSummary[] = raw.map((row) => {
      const totalLessons = Number(row.totalLessons);
      const completedLessons = Number(row.completedLessons);

      return {
        courseId: row.courseId,
        title: row.title,
        category: row.category,
        status: row.status,
        totalLessons,
        completedLessons,
        percentComplete:
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
        lastActivityAt: row.lastActivityAt,
      };
    });

    const totalLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0);
    const totalLessonsCompleted = courses.reduce(
      (sum, c) => sum + c.completedLessons,
      0,
    );

    return {
      totalCourses: courses.length,
      coursesCompleted: courses.filter(
        (c) => c.totalLessons > 0 && c.completedLessons === c.totalLessons,
      ).length,
      coursesInProgress: courses.filter(
        (c) => c.completedLessons > 0 && c.completedLessons < c.totalLessons,
      ).length,
      coursesNotStarted: courses.filter((c) => c.completedLessons === 0)
        .length,
      totalLessonsCompleted,
      totalLessons,
      overallPercentComplete:
        totalLessons > 0
          ? Math.round((totalLessonsCompleted / totalLessons) * 100)
          : 0,
      courses,
    };
  }
}
