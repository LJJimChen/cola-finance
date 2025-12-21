import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GroupsController } from './groups.controller';

@Module({
  imports: [AuthModule],
  controllers: [GroupsController],
  providers: [PrismaService],
})
export class GroupsModule {}
