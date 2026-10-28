import { useId, type ComponentProps } from 'react';

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string;
  error?: string | undefined;
}

/** שדה בחירה עם תווית והודעת שגיאה. האפשרויות מועברות כ-children (option) */
export function SelectField({ label, error, id, children, ...selectProps }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className="field">
      <label htmlFor={selectId}>{label}</label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...selectProps}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
