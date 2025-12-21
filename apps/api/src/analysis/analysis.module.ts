import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [AuthModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, PrismaService],
})
export class AnalysisModule {}
