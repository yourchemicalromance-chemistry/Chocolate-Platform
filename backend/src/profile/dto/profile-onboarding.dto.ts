import { ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, IsUUID } from 'class-validator';

export const GENDERS = ['Woman', 'Man', 'Non-binary', 'Genderqueer', 'Another identity'] as const;
export const MEETING = ['Women', 'Men', 'Non-binary People', 'Everyone', 'Prefer not to say'] as const;
export const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Urdu', 'Other'] as const;
export const PROMPTS = ['A little thing that makes me happy...', 'My ideal weekend looks like...', "Something I'd love to share with someone..."] as const;
export const INTERESTS = ['Music', 'Travel', 'Fitness', 'Food', 'Movies', 'Books', 'Art', 'Gaming', 'Nature', 'Technology', 'Pets', 'Spirituality'] as const;
export const LIFESTYLES = ['Active', 'Relaxed', 'Social', 'Homebody', 'Adventurous', 'Balanced', 'Career-focused'] as const;
export const VALUES = ['Honesty', 'Emotional connection', 'Humour', 'Ambition', 'Family', 'Kindness', 'Stability', 'Adventure', 'Intellectual chemistry', 'Affection'] as const;
export const CONVERSATION_STYLES = ['Deep conversations', 'Playful banter', 'Spontaneous chats', 'Meaningful topics', 'Light and fun', 'A bit of everything'] as const;

export class UpdateBasicsDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30) displayName?: string;
  @IsOptional() @IsIn(GENDERS) genderIdentity?: typeof GENDERS[number] | null;
  @IsOptional() @IsArray() @ArrayUnique() @IsIn(MEETING, { each: true }) interestedIn?: typeof MEETING[number][];
}
export class UpdateStoryDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(300) bio?: string;
  @IsOptional() @IsIn(PROMPTS) selectedPrompt?: typeof PROMPTS[number] | null;
  @IsOptional() @IsArray() @ArrayUnique() @IsIn(LANGUAGES, { each: true }) languages?: typeof LANGUAGES[number][];
}
export class UpdateChemistryDto {
  @IsOptional() @IsArray() @ArrayUnique() @IsIn(INTERESTS, { each: true }) interests?: typeof INTERESTS[number][];
  @IsOptional() @IsArray() @ArrayUnique() @IsIn(LIFESTYLES, { each: true }) lifestyles?: typeof LIFESTYLES[number][];
  @IsOptional() @IsArray() @ArrayUnique() @IsIn(VALUES, { each: true }) values?: typeof VALUES[number][];
  @IsOptional() @IsArray() @ArrayUnique() @IsIn(CONVERSATION_STYLES, { each: true }) conversationStyles?: typeof CONVERSATION_STYLES[number][];
}
export class AddProfilePhotoDto { @IsUUID() assetId!: string; }
