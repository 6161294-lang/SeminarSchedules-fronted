import { useId, type ComponentProps } from 'react';

interface CheckboxFieldProps extends ComponentProps<'input'> {
  label: string;
}

export function CheckboxField({ label, id, ...inputProps }: CheckboxFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="field field--checkbox">
      <input id={inputId} type="checkbox" {...inputProps} />
      <label htmlFor={inputId}>{label}</label>
    </div>
  );
}
