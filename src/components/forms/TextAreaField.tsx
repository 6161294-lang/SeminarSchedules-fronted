import { useId, type ComponentProps } from 'react';

interface TextAreaFieldProps extends ComponentProps<'textarea'> {
  label: string;
  error?: string | undefined;
}

export function TextAreaField({ label, error, id, ...textareaProps }: TextAreaFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <textarea
        id={fieldId}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...textareaProps}
      />
      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
