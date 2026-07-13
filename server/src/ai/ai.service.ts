import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { GeneratedCourseOutline } from './interfaces/course-structure.interface';
import { GeneratedModuleContent } from './interfaces/module-content.interface'; // Ensure this matches your file path

@Injectable()
export class AiService {
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
   * Generates a course outline using a single configured Groq client
   */
  async generateCourseOutline(
    topic: string,
    skillLevel: string,
  ): Promise<GeneratedCourseOutline> {
    const systemInstruction =
      `You are an expert curriculum designer. You must generate a highly structured course outline. ` +
      `You must output standard JSON matching this schema exactly:\n` +
      `{\n` +
      `  "title": "String (Optimized course title)",\n` +
      `  "topic": "String (Comprehensive summary overview)",\n` +
      `  "modules": [\n` +
      `    { "title": "Module title string", "shortDescription": "Brief description string", "sortOrder": 1 }\n` +
      `  ]\n` +
      `}\n` +
      `Generate between 4 to 7 sequential Modules. Do not include markdown wraps, code blocks, or text before/after the JSON string.`;

    const userPrompt = `Create a course outline about "${topic}" tailored specifically for a "${skillLevel}" audience.`;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const rawContent = chatCompletion.choices[0]?.message?.content;
      if (!rawContent) {
        throw new InternalServerErrorException(
          'AI provider returned an empty response string.',
        );
      }

      const parsedData = JSON.parse(rawContent);
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
   * Internal validator ensuring the AI structure won't cause TypeORM crashes
   */
  private validateOutlineStructure(data: any): GeneratedCourseOutline {
    if (!data.title || typeof data.title !== 'string') {
      throw new InternalServerErrorException(
        'AI validation failed: missing valid "title" string.',
      );
    }
    if (!data.topic || typeof data.topic !== 'string') {
      throw new InternalServerErrorException(
        'AI validation failed: missing valid "topic" string.',
      );
    }
    if (!Array.isArray(data.modules)) {
      throw new InternalServerErrorException(
        'AI validation failed: missing or corrupt "modules" list array.',
      );
    }

    const validatedModules = data.modules.map((module: any, index: number) => {
      if (!module.title || typeof module.title !== 'string') {
        throw new InternalServerErrorException(
          `AI validation failed: Module index [${index}] missing operational title.`,
        );
      }
      return {
        title: module.title,
        shortDescription: module.shortDescription || 'No description provided.',
        sortOrder:
          typeof module.sortOrder === 'number' ? module.sortOrder : index + 1,
      };
    });

    return {
      title: data.title,
      topic: data.topic,
      modules: validatedModules,
    };
  }

  /**
   * Generates deep lessons and quizzes for a specific module using the isolated heavy reasoning client
   */
  // Inside src/ai/ai.service.ts

  async generateModuleContent(
    moduleTitle: string,
    moduleDescription: string,
    courseTopic: string,
    skillLevel: string,
  ): Promise<GeneratedModuleContent> {
    const systemInstruction =
      `You are an elite professor and assessment specialist. Your job is to write comprehensive course content and matching multiple-choice quizzes.\n` +
      `You must output standard JSON matching this schema exactly:\n` +
      `{\n` +
      `  "lessons": [\n` +
      `    {\n` +
      `      "title": "Lesson title string",\n` +
      `      "content": "Detailed explanatory narrative markdown string...",\n` +
      `      "estimatedMinutes": 15,\n` +
      `      "examples": "Raw practical code examples plain text string..."\n` +
      `    }\n` +
      `  ],\n` +
      `  "quiz": [\n` +
      `    {\n` +
      `      "question": "Clear multiple choice question string?",\n` +
      `      "options": ["Option A", "Option B", "Option C", "Option D"],\n` +
      `      "correctAnswer": "The exact string matching the correct option text",\n` +
      `      "explanation": "Detailed explanation of why this answer is correct."\n` +
      `    }\n` +
      `  ]\n` +
      `}\n` +
      `Provide exactly 2 to 3 concise lessons and 3 short quiz questions. Keep content highly professional but clear, and ensure you do not run out of string length tokens. Do not include markdown wrappers, thoughts, or text outside the JSON block object. All control characters and double-quotes inside keys or string blocks MUST be escaped safely.`;

    const userPrompt =
      `Context: This module is part of a larger course about "${courseTopic}" built for a "${skillLevel}" audience.\n` +
      `Target Module Title: "${moduleTitle}"\n` +
      `Target Module Goal: "${moduleDescription}"\n\n` +
      `Generate the complete valid JSON structure now.`;

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

      const parsedData = JSON.parse(rawContent);
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
   * Internal validator ensuring the generated lessons and quiz conform strictly to safety expectations
   */
  private validateModuleContentStructure(data: any): GeneratedModuleContent {
    if (!Array.isArray(data.lessons) || data.lessons.length === 0) {
      throw new InternalServerErrorException(
        'Content validation failed: "lessons" must be a non-empty array.',
      );
    }
    if (!Array.isArray(data.quiz) || data.quiz.length === 0) {
      throw new InternalServerErrorException(
        'Content validation failed: "quiz" must be a non-empty array.',
      );
    }

    const validatedLessons = data.lessons.map((lesson: any, index: number) => {
      if (!lesson.title || !lesson.content) {
        throw new InternalServerErrorException(
          `Content validation failed: Lesson index [${index}] is missing title or content.`,
        );
      }
      return {
        title: String(lesson.title),
        content: String(lesson.content),
        estimatedMinutes:
          typeof lesson.estimatedMinutes === 'number'
            ? lesson.estimatedMinutes
            : 10,
        examples: lesson.examples
          ? String(lesson.examples)
          : 'No examples provided.',
      };
    });

    const validatedQuiz = data.quiz.map((item: any, index: number) => {
      if (
        !item.question ||
        !Array.isArray(item.options) ||
        !item.correctAnswer
      ) {
        throw new InternalServerErrorException(
          `Content validation failed: Quiz index [${index}] is missing required parameters.`,
        );
      }
      if (!item.options.includes(item.correctAnswer)) {
        throw new InternalServerErrorException(
          `Content validation failed: Quiz index [${index}] has a correctAnswer that is missing from options array.`,
        );
      }
      return {
        question: String(item.question),
        options: item.options.map((opt: any) => String(opt)),
        correctAnswer: String(item.correctAnswer),
        explanation: item.explanation
          ? String(item.explanation)
          : 'No detailed explanation provided.',
      };
    });

    return {
      lessons: validatedLessons,
      quiz: validatedQuiz,
    };
  }
}
