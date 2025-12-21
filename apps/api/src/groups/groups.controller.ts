import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { GroupRole, NotifyType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthedRequest = Request & {
  user: {
    userId: string;
  };
};

type CreateGroupBody = {
  name: string;
};

type InviteBody = {
  username: string;
};

type TrendQuery = {
  range?: '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
};

type TrendRange = NonNullable<TrendQuery['range']>;

function resolveTrendStartDate(range: TrendRange): Date {
  const now = new Date();
  const start = new Date(now.getTime());

  switch (range) {
    case '1M':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3M':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6M':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'YTD':
      start.setMonth(0, 1);
      break;
    case 'ALL': {
      const allStart = new Date(0);
      return allStart;
    }
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Req() req: AuthedRequest, @Body() body: CreateGroupBody) {
    const name = body.name?.trim();
    if (!name) {
      return;
    }
    const created = await this.prisma.familyGroup.create({
      data: {
        name,
        creatorId: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: GroupRole.OWNER,
          },
        },
      },
      include: {
        members: {
          where: { userId: req.user.userId },
        },
      },
    });
    const membership = created.members[0];
    return {
      id: created.id,
      name: created.name,
      creatorId: created.creatorId,
      createdAt: created.createdAt,
      role: membership?.role ?? GroupRole.MEMBER,
    };
  }

  @Get()
  async list(@Req() req: AuthedRequest) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId: req.user.userId },
      include: { group: true },
      orderBy: { joinedAt: 'desc' },
    });
    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      creatorId: m.group.creatorId,
      createdAt: m.group.createdAt,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  @Get(':id/members')
  async members(@Req() req: AuthedRequest, @Param('id') groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.userId } },
    });
    if (!membership) {
      return;
    }
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      username: m.user.username,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  @Get(':id/dashboard')
  async dashboard(@Req() req: AuthedRequest, @Param('id') groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.userId } },
    });
    if (!membership) {
      return;
    }

    // Get all members
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const userIds = members.map((m) => m.userId);

    // Get latest snapshot for each user
    // We can't easily do "latest per user" in one query without raw SQL or window functions
    // So we loop for now (assuming small family size)
    let totalValue = 0;
    let dayProfit = 0;
    let totalProfit = 0;
    let memberCount = 0;

    for (const uid of userIds) {
      const snapshot = await this.prisma.dailySnapshot.findFirst({
        where: { userId: uid },
        orderBy: { date: 'desc' },
      });
      if (snapshot) {
        totalValue += Number(snapshot.totalValue);
        dayProfit += Number(snapshot.dayProfit);
        totalProfit += Number(snapshot.totalProfit);
        memberCount++;
      }
    }

    return {
      totalValue,
      dayProfit,
      totalProfit,
      memberCount,
    };
  }

  @Get(':id/trend')
  async trend(
    @Req() req: AuthedRequest,
    @Param('id') groupId: string,
    @Query() query: TrendQuery,
  ) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.userId } },
    });
    if (!membership) {
      return;
    }

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const userIds = members.map((m) => m.userId);
    const startDate = resolveTrendStartDate(query.range ?? '1M');

    const snapshots = await this.prisma.dailySnapshot.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: startDate },
      },
      select: { date: true, totalValue: true },
      orderBy: [{ date: 'asc' }, { timestamp: 'asc' }],
    });

    const dateToValue = new Map<string, number>();
    for (const s of snapshots) {
      const raw = String(s.date);
      const dateKey = raw.split('T')[0];
      const prev = dateToValue.get(dateKey) ?? 0;
      dateToValue.set(dateKey, prev + Number(s.totalValue));
    }

    const dates = Array.from(dateToValue.keys()).sort();
    let firstValue: number | null = null;
    let prevValue: number | null = null;

    return dates.map((date) => {
      const totalValue = dateToValue.get(date) ?? 0;
      if (firstValue === null) {
        firstValue = totalValue;
      }
      const dayProfit = prevValue === null ? 0 : totalValue - prevValue;
      prevValue = totalValue;
      const totalProfit = firstValue === null ? 0 : totalValue - firstValue;

      return {
        date,
        totalValue,
        dayProfit,
        totalProfit,
      };
    });
  }

  @Post(':id/invite')
  async invite(
    @Req() req: AuthedRequest,
    @Param('id') groupId: string,
    @Body() body: InviteBody,
  ) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.userId } },
    });
    if (!membership || membership.role !== GroupRole.OWNER) {
      return;
    }
    const username = body.username?.trim();
    if (!username) {
      return;
    }
    const target = await this.prisma.appUser.findUnique({
      where: { username },
    });
    if (!target || target.id === req.user.userId) {
      return;
    }
    const group = await this.prisma.familyGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      return;
    }
    const inviter = await this.prisma.appUser.findUnique({
      where: { id: req.user.userId },
    });
    await this.prisma.userNotification.create({
      data: {
        userId: target.id,
        type: NotifyType.INVITATION,
        title: `家庭组邀请：${group.name}`,
        content: `${inviter?.username ?? 'Someone'} 邀请你加入家庭组「${group.name}」`,
        payload: {
          groupId,
          inviterUserId: req.user.userId,
          inviterUsername: inviter?.username ?? null,
        },
      },
    });
    return { ok: true };
  }
}
