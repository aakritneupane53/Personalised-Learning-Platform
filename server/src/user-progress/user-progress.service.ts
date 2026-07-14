import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from './entities/user-progress.entity';

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepository: Repository<UserProgress>,
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
}
