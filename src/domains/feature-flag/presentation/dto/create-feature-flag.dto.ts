import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'new-dashboard' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'New Dashboard' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Enable the new dashboard UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
