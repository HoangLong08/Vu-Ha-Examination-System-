import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExamsModule } from './exams/exams.module';
import { AttemptsModule } from './attempts/attempts.module';
import { ViolationsModule } from './violations/violations.module';
import { InvigilatorModule } from './invigilator/invigilator.module';
import { AdminModule } from './admin/admin.module';
import { ExamCoreModule } from './exam-core/exam-core.module';
import { ReportingModule } from './reporting/reporting.module';
import { SchedulingModule } from './scheduling/scheduling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExamsModule,
    AttemptsModule,
    ViolationsModule,
    InvigilatorModule,
    AdminModule,
    ExamCoreModule,
    ReportingModule,
    SchedulingModule,
  ],
})
export class AppModule {}
