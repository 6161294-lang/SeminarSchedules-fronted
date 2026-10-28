import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDeleteNote, useUpdateNote } from '@/api/hooks/notes';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { useToast } from '@/components/toast/useToast';
import type { Note } from '@/types/api';
import { dayName, formatDateTime } from '@/utils/format';
import { noteContentSchema, type NoteContentValues } from './schemas';

export function NoteItem({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  const remove = useDeleteNote();
  const toast = useToast();

  return (
    <li className="card note">
      <div className="card__row">
        {/* התווית: השיעור שבו ההערה נכתבה */}
        <span className="badge" data-testid="note-label">
          {note.lesson.subject} · יום {dayName(note.lesson.dayOfWeek)}
          {note.lesson.class ? ` · ${note.lesson.class}` : ''}
        </span>
        <small className="muted">{formatDateTime(note.createdAt)}</small>
      </div>

      {editing ? (
        <NoteEditForm note={note} onDone={() => setEditing(false)} />
      ) : (
        <>
          <p className="note__content">{note.content}</p>
          <div className="actions">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              עריכה
            </Button>
            <ConfirmButton
              loading={remove.isPending}
              onConfirm={() =>
                remove.mutate(note.id, {
                  onSuccess: () => toast.success('ההערה נמחקה'),
                  onError: (error) => toast.error(error.message)
                })
              }
            >
              מחיקה
            </ConfirmButton>
          </div>
        </>
      )}
    </li>
  );
}

function NoteEditForm({ note, onDone }: { note: Note; onDone: () => void }) {
  const update = useUpdateNote();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<NoteContentValues>({
    resolver: zodResolver(noteContentSchema),
    defaultValues: { content: note.content }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ id: note.id, content: values.content });
      toast.success('ההערה עודכנה');
      onDone();
    } catch {
      /* השגיאה מוצגת למטה דרך update.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <TextAreaField label="עריכת הערה" error={errors.content?.message} {...register('content')} />
      {update.isError && <Alert>{update.error.message}</Alert>}
      <div className="actions">
        <Button type="submit" loading={update.isPending} loadingText="שומרת...">
          שמירה
        </Button>
        <Button variant="secondary" onClick={onDone}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
