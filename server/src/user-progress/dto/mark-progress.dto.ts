import { IsBoolean } from 'class-validator';

export class MarkProgressDto {
  @IsBoolean()
  completed: boolean;
}
