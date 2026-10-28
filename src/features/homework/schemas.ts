import { z } from 'zod';
import { validateFiles } from './submissionRules';

/** requireFiles: בהגשה ראשונה חובה לצרף קבצים. בהגשה חוזרת אפשר לעדכן רק את ההערה */
export function createSubmissionSchema(requireFiles: boolean) {
  return z.object({
    files: z.custom<FileList>().superRefine((value, ctx) => {
      const files: File[] = value ? Array.from<File>(value) : [];
      const message = validateFiles(files, requireFiles);
      if (message) ctx.addIssue({ code: 'custom', message });
    }),
    comment: z.string().trim().max(2000, 'ההערה ארוכה מדי (עד 2000 תווים)')
  });
}

export type SubmissionFormValues = z.infer<ReturnType<typeof createSubmissionSchema>>;
