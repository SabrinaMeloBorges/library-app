import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AppConfig } from '../config/env';
import type { PublicUser, User } from '../domain/entities';
import { AppError } from '../errors/AppError';
import type { AuthSessionRepository, UserRepository } from '../repositories/contracts';
import type { LoginInput, RegisterInput } from '../validators/authValidators';
import type { EngagementHooks } from './engagementService';
import { ensureUsernameAvailable, generateUsername } from './usernames';

const HOUR_MS = 60 * 60 * 1000;
const INVALID_CREDENTIALS = 'E-mail ou senha incorretos';

export interface AuthResult {
  token: string;
  expiresAt: string;
  user: PublicUser;
}

export interface TokenIdentity {
  userId: string;
  sessionId: string;
}

interface TokenPayload {
  sub: string;
  jti: string;
}

const isTokenPayload = (value: unknown): value is TokenPayload =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as TokenPayload).sub === 'string' &&
  typeof (value as TokenPayload).jti === 'string';

export const toPublicUser = ({ passwordHash: _passwordHash, ...user }: User): PublicUser => user;

export class AuthService {
  private readonly dummyHash: string;

  constructor(
    private readonly users: UserRepository,
    private readonly sessions: AuthSessionRepository,
    private readonly engagement: EngagementHooks,
    private readonly config: Pick<AppConfig, 'JWT_SECRET' | 'JWT_EXPIRES_IN_HOURS' | 'BCRYPT_COST'>,
  ) {
    this.dummyHash = bcrypt.hashSync('library-timing-protection', config.BCRYPT_COST);
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw AppError.conflict('Já existe uma conta com este e-mail');
    if (input.username) await ensureUsernameAvailable(this.users, input.username);

    const username = input.username ?? (await generateUsername(this.users, input.name));
    const passwordHash = await bcrypt.hash(input.password, this.config.BCRYPT_COST);
    const user = await this.users.create({
      name: input.name,
      username,
      email: input.email,
      passwordHash,
    });
    await this.engagement.usersChanged([user.id]);
    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    const passwordMatches = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? this.dummyHash,
    );
    if (!user || !passwordMatches) throw AppError.unauthorized(INVALID_CREDENTIALS);
    await this.engagement.usersChanged([user.id]);
    return this.issueSession(user);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw AppError.unauthorized('Usuário da sessão não existe mais');
    return toPublicUser(user);
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.revoke(sessionId);
  }

  async verifyToken(token: string): Promise<TokenIdentity> {
    const payload = this.decodeToken(token);
    const session = await this.sessions.findById(payload.jti);
    const isActive =
      session !== null &&
      session.userId === payload.sub &&
      session.revokedAt === null &&
      session.expiresAt.getTime() > Date.now();
    if (!isActive) throw AppError.unauthorized('Sessão expirada ou encerrada');
    return { userId: payload.sub, sessionId: payload.jti };
  }

  private decodeToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.config.JWT_SECRET, { algorithms: ['HS256'] });
      if (!isTokenPayload(payload)) throw new Error('Payload inválido');
      return payload;
    } catch {
      throw AppError.unauthorized('Token inválido ou expirado');
    }
  }

  private async issueSession(user: User): Promise<AuthResult> {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + this.config.JWT_EXPIRES_IN_HOURS * HOUR_MS);
    await this.sessions.create({ id: sessionId, userId: user.id, expiresAt });
    const token = jwt.sign({}, this.config.JWT_SECRET, {
      algorithm: 'HS256',
      subject: user.id,
      jwtid: sessionId,
      expiresIn: `${this.config.JWT_EXPIRES_IN_HOURS}h`,
    });
    return { token, expiresAt: expiresAt.toISOString(), user: toPublicUser(user) };
  }
}
