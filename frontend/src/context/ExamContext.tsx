'use client';

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  useCallback,
} from 'react';

interface Option {
  key: string;
  value: string;
}

interface Question {
  id: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  difficulty: string;
  content: string;
  options: Option[];
  mediaUrl?: string | null;
}

interface ExamState {
  examId: string | null;
  examTitle: string;
  subjectCode: string;
  questions: Question[];
  answers: Record<string, string[]>;
  currentIndex: number;
  flagged: Set<number>;
  timerSeconds: number;
  isActive: boolean;
  totalQuestions: number;
  maxScore: number;
  durationMinutes: number;
}

type ExamAction =
  | {
      type: 'INIT_EXAM';
      payload: Omit<
        ExamState,
        'answers' | 'currentIndex' | 'flagged' | 'isActive'
      >;
    }
  | { type: 'SET_ANSWER'; payload: { questionId: string; answer: string[] } }
  | { type: 'GO_TO_QUESTION'; payload: number }
  | { type: 'TOGGLE_FLAG'; payload: number }
  | { type: 'TICK_TIMER' }
  | { type: 'END_EXAM' };

const initialState: ExamState = {
  examId: null,
  examTitle: '',
  subjectCode: '',
  questions: [],
  answers: {},
  currentIndex: 0,
  flagged: new Set(),
  timerSeconds: 0,
  isActive: false,
  totalQuestions: 0,
  maxScore: 10,
  durationMinutes: 60,
};

function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case 'INIT_EXAM':
      return {
        ...state,
        ...action.payload,
        answers: {},
        currentIndex: 0,
        flagged: new Set(),
        isActive: true,
      };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer,
        },
      };
    case 'GO_TO_QUESTION':
      return {
        ...state,
        currentIndex: Math.max(
          0,
          Math.min(action.payload, state.questions.length - 1),
        ),
      };
    case 'TOGGLE_FLAG': {
      const newFlagged = new Set(state.flagged);
      if (newFlagged.has(action.payload)) {
        newFlagged.delete(action.payload);
      } else {
        newFlagged.add(action.payload);
      }
      return { ...state, flagged: newFlagged };
    }
    case 'TICK_TIMER':
      return {
        ...state,
        timerSeconds: Math.max(0, state.timerSeconds - 1),
      };
    case 'END_EXAM':
      return { ...state, isActive: false };
    default:
      return state;
  }
}

interface ExamContextType extends ExamState {
  initExam: (
    data: Omit<ExamState, 'answers' | 'currentIndex' | 'flagged' | 'isActive'>,
  ) => void;
  setAnswer: (questionId: string, answer: string[]) => void;
  goToQuestion: (index: number) => void;
  toggleFlag: (index: number) => void;
  endExam: () => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(examReducer, initialState);

  const initExam = useCallback(
    (
      data: Omit<
        ExamState,
        'answers' | 'currentIndex' | 'flagged' | 'isActive'
      >,
    ) => {
      dispatch({ type: 'INIT_EXAM', payload: data });
    },
    [],
  );

  const setAnswer = useCallback((questionId: string, answer: string[]) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, answer } });
  }, []);

  const goToQuestion = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_QUESTION', payload: index });
  }, []);

  const toggleFlag = useCallback((index: number) => {
    dispatch({ type: 'TOGGLE_FLAG', payload: index });
  }, []);

  const endExam = useCallback(() => {
    dispatch({ type: 'END_EXAM' });
  }, []);

  return (
    <ExamContext.Provider
      value={{
        ...state,
        initExam,
        setAnswer,
        goToQuestion,
        toggleFlag,
        endExam,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}
