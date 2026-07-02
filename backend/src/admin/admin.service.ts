import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getDashboardStats() {
    return {
      totalExams: 12,
      activeStudents: 342,
      totalViolations: 3,
    };
  }
}
