import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { z } from 'zod';
import {
  CourseOutlineSchema,
  GeneratedCourseOutline,
} from './schemas/course-outline.schema';
import {
  ModuleContentSchema,
  GeneratedModuleContent,
} from './schemas/module-content.schema';

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groq: Groq;
  private readonly groqDeep: Groq; // 🧠 Isolated client for heavy reasoning and content generation tasks

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const deepApiKey = this.configService.get<string>('GROQ_DEEP_API_KEY'); // New separate API key configuration

    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is missing from the environment variables configuration.',
      );
    }

    if (!deepApiKey) {
      throw new Error(
        'GROQ_DEEP_API_KEY is missing from the environment variables configuration.',
      );
    }

    // Initialize both independent client wrappers
    this.groq = new Groq({ apiKey });
    this.groqDeep = new Groq({ apiKey: deepApiKey });
  }

  /**
   * Generates a course outline using a single configured Groq client.
   * The response is strictly validated before it is ever handed to a caller.
   */
  async generateCourseOutline(
    topic: string,
    skillLevel: string,
    category: string,
  ): Promise<GeneratedCourseOutline> {
    const systemInstruction =
      `Expert curriculum designer. Output JSON only, matching exactly:\n` +
      `{"title":string,"topic":string,"modules":[{"title":string,"shortDescription":string}]}\n` +
      `4-7 modules, ordered by learning sequence (array order = module order). No markdown, no commentary, no text outside the JSON object.`;

    const userPrompt = `Category: ${category}. Topic: "${topic}". Audience: ${skillLevel}. Generate the outline.`;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_completion_tokens: 1024, // Bounds worst-case cost; a 7-module outline fits comfortably.
        response_format: { type: 'json_object' },
      });

      const rawContent = chatCompletion.choices[0]?.message?.content;
      if (!rawContent) {
        throw new InternalServerErrorException(
          'AI provider returned an empty response string.',
        );
      }

      const parsedData: unknown = JSON.parse(rawContent);
      return this.validateOutlineStructure(parsedData);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new InternalServerErrorException(
          'Failed to process AI payload: Invalid raw JSON format received.',
        );
      }
      throw error;
    }
  }

  /**
   * Strictly validates the raw AI payload against CourseOutlineSchema.
   * sortOrder isn't part of the AI contract — it's derived from array position
   * so it can never be missing, duplicated, or out of sequence.
   */
  private validateOutlineStructure(data: unknown): GeneratedCourseOutline {
    const result = CourseOutlineSchema.safeParse(data);

    if (!result.success) {
      const detail = formatZodIssues(result.error);
      this.logger.warn(`Course outline validation failed: ${detail}`);
      throw new InternalServerErrorException(
        `AI outline structure validation failed: ${detail}`,
      );
    }

    return {
      title: result.data.title,
      topic: result.data.topic,
      modules: result.data.modules.map((module, index) => ({
        title: module.title,
        shortDescription: module.shortDescription,
        sortOrder: index + 1,
      })),
    };
  }

  /**
   * Generates deep lessons and quizzes for a specific module using the isolated heavy reasoning client.
   * The response is strictly validated before it is ever handed to a caller.
   */
  async generateModuleContent(
    moduleTitle: string,
    moduleDescription: string,
    courseTopic: string,
    skillLevel: string,
  ): Promise<GeneratedModuleContent> {
    const systemInstruction =
      `Professor and assessment specialist. Output JSON only, matching exactly:\n` +
      `{"lessons":[{"title":string,"content":string,"estimatedMinutes":number,"examples":string}],` +
      `"quiz":[{"question":string,"options":string[4],"correctAnswer":string,"explanation":string}]}\n` +
      `2-3 lessons, exactly 3 quiz questions. correctAnswer must exactly match one option. Escape quotes/control chars. No markdown, no commentary, no text outside the JSON object.`;

    const userPrompt = `Course: "${courseTopic}" (${skillLevel}). Module: "${moduleTitle}" — ${moduleDescription}. Generate the content.`;

    try {
      const chatCompletion = await this.groqDeep.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lowered slightly to reduce rambling/token usage
        max_completion_tokens: 4096, // 🌟 CRITICAL: Grant the model enough maximum output budget to safely finish the array
        response_format: { type: 'json_object' },
      });

      const rawContent = chatCompletion.choices[0]?.message?.content;
      if (!rawContent) {
        throw new InternalServerErrorException(
          'Deep AI provider returned an empty content string.',
        );
      }

      const parsedData: unknown = JSON.parse(rawContent);
      return this.validateModuleContentStructure(parsedData);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new InternalServerErrorException(
          'Failed to process deep AI content: Invalid JSON block format returned.',
        );
      }
      throw error;
    }
  }

  /**
   * Strictly validates the raw AI payload against ModuleContentSchema, including
   * the correctAnswer-must-be-one-of-options invariant that a shallow type check can't express.
   */
  private validateModuleContentStructure(
    data: unknown,
  ): GeneratedModuleContent {
    const result = ModuleContentSchema.safeParse(data);

    if (!result.success) {
      const detail = formatZodIssues(result.error);
      this.logger.warn(`Module content validation failed: ${detail}`);
      throw new InternalServerErrorException(
        `AI module content validation failed: ${detail}`,
      );
    }

    return result.data;
  }
}
