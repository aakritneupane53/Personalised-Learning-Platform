// src/course-content/course-content.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { QuizQuestionEntity } from './entities/quiz-question.entity';
import { ModulesService } from '../course/module.service';
import { CourseService } from '../course/course.service';
import { Course, CourseStatus } from '../course/entities/course.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CourseContentService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(QuizQuestionEntity)
    private readonly quizRepository: Repository<QuizQuestionEntity>,
    private readonly modulesService: ModulesService,
    private readonly courseService: CourseService,
    private readonly aiService: AiService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * FORCE GENERATION (POST)
   * Calls AI, saves transactionally, handles course completion logic, and returns the payload.
   */
  async generateDeepContentForModule(
    moduleId: string,
    authenticatedUserId: string,
  ) {
    const targetModule = await this.modulesService.findOneWithContext(moduleId);
    const parentCourse = await this.courseService.findOne(
      targetModule.courseId,
    );
    // console.log('Authenticated User ID:', typeof authenticatedUserId);
    // console.log('Parent Course User ID:', parentCourse.userId);
    // console.log(parentCourse.userId === authenticatedUserId);
    // console.log('Target Module:', targetModule);
    // console.log('Parent Course:', parentCourse);

    if (parentCourse.userId !== authenticatedUserId) {
      throw new NotFoundException(
        'Module resource not found or unauthorized access.',
      );
    }

    const contentPayload = await this.aiService.generateModuleContent(
      targetModule.title,
      targetModule.shortDescription || 'Comprehensive module study details.',
      parentCourse.topic,
      parentCourse.skillLevel,
    );

    const isLastModule = await this.checkIfLastModule(
      targetModule.courseId,
      targetModule.orderIndex,
    );

    return await this.dataSource.manager.transaction(async (manager) => {
      const lessonsToSave = contentPayload.lessons.map((lessonContent, index) =>
        manager.create(Lesson, {
          moduleId: targetModule.id,
          title: lessonContent.title,
          content: lessonContent.content,
          orderIndex: index + 1,
          estimatedMinutes: lessonContent.estimatedMinutes,
          examples: lessonContent.examples,
        }),
      );
      const savedLessons = await manager.save(Lesson, lessonsToSave);

      const quizQuestionsToSave = contentPayload.quiz.map((q) =>
        manager.create(QuizQuestionEntity, {
          moduleId: targetModule.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        }),
      );
      const savedQuiz = await manager.save(
        QuizQuestionEntity,
        quizQuestionsToSave,
      );

      if (isLastModule) {
        await manager.update(Course, parentCourse.id, {
          status: CourseStatus.PUBLISHED,
        });
      }

      return {
        lessons: savedLessons,
        quiz: savedQuiz,
      };
    });
  }

  /**
   * FETCH ALL LESSONS BY MODULE ID
   */
  async findLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return await this.lessonRepository.find({
      where: { moduleId },
      order: { orderIndex: 'ASC' },
    });
  }

  /**
   * FETCH ALL QUIZZES BY MODULE ID
   */
  async findQuizzesByModule(moduleId: string): Promise<QuizQuestionEntity[]> {
    return await this.quizRepository.find({
      where: { moduleId },
    });
  }

  /**
   * FETCH INDIVIDUAL LESSON BY PK
   */
  async findOneLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOneBy({ id });
    if (!lesson)
      throw new NotFoundException(`Lesson with ID "${id}" not found.`);
    return lesson;
  }

  /**
   * FETCH INDIVIDUAL QUIZ BY PK
   */
  async findOneQuiz(id: string): Promise<QuizQuestionEntity> {
    const quiz = await this.quizRepository.findOneBy({ id });
    if (!quiz)
      throw new NotFoundException(`Quiz question with ID "${id}" not found.`);
    return quiz;
  }

  private async checkIfLastModule(
    courseId: string,
    currentOrderIndex: number,
  ): Promise<boolean> {
    const modules = await this.modulesService.findByCourseId(courseId);
    if (!modules || modules.length === 0) return false;
    const maxOrderIndex = Math.max(...modules.map((m) => m.orderIndex));
    return currentOrderIndex >= maxOrderIndex;
  }
}
