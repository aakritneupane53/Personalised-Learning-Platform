import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path to your actual Auth Guard
import { User } from '../auth/decorators/user.decorator'; // Adjust path to your actual @User decorator

@Controller('courses')
@UseGuards(JwtAuthGuard) // Protects all routes in this controller
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @User() user: any, // Automatically extracts the user from the request context
  ) {
    return await this.courseService.create(createCourseDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Course[]> {
    return await this.courseService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Course> {
    return await this.courseService.findOne(id);
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  async findMyCourses(@User() user: any): Promise<Course[]> {
    return await this.courseService.findByUserId(user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @User() user: any,
  ): Promise<Course> {
    return await this.courseService.update(id, updateCourseDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Returns a clean 204 No Content on successful deletion
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: any,
  ): Promise<void> {
    await this.courseService.remove(id, user.id);
  }
}
