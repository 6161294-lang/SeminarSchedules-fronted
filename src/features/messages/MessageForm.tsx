import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSendThreadMessage } from '@/api/hooks/messaging';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { messageSchema, type MessageFormValues } from './schemas';

/** שליחת הודעה בשיחה. מורה לא שולחת teacherId (השרת יודע מי היא), מזכירה חייבת לציין למי */
export function MessageForm({ teacherId }: { teacherId?: string }) {
  const send = useSendThreadMessage();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: '' }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await send.mutateAsync({ teacherId, body: values.body });
      reset();
    } catch {
      /* השגיאה מוצגת למטה דרך send.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <TextAreaField label="הודעה חדשה" error={errors.body?.message} {...register('body')} />
      {send.isError && <Alert>{send.error.message}</Alert>}
      <Button type="submit" loading={send.isPending} loadingText="שולחת...">
        שליחה
      </Button>
    </form>
  );
}
