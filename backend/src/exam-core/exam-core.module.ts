import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ExamCoreClient } from './exam-core.client';
import { ExamCoreMockClient } from './exam-core.mock.client';
import { ExamCoreHttpClient } from './exam-core.http.client';
import { ExamCoreService } from './exam-core.service';
import { ExamCoreController } from './exam-core.controller';

/**
 * Module tích hợp exam-core (KT&ĐBCL).
 *
 * Chọn nguồn theo cờ EXAM_SOURCE:
 *   - 'exam-core' + có EXAM_CORE_TOKEN  -> gọi HTTP THẬT (ExamCoreHttpClient)
 *   - còn lại (mặc định)                 -> dùng MOCK fixture (ExamCoreMockClient)
 * Nhờ vậy bên kia chưa cấp token vẫn chạy được; có token chỉ cần đổi .env.
 */
@Module({
  imports: [ConfigModule],
  controllers: [ExamCoreController],
  providers: [
    ExamCoreMockClient,
    ExamCoreHttpClient,
    {
      provide: ExamCoreClient,
      inject: [ConfigService, ExamCoreMockClient, ExamCoreHttpClient],
      useFactory: (
        config: ConfigService,
        mock: ExamCoreMockClient,
        http: ExamCoreHttpClient,
      ): ExamCoreClient => {
        const logger = new Logger('ExamCoreModule');
        const useHttp =
          config.get<string>('EXAM_SOURCE') === 'exam-core' &&
          !!config.get<string>('EXAM_CORE_TOKEN');
        logger.log(
          useHttp
            ? 'Nguồn câu hỏi: exam-core (HTTP thật)'
            : 'Nguồn câu hỏi: MOCK fixture (chưa có token exam-core)',
        );
        return useHttp ? http : mock;
      },
    },
    ExamCoreService,
  ],
  exports: [ExamCoreService],
})
export class ExamCoreModule {}
