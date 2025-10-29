import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class AddFavoriteDto {
  @IsString()
  @IsNotEmpty()
  recipeId: string;

  @IsObject()
  @IsNotEmpty()
  recipeData: any;
}
