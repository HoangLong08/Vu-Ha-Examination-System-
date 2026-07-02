import Dexie, { type Table } from 'dexie';

export interface LocalAnswer {
  questionId: string;
  answerValue: string[];
  timestamp: string;
  isSynced: number; // 0: false, 1: true
}

class ExamDatabase extends Dexie {
  answers!: Table<LocalAnswer>;

  constructor() {
    super('DAU_Exam_LocalDB');
    this.version(1).stores({
      answers: 'questionId, isSynced, timestamp',
    });
  }
}

export const localDb = new ExamDatabase();

export const saveAnswerLocally = async (questionId: string, answerValue: string[]) => {
  await localDb.answers.put({
    questionId,
    answerValue,
    timestamp: new Date().toISOString(),
    isSynced: 0,
  });
};

export const getLocalAnswers = async () => {
  return localDb.answers.toArray();
};

/** All answers not yet confirmed persisted to the server (isSynced === 0). */
export const getUnsynced = async (): Promise<LocalAnswer[]> => {
  return localDb.answers.where('isSynced').equals(0).toArray();
};

/** Mark a single locally-stored answer as synced to the server. */
export const markSynced = async (questionId: string) => {
  await localDb.answers.update(questionId, { isSynced: 1 });
};

export const clearLocalAnswers = async () => {
  await localDb.answers.clear();
};
