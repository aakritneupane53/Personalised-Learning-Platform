// src/course-content/entities/lesson.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string; // Core markdown text narrative

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex: number;

  @Column({ name: 'estimated_minutes', type: 'integer', default: 10 })
  estimatedMinutes: number;

  @Column({ type: 'text', nullable: true })
  examples: string; // 📑 Simplified to a plain text string block for raw code snippets

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
