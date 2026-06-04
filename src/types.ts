export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; // base64 representation
}

export type TeachingPersona = "simple" | "deep" | "fast";

export interface LectureResponse {
  moduleTitle: string;
  explanation: string;
  keyTakeaway: string;
}

export interface SummarizeResponse {
  overview: string;
  bulletPoints: string[];
  mainTakeaway: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export type NavTab = "lecture" | "summarizer" | "quiz";

export type QuizMode = "solo" | "vs";

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  mode: QuizMode;
  scores: {
    solo: number;
    playerA: number; // Brother A
    playerB: number; // Brother B
  };
  currentPlayerTurn: "playerA" | "playerB"; // For vs mode
  selectedAnswerIndex: number | null;
  isAnswerSubmitted: boolean;
  history: {
    questionIndex: number;
    player: "solo" | "playerA" | "playerB";
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
}
