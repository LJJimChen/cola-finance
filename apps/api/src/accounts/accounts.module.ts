import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { SnapshotModule } from '../snapshot/snapshot.module';
import { AccountsController } from './accounts.controller';

@Module({
  imports: [AuthModule, SnapshotModule],
  controllers: [AccountsController],
  providers: [PrismaService],
})
export class AccountsModule {}
