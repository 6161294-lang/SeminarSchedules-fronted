import { useState } from 'react';
import { getErrorMessage } from '@/api/client';
import { submissionsApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import { saveBlob } from '@/utils/download';

interface DownloadButtonProps {
  fileId: string;
  fileName: string;
}

/** מורידה קובץ הגשה. הבקשה נשלחת עם המפתח, ולכן אי אפשר להשתמש בקישור רגיל */
export function DownloadButton({ fileId, fileName }: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const handleClick = async () => {
    setBusy(true);
    try {
      const { blob, fileName: serverName } = await submissionsApi.downloadFile(fileId);
      saveBlob(blob, serverName || fileName);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={() => void handleClick()}
      loading={busy}
      loadingText="מורידה..."
      aria-label={`הורדת ${fileName}`}
    >
      הורדה
    </Button>
  );
}
