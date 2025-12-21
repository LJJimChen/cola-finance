import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SnapshotService } from './snapshot.service';

@Module({
  providers: [SnapshotService, PrismaService],
  exports: [SnapshotService],
})
export class SnapshotModule {}
