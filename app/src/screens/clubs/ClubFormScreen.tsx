import { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { FormTextField } from '../../components/FormTextField';
import { OptionChips, type ChipOption } from '../../components/OptionChips';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ErrorState, LoadingState } from '../../components/StateViews';
import { useActionFeedback } from '../../hooks/useActionFeedback';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import type { RootStackScreenProps } from '../../navigation/types';
import { toApiError } from '../../services/apiError';
import { clubService } from '../../services/clubService';
import { libraryService } from '../../services/libraryService';
import type { LibraryItem } from '../../types/api';
import type { ClubDetails } from '../../types/social';
import { hasErrors, type FormErrors } from '../../utils/validation';
import { spacing } from '../../theme/spacing';

interface ClubFormValues {
  name: string;
  description: string;
  currentUserBookId: string;
}

type Field = keyof ClubFormValues;
type ScreenProps = RootStackScreenProps<'ClubForm'>;

const NO_BOOK = 'none';

const validate = (values: ClubFormValues): FormErrors<Field> => ({
  name:
    values.name.trim().length < 3
      ? 'Use pelo menos 3 caracteres'
      : values.name.trim().length > 80
        ? 'Use no máximo 80 caracteres'
        : undefined,
  description: values.description.trim().length > 500 ? 'Use no máximo 500 caracteres' : undefined,
});

interface FormContext {
  club: ClubDetails | null;
  library: LibraryItem[];
}

export const ClubFormScreen = ({ navigation, route }: ScreenProps) => {
  const clubId = route.params?.clubId;
  const loader = useCallback(async (): Promise<FormContext> => {
    const [club, library] = await Promise.all([
      clubId ? clubService.get(clubId) : Promise.resolve(null),
      libraryService.list({ sort: 'updatedAt', order: 'desc' }),
    ]);
    return { club, library };
  }, [clubId]);
  const context = useAsyncResource(loader, { refetchOnFocus: false });

  useLayoutEffect(() => {
    navigation.setOptions({ title: clubId ? 'Editar clube' : 'Novo clube' });
  }, [navigation, clubId]);

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

  const { club, library } = context.data;
  const currentItem = club?.currentBook
    ? library.find((item) => item.book.id === club.currentBook?.id)
    : undefined;

  return (
    <ClubForm
      clubId={clubId}
      library={library}
      initialValues={{
        name: club?.name ?? '',
        description: club?.description ?? '',
        currentUserBookId: currentItem?.id ?? NO_BOOK,
      }}
      navigation={navigation}
    />
  );
};

interface ClubFormProps {
  clubId?: string;
  library: LibraryItem[];
  initialValues: ClubFormValues;
  navigation: ScreenProps['navigation'];
}

const ClubForm = ({ clubId, library, initialValues, navigation }: ClubFormProps) => {
  const theme = useAppTheme();
  const { notifySuccess } = useActionFeedback();
  const [values, setValues] = useState<ClubFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookOptions: ChipOption<string>[] = [
    { value: NO_BOOK, label: 'Nenhum' },
    ...library
      .filter((item) => item.status === 'READING' || item.status === 'WANT_TO_READ')
      .slice(0, 12)
      .map((item) => ({ value: item.id, label: item.book.title })),
  ];

  const setField = (field: Field) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validate(values);
    setErrors(validation);
    if (hasErrors(validation)) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      currentUserBookId: values.currentUserBookId === NO_BOOK ? null : values.currentUserBookId,
    };
    try {
      if (clubId) {
        await clubService.update(clubId, payload);
        notifySuccess('Clube atualizado.');
        navigation.goBack();
        return;
      }
      const created = await clubService.create(payload);
      notifySuccess('Clube criado! Convide seus amigos.');
      navigation.replace('ClubDetails', { clubId: created.id });
    } catch (error) {
      const apiError = toApiError(error);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setSubmitError(apiError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      {submitError ? <FeedbackBanner type="error" message={submitError} /> : null}
      <FormTextField
        label="Nome do clube"
        required
        value={values.name}
        onChangeText={setField('name')}
        error={errors.name}
        maxLength={80}
        placeholder="Ex.: Clube Dark Academia"
        disabled={isSubmitting}
      />
      <FormTextField
        label="Descrição"
        value={values.description}
        onChangeText={setField('description')}
        error={errors.description}
        hint="Combine o ritmo de leitura, dias de encontro ou o tema do clube."
        multiline
        numberOfLines={3}
        maxLength={500}
        disabled={isSubmitting}
      />
      <Text variant="labelLarge">Leitura do momento</Text>
      <Text variant="bodySmall" style={[styles.hint, { color: theme.appColors.textMuted }]}>
        Escolha um livro da sua biblioteca (lendo ou quero ler).
      </Text>
      <OptionChips
        options={bookOptions}
        selected={values.currentUserBookId}
        onSelect={(value) => setValues((current) => ({ ...current, currentUserBookId: value }))}
        accessibilityLabel="Leitura do momento"
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
        {clubId ? 'Salvar clube' : 'Criar clube'}
      </Button>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hint: { marginBottom: spacing.xs },
  submit: { marginTop: spacing.xl },
  submitContent: { paddingVertical: spacing.xs },
});
