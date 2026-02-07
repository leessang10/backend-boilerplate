import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagService } from '../application/feature-flag.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';

@ApiTags('Feature Flags')
@ApiBearerAuth()
@Controller({ path: 'feature-flags', version: '1' })
export class FeatureFlagController {
  constructor(private featureFlagService: FeatureFlagService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all feature flags (Admin only)' })
  findAll() {
    return this.featureFlagService.findAll();
  }

  @Get(':key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get a specific feature flag (Admin only)' })
  findOne(@Param('key') key: string) {
    return this.featureFlagService.findOne(key);
  }

  @Get(':key/status')
  @ApiOperation({ summary: 'Check if a feature is enabled' })
  async checkStatus(@Param('key') key: string) {
    const enabled = await this.featureFlagService.isEnabled(key);
    return { key, enabled };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a feature flag (Admin only)' })
  create(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlagService.create(
      dto.key,
      dto.name,
      dto.description,
      dto.enabled,
    );
  }

  @Patch(':key/enable')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable a feature flag (Admin only)' })
  async enable(@Param('key') key: string) {
    await this.featureFlagService.enable(key);
    return { message: `Feature '${key}' enabled` };
  }

  @Patch(':key/disable')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Disable a feature flag (Admin only)' })
  async disable(@Param('key') key: string) {
    await this.featureFlagService.disable(key);
    return { message: `Feature '${key}' disabled` };
  }

  @Patch(':key/toggle')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Toggle a feature flag (Admin only)' })
  async toggle(@Param('key') key: string) {
    const newState = await this.featureFlagService.toggle(key);
    return { key, enabled: newState };
  }

  @Delete(':key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a feature flag (Admin only)' })
  async delete(@Param('key') key: string) {
    await this.featureFlagService.delete(key);
    return { message: `Feature '${key}' deleted` };
  }
}
