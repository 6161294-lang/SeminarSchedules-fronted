import { formatFileSize } from '@/utils/format';

// חייב להתאים לכללי ה-Backend (src/middleware/upload.ts)
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [
  '.pdf', '.zip', '.txt', '.md', '.png', '.jpg', '.jpeg', '.gif', '.doc', '.docx',
  '.json', '.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.cs', '.sql'
] as const;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

/** מחזירה הודעת שגיאה בעברית, או null כשהקבצים תקינים */
export function validateFiles(files: File[], required: boolean): string | null {
  if (files.length === 0) return required ? 'חובה לצרף לפחות קובץ אחד' : null;
  if (files.length > MAX_FILES) return `אפשר להעלות עד ${MAX_FILES} קבצים`;

  for (const file of files) {
    if (file.size === 0) return `הקובץ "${file.name}" ריק`;
    if (file.size > MAX_FILE_BYTES) {
      return `הקובץ "${file.name}" גדול מדי (עד ${formatFileSize(MAX_FILE_BYTES)})`;
    }
    const ext = extensionOf(file.name);
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      return `סוג הקובץ "${file.name}" אינו מותר`;
    }
  }
  return null;
}
