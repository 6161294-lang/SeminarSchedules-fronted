import { Alert } from './Alert';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div>
      <Alert>{message}</Alert>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          נסי שוב
        </Button>
      )}
    </div>
  );
}
