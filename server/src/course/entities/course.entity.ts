import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CourseCategory {
  PROGRAMMING = 'programming',
  DATA_SCIENCE = 'data_science',
  DESIGN = 'design',
  BUSINESS = 'business',
  MARKETING = 'marketing',
  MATHEMATICS = 'mathematics',
  SCIENCE = 'science',
  LANGUAGE = 'language',
  PERSONAL_DEVELOPMENT = 'personal_development',
  HEALTH_FITNESS = 'health_fitness',
  OTHER = 'other',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 1. Expose the raw column for direct ID assignments in your services
  @Column({ name: 'user_id' })
  userId: string;

  // 2. Simplified relationship: removed the inverse (user) => user.courses callback
  // This removes the dependency on the User entity having a 'courses' array property.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  topic: string;

  @Column({ name: 'skill_level', type: 'varchar', length: 50 })
  skillLevel: string;

  @Column({
    type: 'enum',
    enum: CourseCategory,
    default: CourseCategory.OTHER,
  })
  category: CourseCategory;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Column({ type: 'jsonb', nullable: true, name: 'raw_ai_output' })
  rawAiOutput: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
