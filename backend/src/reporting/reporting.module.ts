import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';

/** EPIC-20 — Báo cáo & thống kê kết quả thi. */
@Module({
  imports: [PrismaModule],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
