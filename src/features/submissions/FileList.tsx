import type { SubmissionFile } from '@/types/api';
import { formatFileSize } from '@/utils/format';
import { DownloadButton } from './DownloadButton';

/** רשימת קבצי הגשה עם גודל וכפתור הורדה. משותפת לתלמידה ולמורה */
export function FileList({ files }: { files: SubmissionFile[] }) {
  return (
    <ul className="file-list">
      {files.map((file) => (
        <li key={file.id}>
          <span>
            {file.fileName} <small className="muted">({formatFileSize(file.sizeBytes)})</small>
          </span>
          <DownloadButton fileId={file.id} fileName={file.fileName} />
        </li>
      ))}
    </ul>
  );
}
