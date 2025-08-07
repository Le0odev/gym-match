import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FileUploadService } from '../services/file-upload.service';
import { MinioConfig } from '../config/minio.config';
import { User, WorkoutPreference } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WorkoutPreference]),
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, FileUploadService, MinioConfig],
  exports: [UsersService, FileUploadService],
})
export class UsersModule {}

