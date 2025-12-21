import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalysisService } from './analysis.service';

type AuthedRequest = Request & {
  user: {
    userId: string;
  };
};

type TrendQuery = {
  range?: '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
};

type UpdateTargetsBody = {
  targets: {
    category: string;
    percentage: number;
  }[];
};

@Controller('api/v1/analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  @Get('trend')
  async getTrend(@Req() req: AuthedRequest, @Query() query: TrendQuery) {
    return this.service.getTrend(req.user.userId, query.range || '1M');
  }

  @Get('rebalance')
  async getRebalance(@Req() req: AuthedRequest) {
    return this.service.getRebalance(req.user.userId);
  }

  @Post('targets')
  async updateTargets(
    @Req() req: AuthedRequest,
    @Body() body: UpdateTargetsBody,
  ) {
    return this.service.updateTargets(req.user.userId, body.targets || []);
  }
}
