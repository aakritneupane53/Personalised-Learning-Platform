// src/course-content/entities/quiz-question.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('quiz_questions')
export class QuizQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @Column({ name: 'question', type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: string[]; // Standard array string container: e.g., ["Option A", "Option B", ...]

  @Column({ name: 'correct_answer', type: 'varchar', length: 255 })
  correctAnswer: string; // Explicit option string match validation target

  @Column({ type: 'text', nullable: true })
  explanation: string; // Explains why the selected option is correct

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
