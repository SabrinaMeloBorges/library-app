import { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { FormTextField } from '../components/FormTextField';
import { ScreenContainer } from '../components/ScreenContainer';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useActionFeedback } from '../hooks/useActionFeedback';
import type { RootStackScreenProps } from '../navigation/types';
import { toApiError } from '../services/apiError';
import { libraryService } from '../services/libraryService';
import { readingSessionService } from '../services/readingSessionService';
import type { LibraryItem, ReadingSession } from '../types/api';
import { combineDateAndTime, toDateKey, toTimeKey } from '../utils/dates';
import {
  hasErrors,
  validateSessionForm,
  type FormErrors,
  type SessionFormValues,
} from '../utils/validation';
import { spacing } from '../theme/spacing';

type Field = keyof SessionFormValues;

interface SessionContext {
  item: LibraryItem;
  session: ReadingSession | null;
}

const initialValues = (context: SessionContext): SessionFormValues => {
  const { item, session } = context;
  if (session) {
    const readAt = new Date(session.readAt);
    return {
      startPage: String(session.startPage),
      endPage: String(session.endPage),
      durationMinutes: String(session.durationMinutes),
      date: toDateKey(readAt),
      time: toTimeKey(readAt),
      note: session.note ?? '',
    };
  }
  const now = new Date();
  const startPage = item.currentPage < item.totalPages ? item.currentPage : 0;
  return {
    startPage: String(startPage),
    endPage: '',
    durationMinutes: '',
    date: toDateKey(now),
    time: toTimeKey(now),
    note: '',
  };
};

const digitsOnly = (text: string): string => text.replace(/\D/g, '');

type ScreenProps = RootStackScreenProps<'SessionForm'>;

export const SessionFormScreen = ({ navigation, route }: ScreenProps) => {
  const { userBookId, sessionId } = route.params;
  const isEditing = Boolean(sessionId);

  const loadContext = useCallback(async (): Promise<SessionContext> => {
    const [item, sessions] = await Promise.all([
      libraryService.get(userBookId),
      sessionId ? readingSessionService.list({ userBookId }) : Promise.resolve([]),
    ]);
    const session = sessionId ? (sessions.find((entry) => entry.id === sessionId) ?? null) : null;
    if (sessionId && !session) throw new Error('Sessão não encontrada.');
    return { item, session };
  }, [userBookId, sessionId]);

  const context = useAsyncResource(loadContext, { refetchOnFocus: false });

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar sessão' : 'Nova sessão' });
  }, [navigation, isEditing]);

  if (context.isLoading) return <LoadingState />;
  if (context.error || !context.data) {
    return (
      <ScreenContainer>
        <ErrorState
          message={context.error ?? 'Não foi possível carregar.'}
          onRetry={context.reload}
        />
      </ScreenContainer>
    );
  }

  return (
    <SessionForm
      item={context.data.item}
      initialValues={initialValues(context.data)}
      sessionId={sessionId}
      navigation={navigation}
    />
  );
};

interface SessionFormProps {
  item: LibraryItem;
  initialValues: SessionFormValues;
  sessionId?: string;
  navigation: ScreenProps['navigation'];
}

const SessionForm = ({ item, initialValues: initial, sessionId, navigation }: SessionFormProps) => {
  const theme = useAppTheme();
  const { notifySuccess } = useActionFeedback();
  const userBookId = item.id;
  const [values, setValues] = useState<SessionFormValues>(initial);
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startNumber = Number(values.startPage);
  const endNumber = Number(values.endPage);
  const pagesPreview =
    values.startPage !== '' && values.endPage !== '' && endNumber > startNumber
      ? endNumber - startNumber
      : null;

  const setField = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validateSessionForm(values, item.totalPages);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const payload = {
      startPage: startNumber,
      endPage: endNumber,
      durationMinutes: Number(values.durationMinutes),
      readAt: combineDateAndTime(values.date, values.time).toISOString(),
      note: values.note.trim() || null,
    };
    try {
      if (sessionId) await readingSessionService.update(sessionId, payload);
      else await readingSessionService.create({ ...payload, userBookId });
      notifySuccess(sessionId ? 'Sessão atualizada.' : 'Sessão registrada. Progresso atualizado.');
      navigation.goBack();
    } catch (error) {
      const apiError = toApiError(error);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setSubmitError(apiError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Text variant="titleLarge">{item.book.title}</Text>
      <Text variant="bodySmall" style={[styles.subtitle, { color: theme.appColors.textMuted }]}>
        Página atual: {item.currentPage} de {item.totalPages}
      </Text>
      {submitError ? <FeedbackBanner type="error" message={submitError} /> : null}

      <View style={styles.row}>
        <View style={styles.flex}>
          <FormTextField
            label="Página inicial"
            required
            value={values.startPage}
            onChangeText={(text) => setField('startPage', digitsOnly(text))}
            error={errors.startPage}
            keyboardType="number-pad"
            maxLength={6}
            disabled={isSubmitting}
          />
        </View>
        <View style={styles.flex}>
          <FormTextField
            label="Página final"
            required
            value={values.endPage}
            onChangeText={(text) => setField('endPage', digitsOnly(text))}
            error={errors.endPage}
            keyboardType="number-pad"
            maxLength={6}
            disabled={isSubmitting}
          />
        </View>
      </View>
      <Text variant="bodyMedium" style={[styles.preview, { color: theme.appColors.accent }]}>
        {pagesPreview !== null ? `${pagesPreview} páginas nesta sessão` : ' '}
      </Text>

      <FormTextField
        label="Duração (minutos)"
        required
        value={values.durationMinutes}
        onChangeText={(text) => setField('durationMinutes', digitsOnly(text))}
        error={errors.durationMinutes}
        keyboardType="number-pad"
        maxLength={4}
        disabled={isSubmitting}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormTextField
            label="Data"
            required
            value={values.date}
            onChangeText={(text) => setField('date', text)}
            error={errors.date}
            hint="AAAA-MM-DD"
            maxLength={10}
            keyboardType="numbers-and-punctuation"
            disabled={isSubmitting}
          />
        </View>
        <View style={styles.flex}>
          <FormTextField
            label="Hora"
            required
            value={values.time}
            onChangeText={(text) => setField('time', text)}
            error={errors.time}
            hint="HH:MM"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
            disabled={isSubmitting}
          />
        </View>
      </View>
      <FormTextField
        label="Observação"
        value={values.note}
        onChangeText={(text) => setField('note', text)}
        error={errors.note}
        multiline
        numberOfLines={3}
        maxLength={1000}
        disabled={isSubmitting}
      />

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submit}
        contentStyle={styles.submitContent}
      >
        Salvar sessão
      </Button>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  subtitle: { marginBottom: spacing.lg },
  preview: { marginTop: -spacing.sm, marginBottom: spacing.md },
  submit: { marginTop: spacing.lg },
  submitContent: { paddingVertical: spacing.xs },
});
