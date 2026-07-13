import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { ModuleEntity } from './entities/module.entity'; // 🌟 Added import
import { Repository, DataSource } from 'typeorm'; // 🌟 Added DataSource for transactions
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>, // 🌟 Added InjectRepository
    private readonly aiService: AiService,
    private readonly dataSource: DataSource, // 🌟 Injected DataSource for runtime atomic safety
  ) {}

  /**
   * TRANSACTIONAL CREATE
   * Generates AI template and populates both Courses and Modules tables atomically.
   */
  async create(
    createCourseDto: CreateCourseDto,
    authenticatedUserId: string,
  ): Promise<Course> {
    const existingCourse = await this.courseRepository.findOneBy({
      topic: createCourseDto.topic.toUpperCase(),
      skillLevel: createCourseDto.skillLevel,
    });

    if (existingCourse) {
      throw new ConflictException(
        `A course titled "${createCourseDto.topic}" for "${createCourseDto.skillLevel}" proficiency already exists.`,
      );
    }

    const aiResponse = await this.aiService.generateCourseOutline(
      createCourseDto.topic,
      createCourseDto.skillLevel,
    );

    if (!aiResponse || !Array.isArray(aiResponse.modules)) {
      throw new BadRequestException('AI outline structure validation failure.');
    }

    // Wrap both independent writes inside a single atomic sequence
    return await this.dataSource.manager.transaction(async (manager) => {
      // A. Instructure and persist the master course object shell row
      const newCourseInstance = manager.create(Course, {
        title: aiResponse.title,
        topic: createCourseDto.topic.toUpperCase(),
        skillLevel: createCourseDto.skillLevel,
        userId: authenticatedUserId,
        status: CourseStatus.DRAFT,
        rawAiOutput: aiResponse,
      });
      const savedCourse = await manager.save(Course, newCourseInstance);

      // B. Parse out matching outline nodes and assign to structural rows
      const modulesToSave = aiResponse.modules.map((mod: any) =>
        manager.create(ModuleEntity, {
          courseId: savedCourse.id, // Unidirectional field binding reference
          title: mod.title,
          orderIndex: mod.sortOrder,
          shortDescription: mod.shortDescription,
        }),
      );
      await manager.save(ModuleEntity, modulesToSave);

      return savedCourse;
    });
  }

  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find({});
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: {
        user: true,
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    return course;
  }

  async findByUserId(userId: string): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { userId },
    });
  }

  /**
   * TRANSACTIONAL UPDATE
   * Handles modifications safely. If update values impact root properties like topic/title,
   * they update cleanly while isolating downstream structures.
   */
  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    authenticatedUserId: string,
  ): Promise<Course> {
    const course = await this.findOne(id);

    if (course.userId !== authenticatedUserId) {
      throw new ForbiddenException(
        'You do not have permission to update this course',
      );
    }

    return await this.dataSource.manager.transaction(async (manager) => {
      // Merge properties and save within transaction context boundary safety
      const updatedCourseInstance = manager.merge(
        Course,
        course,
        updateCourseDto,
      );
      return await manager.save(Course, updatedCourseInstance);
    });
  }

  /**
   * TRANSACTIONAL DELETE
   * Cleans up orphaned module elements explicitly due to the lack of cascading foreign key database pointers.
   */
  async remove(id: string, authenticatedUserId: string): Promise<void> {
    const course = await this.findOne(id);

    if (course.userId !== authenticatedUserId) {
      throw new ForbiddenException(
        'You do not have permission to delete this course',
      );
    }

    await this.dataSource.manager.transaction(async (manager) => {
      // 1. Manually erase matching rows inside the modules table targeting the parent ID
      await manager.delete(ModuleEntity, { courseId: id });

      // 2. Erase the main metadata root course row safely
      await manager.delete(Course, id);
    });
  }
}
