import { IsString, IsOptional, IsEmail, Length } from 'class-validator';

export class SubmitFeedbackDto {
  @IsString()
  @Length(10, 1000, { message: 'Feedback must be between 10 and 1000 characters' })
  message: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}