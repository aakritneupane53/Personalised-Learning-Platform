import { IsString, MinLength, MaxLength, IsEmail } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsEmail({}, { message: 'Email is required' })
  @MaxLength(50, { message: 'Email can be atmost 100 characters long' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password should be atleast 6 characters long' })
  @MaxLength(20, { message: 'Password can be at most 20 characters long' })
  password: string;
}
