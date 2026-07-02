import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvigilatorController } from './invigilator.controller';
import { InvigilatorService } from './invigilator.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvigilatorController],
  providers: [InvigilatorService],
})
export class InvigilatorModule {}
