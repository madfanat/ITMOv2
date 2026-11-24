export const limits = { minTitle: 5, maxTitle: 120, maxBody: 2000 };
export const threshold = 0.8;
export const categories = ['bug', 'task', 'feature'] as const;

export type Category = (typeof categories)[number];
export type Issue = { title: string; body: string };
export type Classification = { type: Category; confidence: number };
export type Result = { classification: Classification | null };
export type FormErrors = Partial<Record<keyof Issue, string>>;

export function validateIssue(issue: Issue): FormErrors {
  const errors: FormErrors = {};
  const title = issue.title.trim();
  if (!title) {
    errors.title = 'Введите заголовок.';
  } else if (title.length < limits.minTitle || title.length > limits.maxTitle) {
    errors.title = `Введите от ${limits.minTitle} до ${limits.maxTitle} символов.`;
  }
  if (issue.body.length > limits.maxBody) {
    errors.body = `Сократите описание до ${limits.maxBody} символов.`;
  }
  return errors;
}

export function parseResult(value: unknown): Result {
  if (!value || typeof value !== 'object' || !('classification' in value)) {
    throw new Error('Unexpected classification response');
  }
  const classification = value.classification;
  if (classification === null) return { classification };
  if (!classification || typeof classification !== 'object' || !('type' in classification) || !('confidence' in classification)) {
    throw new Error('Unexpected classification response');
  }
  const { type, confidence } = classification;
  const category = categories.find(candidate => candidate === type);
  if (!category || typeof confidence !== 'number' || !(confidence >= threshold && confidence <= 1)) {
    throw new Error('Unexpected classification response');
  }
  return { classification: { type: category, confidence } };
}
