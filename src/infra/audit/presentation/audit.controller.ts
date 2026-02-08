import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from '@infra/audit/application/audit.service';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
  ) {
    return this.auditService.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      userId,
      action,
      entity,
    });
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get audit logs for a specific user (Admin only)' })
  findByUser(@Param('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get a specific audit log (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
