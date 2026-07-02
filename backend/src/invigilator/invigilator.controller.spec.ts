import { Test, TestingModule } from '@nestjs/testing';
import { InvigilatorController } from './invigilator.controller';
import { InvigilatorService } from './invigilator.service';

describe('InvigilatorController', () => {
  let controller: InvigilatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvigilatorController],
      providers: [
        {
          provide: InvigilatorService,
          useValue: { getSessions: jest.fn(), getSessionStudents: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<InvigilatorController>(InvigilatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
