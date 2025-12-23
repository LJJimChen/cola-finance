import {
  AdapterFactory,
  PlatformType as AdapterPlatformType,
} from '@cola-finance/platform-adapters';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AccountStatus, PlatformType } from '@cola-finance/db';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SnapshotService } from '../snapshot/snapshot.service';

type AuthedRequest = Request & {
  user: {
    userId: string;
  };
};

type CreateAccountBody = {
  platform: PlatformType;
  name: string;
  credentials?: string | null;
};

type UpdateAccountBody = Partial<CreateAccountBody> & {
  status?: never;
};

const credentialsKey = createHash('sha256')
  .update(process.env.CREDENTIALS_SECRET || 'dev-credentials-secret')
  .digest();

function encryptCredentials(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', credentialsKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptCredentials(encryptedBase64: string): string {
  const buf = Buffer.from(encryptedBase64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', credentialsKey, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}

function decryptCredentialsSafe(encryptedBase64: string | null): string | null {
  if (!encryptedBase64) {
    return null;
  }
  try {
    return decryptCredentials(encryptedBase64);
  } catch {
    return null;
  }
}

function decodeCredentials(
  encryptedBase64: string | null,
): Record<string, unknown> {
  if (!encryptedBase64) {
    return {};
  }
  const decrypted = decryptCredentialsSafe(encryptedBase64);
  if (!decrypted) {
    return {};
  }
  try {
    const parsed = JSON.parse(decrypted) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { raw: decrypted };
  } catch {
    return { raw: decrypted };
  }
}

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotService: SnapshotService,
  ) {}

  @Post(':id/crawler/login')
  async crawlerLogin(@Req() req: AuthedRequest, @Param('id') id: string) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
    });
    if (!account || account.userId !== req.user.userId) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    if (account.status === 'Connected') {
      throw new HttpException('Account already connected', HttpStatus.CONFLICT);
    }

    // Convert Prisma PlatformType to Adapter PlatformType (assuming they match strings)
    const adapter = AdapterFactory.getAdapter(
      account.platform as unknown as AdapterPlatformType,
    );
    if (!adapter) {
      throw new HttpException('Adapter not found', HttpStatus.BAD_REQUEST);
    }

    const creds = decodeCredentials(account.credentials);
    const result = await adapter.fetchAssets(creds);

    // If successful, we might want to update status
    if (result.ok) {
      await this.prisma.platformAccount.update({
        where: { id },
        data: { status: 'Connected' },
      });

      // Try backfill history if supported
      if (adapter.fetchHistory) {
        try {
          const historyResult = await adapter.fetchHistory(creds);
          if (historyResult.ok) {
            await this.snapshotService.backfillSnapshots(
              req.user.userId,
              id,
              historyResult.history,
            );
          }
        } catch (err) {
          console.error('Failed to backfill history:', err);
        }
      }

      await this.snapshotService.generateForUser(req.user.userId);
    } else {
      // If error, update status to indicate attention needed
      let status: AccountStatus = AccountStatus.Error;
      if (result.reason === 'NEED_2FA' || result.reason === 'NEED_CAPTCHA') {
        status = AccountStatus.NeedVerify;
      } else if (result.reason === 'INVALID_CREDENTIALS') {
        status = AccountStatus.Unauthorized;
      }
      await this.prisma.platformAccount.update({
        where: { id },
        data: { status },
      });
    }

    return result;
  }

  @Post(':id/crawler/2fa')
  async crawler2FA(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { code: string; sessionId: string },
  ) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
    });
    if (!account || account.userId !== req.user.userId) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    if (account.status === 'Connected') {
      throw new HttpException('Account already connected', HttpStatus.CONFLICT);
    }

    const adapter = AdapterFactory.getAdapter(
      account.platform as unknown as AdapterPlatformType,
    );
    if (!adapter.submitChallenge) {
      throw new HttpException(
        'Adapter does not support 2FA',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await adapter.submitChallenge(body.sessionId, body.code);

    if (result.ok) {
      await this.prisma.platformAccount.update({
        where: { id },
        data: { status: 'Connected' },
      });
      await this.snapshotService.generateForUser(req.user.userId);
    }

    return result;
  }

  @Get(':id/status')
  async getStatus(@Req() req: AuthedRequest, @Param('id') id: string) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
      select: { status: true, platform: true, name: true, updatedAt: true },
    });
    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    return account;
  }

  @Get()
  async list(@Req() req: AuthedRequest) {
    const accounts = await this.prisma.platformAccount.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' },
    });
    return accounts.map((a) => ({
      ...a,
      credentials: decryptCredentialsSafe(a.credentials),
    }));
  }

  @Post()
  async create(@Req() req: AuthedRequest, @Body() body: CreateAccountBody) {
    const encryptedCredentials =
      body.credentials && body.credentials.trim()
        ? encryptCredentials(body.credentials)
        : null;
    const account = await this.prisma.platformAccount.create({
      data: {
        userId: req.user.userId,
        platform: body.platform,
        name: body.name,
        credentials: encryptedCredentials,
        status: 'Connected',
      },
    });
    await this.snapshotService.generateForUser(req.user.userId);
    return account;
  }

  @Patch(':id')
  async update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: UpdateAccountBody,
  ) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
    });
    if (!account || account.userId !== req.user.userId) {
      return;
    }
    const encryptedCredentials =
      body.credentials === undefined
        ? undefined
        : body.credentials && body.credentials.trim()
          ? encryptCredentials(body.credentials)
          : null;
    const updated = await this.prisma.platformAccount.update({
      where: { id },
      data: {
        platform: body.platform ?? undefined,
        name: body.name ?? undefined,
        credentials: encryptedCredentials,
      },
    });
    return {
      ...updated,
      credentials: decryptCredentialsSafe(updated.credentials),
    };
  }

  @Delete(':id')
  async remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
    });
    if (!account || account.userId !== req.user.userId) {
      return;
    }

    // First delete related AssetPositions
    await this.prisma.assetPosition.deleteMany({
      where: { accountId: id },
    });

    // Then delete the account
    await this.prisma.platformAccount.delete({ where: { id } });
    return { ok: true };
  }
}
