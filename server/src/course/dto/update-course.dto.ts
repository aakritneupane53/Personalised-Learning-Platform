// src/courses/dto/update-course.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';

// Since CreateCourseDto has no userId, you just make all its existing fields optional
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
