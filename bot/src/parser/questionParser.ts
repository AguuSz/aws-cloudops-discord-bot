import { readFileSync } from 'fs';
import type { ParsedQuestion, QuestionOption } from '../models/types.js';

const SEPARATOR = '**[⬆ Back to Top](#table-of-contents)**';
const QUESTION_HEADER = /^### (.+)/;
const OPTION_LINE = /^- \[(x| )\] (.+)/;
const IMAGE_LINE = /^!\[.*?\]\((.+?)\)/;
const MULTI_ANSWER_PATTERNS = [
  /\(Select TWO\.?\)/i,
  /\(Choose two\.?\)/i,
  /\(Select THREE\.?\)/i,
  /\(Choose three\.?\)/i,
  /\(Select two\.?\)/i,
  /\(Choose TWO\.?\)/i,
];

function detectRequiredAnswers(text: string): number {
  for (const pattern of MULTI_ANSWER_PATTERNS) {
    if (pattern.test(text)) {
      if (/three/i.test(text)) return 3;
      return 2;
    }
  }
  return 1;
}

export function parseReadme(filePath: string, imagesBaseUrl: string): ParsedQuestion[] {
  const content = readFileSync(filePath, 'utf-8');
  const chunks = content.split(SEPARATOR);
  const questions: ParsedQuestion[] = [];
  let questionNumber = 0;

  for (const chunk of chunks) {
    const lines = chunk.split('\n');
    let questionText = '';
    let questionImageUrl: string | null = null;
    const options: QuestionOption[] = [];
    const correctIndices: number[] = [];
    let foundHeader = false;
    let optionIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Find question header
      const headerMatch = line.match(QUESTION_HEADER);
      if (headerMatch) {
        questionText = headerMatch[1].trim();
        foundHeader = true;
        continue;
      }

      if (!foundHeader) continue;

      // Check for question image (before options)
      if (options.length === 0) {
        const imgMatch = line.match(IMAGE_LINE);
        if (imgMatch) {
          const imgPath = imgMatch[1];
          if (imgPath.startsWith('images/')) {
            const filename = imgPath.replace('images/', '');
            questionImageUrl = `${imagesBaseUrl}/${filename}`;
          }
          continue;
        }
      }

      // Parse option lines
      const optionMatch = line.match(OPTION_LINE);
      if (optionMatch) {
        const isCorrect = optionMatch[1] === 'x';
        const optionText = optionMatch[2].trim();

        // Check next line for option image
        let optionImageUrl: string | null = null;
        const nextLine = lines[i + 1]?.trim();
        if (nextLine) {
          const nextImgMatch = nextLine.match(IMAGE_LINE);
          if (nextImgMatch) {
            const imgPath = nextImgMatch[1];
            if (imgPath.startsWith('images/')) {
              const filename = imgPath.replace('images/', '');
              optionImageUrl = `${imagesBaseUrl}/${filename}`;
            }
            i++; // Skip image line
          }
        }

        if (isCorrect) {
          correctIndices.push(optionIndex);
        }

        options.push({
          index: optionIndex,
          text: optionText,
          imageUrl: optionImageUrl,
        });

        optionIndex++;
      }
    }

    if (foundHeader && options.length >= 2 && correctIndices.length > 0) {
      questionNumber++;
      const requiredAnswers = detectRequiredAnswers(questionText);

      questions.push({
        questionNumber,
        text: questionText,
        options,
        correctIndices,
        requiredAnswers,
        imageUrl: questionImageUrl,
      });
    }
  }

  return questions;
}
