export const DIFFICULTY_LABELS: Record<string, string> = {
  "0": "Dễ",
  "1": "Trung bình",
  "2": "Khó",
  "3": "Rất khó",
};

export const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTY_LABELS).map(
  ([value, label]) => ({ value, label }),
);
