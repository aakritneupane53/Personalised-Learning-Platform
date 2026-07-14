import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { CourseStatus, CourseCategory } from '../entities/course.entity';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  topic: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  skillLevel: string;

  @IsEnum(CourseCategory, {
    message: `category must be one of the following values: ${Object.values(CourseCategory).join(', ')}`,
  })
  @IsOptional() // Optional because the entity defaults this to 'other'
  category?: CourseCategory;

  @IsEnum(CourseStatus, {
    message: `status must be one of the following values: ${Object.values(CourseStatus).join(', ')}`,
  })
  @IsOptional() // Optional because the entity defaults this to 'draft'
  status?: CourseStatus;
}
