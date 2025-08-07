import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, RefreshToken } from '../entities';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    this.logger.log(`Registering user: ${registerDto.email}`);
    
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const tokens = await this.generateTokens(savedUser);

    this.logger.log(`User registered successfully: ${savedUser.id}`);

    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for: ${loginDto.email}`);
    
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    this.logger.log(`Refresh token attempt for token: ${refreshToken.substring(0, 20)}...`);
    
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      this.logger.warn(`Invalid or expired refresh token: ${refreshToken.substring(0, 20)}...`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.logger.log(`Valid refresh token found for user: ${tokenRecord.user.id}`);

    // Remove old refresh token
    await this.refreshTokenRepository.remove(tokenRecord);
    this.logger.log(`Old refresh token removed for user: ${tokenRecord.user.id}`);

    const tokens = await this.generateTokens(tokenRecord.user);

    this.logger.log(`New tokens generated for user: ${tokenRecord.user.id}`);

    return {
      user: this.sanitizeUser(tokenRecord.user),
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    this.logger.log(`Logout attempt for token: ${refreshToken.substring(0, 20)}...`);
    
    try {
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
      });

      if (tokenRecord) {
        await this.refreshTokenRepository.remove(tokenRecord);
        this.logger.log(`Refresh token invalidated for logout: ${refreshToken.substring(0, 20)}...`);
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Error during logout:', error);
      return { message: 'Logged out successfully' };
    }
  }

  async cleanExpiredTokensPublic() {
    this.logger.log('Starting scheduled cleanup of expired tokens...');
    await this.cleanExpiredTokens();
    this.logger.log('Scheduled cleanup of expired tokens completed');
  }

  private async generateTokens(user: User) {
    this.logger.log(`Generating tokens for user: ${user.id}`);
    
    // Clean expired tokens first
    await this.cleanExpiredTokens();
    
    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    // Generate refresh token with retry mechanism
    const refreshToken = await this.generateUniqueRefreshToken(payload);

    this.logger.log(`Tokens generated successfully for user: ${user.id}`);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateUniqueRefreshToken(payload: any, retryCount = 0): Promise<string> {
    const maxRetries = 3;
    
    try {
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      });

      // Add timestamp to ensure uniqueness
      const uniqueRefreshToken = `${refreshToken}.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

      // Save refresh token to database
      const refreshTokenEntity = this.refreshTokenRepository.create({
        token: uniqueRefreshToken,
        userId: payload.sub,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      await this.refreshTokenRepository.save(refreshTokenEntity);
      this.logger.log(`Refresh token saved successfully: ${uniqueRefreshToken.substring(0, 20)}...`);
      
      return uniqueRefreshToken;
    } catch (error) {
      if (error.code === '23505' && retryCount < maxRetries) { // PostgreSQL unique constraint violation
        this.logger.warn(`Token collision detected, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
        return this.generateUniqueRefreshToken(payload, retryCount + 1);
      }
      
      this.logger.error(`Failed to generate refresh token after ${retryCount + 1} attempts:`, error);
      throw error;
    }
  }

  private async cleanExpiredTokens() {
    try {
      const result = await this.refreshTokenRepository
        .createQueryBuilder('refresh_token')
        .delete()
        .where('expires_at < :now', { now: new Date() })
        .execute();
      
      if (result.affected && result.affected > 0) {
        this.logger.log(`Cleaned ${result.affected} expired refresh tokens`);
      }
    } catch (error) {
      this.logger.error('Error cleaning expired tokens:', error);
    }
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}

