import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { SnapshotModule } from '../snapshot/snapshot.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AuthModule, SnapshotModule],
  controllers: [DashboardController],
  providers: [PrismaService],
})
export class DashboardModule {}
