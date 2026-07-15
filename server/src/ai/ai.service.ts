import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
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

interface CompletionAttempt {
  label: string;
  run: () => Promise<string | null | undefined>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groq: Groq;
  private readonly groqDeep1: Groq;
  private readonly groqDeep2: Groq;
  private readonly gemini: GoogleGenAI | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const deepApiKey1 = this.configService.get<string>('GROQ_DEEP_API_KEY1');
    const deepApiKey2 = this.configService.get<string>('GROQ_DEEP_API_KEY2');
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY'); // Last-resort fallback provider, optional

    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is missing from the environment variables configuration.',
      );
    }

    if (!deepApiKey1) {
      throw new Error(
        'GROQ_DEEP_API_KEY1 is missing from the environment variables configuration.',
      );
    }

    if (!deepApiKey2) {
      throw new Error(
        'GROQ_DEEP_API_KEY2 is missing from the environment variables configuration.',
      );
    }

    // Initialize all independent client wrappers
    this.groq = new Groq({ apiKey });
    this.groqDeep1 = new Groq({ apiKey: deepApiKey1 });
    this.groqDeep2 = new Groq({ apiKey: deepApiKey2 });

    if (geminiApiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiApiKey });
    } else {
      this.gemini = null;
      this.logger.warn(
        'GEMINI_API_KEY is not set; the Gemini fallback tier is disabled.',
      );
    }
  }

  /**
   * Runs an ordered chain of provider attempts against the same prompt and
   * validates each JSON response. Each tier gets its own retry budget before
   * falling through to the next provider, so a single model/provider having a
   * bad day (malformed JSON, outage, rate limit) doesn't fail the request as
   * long as a later tier is configured and healthy.
   */
  private async requestWithFallback<T>(
    attempts: CompletionAttempt[],
    validate: (data: unknown) => T,
    context: string,
    maxAttemptsPerTier: number,
  ): Promise<T> {
    let lastError: unknown;

    for (const { label, run } of attempts) {
      for (let attempt = 1; attempt <= maxAttemptsPerTier; attempt++) {
        try {
          const rawContent = await run();

          if (!rawContent) {
            throw new Error('AI provider returned an empty response.');
          }

          const parsedData: unknown = JSON.parse(rawContent);
          return validate(parsedData);
        } catch (error) {
          lastError = error;
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `${context} [${label}] attempt ${attempt}/${maxAttemptsPerTier} failed: ${message}`,
          );

          if (attempt < maxAttemptsPerTier) {
            await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
          }
        }
      }
    }

    const finalMessage =
      lastError instanceof Error ? lastError.message : String(lastError);
    throw new InternalServerErrorException(
      `${context} failed on all providers: ${finalMessage}`,
    );
  }

  private async callGroq(
    client: Groq,
    model: string,
    systemInstruction: string,
    userPrompt: string,
    maxCompletionTokens: number,
    temperature: number,
  ): Promise<string | null | undefined> {
    const chatCompletion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_completion_tokens: maxCompletionTokens,
      response_format: { type: 'json_object' },
    });

    return chatCompletion.choices[0]?.message?.content;
  }

  private async callGemini(
    model: string,
    systemInstruction: string,
    userPrompt: string,
    maxOutputTokens: number,
    temperature: number,
  ): Promise<string | null | undefined> {
    if (!this.gemini) {
      throw new Error('Gemini client is not configured.');
    }

    const response = await this.gemini.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature,
        maxOutputTokens,
      },
    });

    return response.text;
  }

  /**
   * Generates a course outline. Same system/user prompt and output structure
   * are reused across every provider tier — only the model/key backing the
   * call changes as it falls through Groq's primary key, then both Groq deep
   * keys, with Gemini tried only as the last resort.
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
    const maxTokens = 1024; // Bounds worst-case cost; a 7-module outline fits comfortably.
    const temperature = 0.3;

    const attempts: CompletionAttempt[] = [
      {
        label: 'groq:llama-3.3-70b-versatile',
        run: () =>
          this.callGroq(
            this.groq,
            'llama-3.3-70b-versatile',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      },
      {
        label: 'groq-deep1:openai/gpt-oss-120b',
        run: () =>
          this.callGroq(
            this.groqDeep1,
            'openai/gpt-oss-120b',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      },
      {
        label: 'groq-deep2:openai/gpt-oss-120b',
        run: () =>
          this.callGroq(
            this.groqDeep2,
            'openai/gpt-oss-120b',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      },
    ];

    if (this.gemini) {
      attempts.push({
        label: 'gemini:gemini-2.5-flash',
        run: () =>
          this.callGemini(
            'gemini-2.5-flash',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      });
    }

    return this.requestWithFallback(
      attempts,
      (data) => this.validateOutlineStructure(data),
      'Course outline generation',
      2,
    );
  }

  private validateOutlineStructure(data: unknown): GeneratedCourseOutline {
    const result = CourseOutlineSchema.safeParse(data);

    if (!result.success) {
      const detail = formatZodIssues(result.error);
      throw new Error(`structure validation failed: ${detail}`);
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
   * Generates module content (lessons + quiz). Same system/user prompt and
   * output structure are reused across every provider tier — only the
   * model/key backing the call changes as it falls through both Groq deep
   * keys, then Groq's primary key, with Gemini tried only as the last
   * resort.
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
    const maxTokens = 4096;
    const temperature = 0.3; // Lowered slightly to reduce rambling/token usage

    const attempts: CompletionAttempt[] = [
      {
        label: 'groq-deep1:openai/gpt-oss-120b',
        run: () =>
          this.callGroq(
            this.groqDeep1,
            'openai/gpt-oss-120b',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      },
      {
        label: 'groq-deep2:openai/gpt-oss-120b',
        run: () =>
          this.callGroq(
            this.groqDeep2,
            'openai/gpt-oss-120b',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      },
      {
        label: 'groq:llama-3.3-70b-versatile',
        run: () =>
          this.callGroq(
            this.groq,
            'llama-3.3-70b-versatile',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      },
    ];

    if (this.gemini) {
      attempts.push({
        label: 'gemini:gemini-2.5-flash',
        run: () =>
          this.callGemini(
            'gemini-2.5-flash',
            systemInstruction,
            userPrompt,
            maxTokens,
            temperature,
          ),
      });
    }

    return this.requestWithFallback(
      attempts,
      (data) => this.validateModuleContentStructure(data),
      'Module content generation',
      2,
    );
  }

  private validateModuleContentStructure(
    data: unknown,
  ): GeneratedModuleContent {
    const result = ModuleContentSchema.safeParse(data);

    if (!result.success) {
      const detail = formatZodIssues(result.error);
      throw new Error(`structure validation failed: ${detail}`);
    }

    return result.data;
  }
}
