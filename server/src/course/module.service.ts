// src/course/modules.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleEntity } from './entities/module.entity';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
  ) {}

  /**
   * Fetches all modules belonging to a specific course, ordered sequentially
   */
  async findByCourseId(courseId: string): Promise<ModuleEntity[]> {
    return await this.moduleRepository.find({
      where: { courseId },
      order: { orderIndex: 'ASC' }, // Keeps lessons structural layout chronological
    });
  }

  /**
   * Critical method for the CourseContentModule.
   * Fetches a single isolated module row with absolute certainty.
   */
  async findOneWithContext(id: string): Promise<ModuleEntity> {
    const targetModule = await this.moduleRepository.findOne({
      where: { id },
    });

    if (!targetModule) {
      throw new NotFoundException(
        `Module resource with ID "${id}" could not be found.`,
      );
    }

    return targetModule;
  }

  /**
   * Optional helper to check if a module exists without returning the entire dataset
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.moduleRepository.count({ where: { id } });
    return count > 0;
  }
}
