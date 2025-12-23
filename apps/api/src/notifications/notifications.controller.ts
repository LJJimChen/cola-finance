import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NotifyType } from '@cola-finance/db';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthedRequest = Request & {
  user: {
    userId: string;
  };
};

type InvitationPayload = {
  groupId?: string;
  inviterUserId?: string;
  inviterUsername?: string;
};

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: AuthedRequest) {
    return this.prisma.userNotification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post(':id/read')
  async markRead(@Req() req: AuthedRequest, @Param('id') id: string) {
    const notif = await this.prisma.userNotification.findUnique({
      where: { id },
    });
    if (!notif || notif.userId !== req.user.userId) {
      return;
    }
    await this.prisma.userNotification.update({
      where: { id },
      data: { isRead: true },
    });
    return { ok: true };
  }

  @Post(':id/accept')
  async accept(@Req() req: AuthedRequest, @Param('id') id: string) {
    const notif = await this.prisma.userNotification.findUnique({
      where: { id },
    });
    if (!notif || notif.userId !== req.user.userId) {
      return;
    }
    if (notif.type !== NotifyType.INVITATION) {
      return;
    }
    const payload = (notif.payload ?? {}) as InvitationPayload;
    const groupId = payload.groupId;
    if (!groupId) {
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.upsert({
        where: { groupId_userId: { groupId, userId: req.user.userId } },
        create: {
          groupId,
          userId: req.user.userId,
        },
        update: {},
      });
      await tx.userNotification.update({
        where: { id },
        data: { isRead: true },
      });
    });
    return { ok: true };
  }
}
