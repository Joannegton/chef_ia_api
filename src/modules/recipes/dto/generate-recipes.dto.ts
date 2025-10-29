import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class GenerateRecipesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one ingredient is required' })
  @ArrayMaxSize(20, { message: 'Maximum 20 ingredients allowed' })
  @IsString({ each: true })
  ingredients: string[];
}