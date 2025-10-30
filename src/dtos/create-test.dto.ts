import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateTestDto {
  @ApiProperty({ example: '테스트 이름' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}