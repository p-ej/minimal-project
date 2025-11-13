import { ApiProperty } from '@nestjs/swagger';

export class TodaySentenceResponseDto {
  @ApiProperty({
    description: '추천된 영어 문장',
    example: 'Practice makes perfect.',
  })
  sentence!: string;

  @ApiProperty({
    description: '문장 번역',
    example: '연습은 완벽을 만든다.',
  })
  translation!: string;

  @ApiProperty({
    description: '문장 출처 또는 제공자',
    example: 'Open Language API',
  })
  source!: string;

  @ApiProperty({
    description: '난이도 레벨',
    example: 'B1',
  })
  level!: string;

  @ApiProperty({
    description: '문장 데이터 수집 시각 (ISO8601)',
    example: '2025-11-13T02:30:00Z',
  })
  retrievedAt!: string;
}

