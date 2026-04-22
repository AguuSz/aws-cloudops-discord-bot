export const OPTION_EMOJIS = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'] as const;

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export function getEmoji(index: number): string {
  return OPTION_EMOJIS[index] ?? `${index + 1}`;
}

export function getLabel(index: number): string {
  return OPTION_LABELS[index] ?? `${index + 1}`;
}
