import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { GeneratedCourseOutline } from '../ai/schemas/course-outline.schema';
import { IsString, IsNotEmpty } from 'class-validator';

// A lightweight inline DTO strictly for this test endpoint
class TestGenerationDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  skillLevel: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}

@Controller('courses-test') // Exposes endpoints on base prefix: /courses-test
export class CourseTestController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async testAiGeneration(
    @Body() testDto: TestGenerationDto,
  ): Promise<GeneratedCourseOutline> {
    // Calls your streamlined single-key AI layer directly and returns raw validated JSON
    return await this.aiService.generateCourseOutline(
      testDto.topic,
      testDto.skillLevel,
      testDto.category,
    );
  }
}
