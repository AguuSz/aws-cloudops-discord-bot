export interface ParsedQuestion {
  questionNumber: number;
  text: string;
  options: QuestionOption[];
  correctIndices: number[];
  requiredAnswers: number;
  imageUrl: string | null;
}

export interface QuestionOption {
  index: number;
  text: string;
  imageUrl: string | null;
}

export interface QuestionRow {
  id: number;
  question_number: number;
  text: string;
  options: string;
  correct_indices: string;
  required_answers: number;
  image_url: string | null;
}

export interface UserAnswerRow {
  id: number;
  question_id: number;
  selected_indices: string;
  is_correct: number;
  answered_at: string;
}

export interface BotConfigRow {
  key: string;
  value: string;
}
