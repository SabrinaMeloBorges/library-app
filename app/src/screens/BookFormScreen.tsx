import { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { BookCover } from '../components/BookCover';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { FormTextField } from '../components/FormTextField';
import { OptionChips } from '../components/OptionChips';
import { ScreenContainer } from '../components/ScreenContainer';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useActionFeedback } from '../hooks/useActionFeedback';
import type { RootStackScreenProps } from '../navigation/types';
import { toApiError } from '../services/apiError';
import { catalogService, type CatalogBook } from '../services/catalogService';
import { libraryService } from '../services/libraryService';
import type { LibraryItem, LibraryItemInput } from '../types/api';
import { STATUS_OPTIONS } from '../utils/labels';
import {
  hasErrors,
  validateBookForm,
  type BookFormValues,
  type FormErrors,
} from '../utils/validation';
import { spacing } from '../theme/spacing';

type Field = keyof BookFormValues;

const EMPTY_VALUES: BookFormValues = {
  title: '',
  authors: '',
  publisher: '',
  totalPages: '',
  currentPage: '0',
  status: 'WANT_TO_READ',
  isFavorite: false,
  review: '',
};

const valuesFromCatalog = (book: CatalogBook): BookFormValues => ({
  ...EMPTY_VALUES,
  title: book.title,
  authors: book.authors,
  publisher: book.publisher ?? '',
  totalPages: book.pageCount ? String(book.pageCount) : '',
});

const valuesFromItem = (item: LibraryItem): BookFormValues => ({
  title: item.book.title,
  authors: item.book.authors,
  publisher: item.book.publisher ?? '',
  totalPages: String(item.totalPages),
  currentPage: String(item.currentPage),
  status: item.status,
  isFavorite: item.isFavorite,
  review: item.review ?? '',
});

const toPayload = (
  values: BookFormValues,
): Omit<LibraryItemInput, 'externalSource' | 'externalId'> => ({
  title: values.title.trim(),
  authors: values.authors.trim(),
  publisher: values.publisher.trim() || null,
  totalPages: Number(values.totalPages.trim()),
  currentPage: values.currentPage.trim() === '' ? 0 : Number(values.currentPage.trim()),
  status: values.status,
  isFavorite: values.isFavorite,
  review: values.review.trim() || null,
});

type ScreenProps = RootStackScreenProps<'BookForm'>;

export const BookFormScreen = ({ navigation, route }: ScreenProps) => {
  const bookId = route.params?.bookId;
  const catalogBook = route.params?.catalogBook;
  const isEditing = Boolean(bookId);
  const loadItem = useCallback(() => libraryService.get(bookId as string), [bookId]);
  const existing = useAsyncResource(loadItem, { enabled: isEditing, refetchOnFocus: false });

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar livro' : 'Adicionar livro' });
  }, [navigation, isEditing]);

  if (isEditing && existing.isLoading) return <LoadingState message="Carregando livro..." />;
  if (isEditing && (existing.error || !existing.data)) {
    return (
      <ScreenContainer>
        <ErrorState message={existing.error ?? 'Livro não encontrado.'} onRetry={existing.reload} />
      </ScreenContainer>
    );
  }

  const initialValues = existing.data
    ? valuesFromItem(existing.data)
    : catalogBook
      ? valuesFromCatalog(catalogBook)
      : EMPTY_VALUES;

  return (
    <BookForm
      initialValues={initialValues}
      bookId={bookId}
      catalogBook={catalogBook}
      navigation={navigation}
    />
  );
};

interface BookFormProps {
  initialValues: BookFormValues;
  bookId?: string;
  catalogBook?: CatalogBook;
  navigation: ScreenProps['navigation'];
}

const BookForm = ({ initialValues, bookId, catalogBook, navigation }: BookFormProps) => {
  const theme = useAppTheme();
  const { notifySuccess } = useActionFeedback();
  const externalId = catalogBook?.externalId;
  const loadDetails = useCallback(() => catalogService.workDetails(externalId ?? ''), [externalId]);
  const workDetails = useAsyncResource(loadDetails, {
    enabled: Boolean(externalId),
    refetchOnFocus: false,
  });
  const [values, setValues] = useState<BookFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<Field>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <Key extends Field>(field: Key, value: BookFormValues[Key]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validateBookForm(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = toPayload(values);
      if (bookId) {
        await libraryService.update(bookId, payload);
        notifySuccess('Livro atualizado.');
        navigation.goBack();
        return;
      }
      const created = await libraryService.create({
        ...payload,
        coverUrl: catalogBook?.coverUrl ?? null,
        isbn: catalogBook?.isbn ?? null,
        description: workDetails.data?.description ?? null,
        subjects: workDetails.data?.subjects ?? null,
        externalSource: catalogBook ? catalogBook.externalSource : null,
        externalId: catalogBook ? catalogBook.externalId : null,
      });
      notifySuccess('Livro adicionado à biblioteca.');
      navigation.popTo('Main', { screen: 'Library' });
      navigation.navigate('BookDetails', { bookId: created.id });
    } catch (error) {
      const apiError = toApiError(error);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setSubmitError(apiError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      {catalogBook ? (
        <View style={[styles.catalogInfo, { borderColor: theme.appColors.border }]}>
          <BookCover uri={catalogBook.coverUrl} title={catalogBook.title} width={48} />
          <Text
            variant="bodySmall"
            style={[styles.catalogText, { color: theme.appColors.textMuted }]}
          >
            Dados preenchidos a partir do Open Library. Revise antes de salvar.
            {workDetails.data?.subjects ? `\nAssuntos: ${workDetails.data.subjects}` : ''}
          </Text>
        </View>
      ) : null}
      {submitError ? <FeedbackBanner type="error" message={submitError} /> : null}

      <FormTextField
        label="Título"
        required
        value={values.title}
        onChangeText={(text) => setField('title', text)}
        error={errors.title}
        maxLength={255}
        disabled={isSubmitting}
      />
      <FormTextField
        label="Autor"
        required
        value={values.authors}
        onChangeText={(text) => setField('authors', text)}
        error={errors.authors}
        hint="Separe vários autores por vírgula."
        maxLength={255}
        disabled={isSubmitting}
      />
      <FormTextField
        label="Editora"
        value={values.publisher}
        onChangeText={(text) => setField('publisher', text)}
        error={errors.publisher}
        maxLength={160}
        disabled={isSubmitting}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormTextField
            label="Nº de páginas"
            required
            value={values.totalPages}
            onChangeText={(text) => setField('totalPages', text.replace(/\D/g, ''))}
            error={errors.totalPages}
            keyboardType="number-pad"
            maxLength={6}
            disabled={isSubmitting}
          />
        </View>
        <View style={styles.flex}>
          <FormTextField
            label="Página atual"
            value={values.currentPage}
            onChangeText={(text) => setField('currentPage', text.replace(/\D/g, ''))}
            error={errors.currentPage}
            keyboardType="number-pad"
            maxLength={6}
            disabled={isSubmitting}
          />
        </View>
      </View>

      <Text variant="labelLarge" style={styles.label}>
        Status
      </Text>
      <OptionChips
        options={STATUS_OPTIONS}
        selected={values.status}
        onSelect={(status) => setField('status', status)}
        accessibilityLabel="Status de leitura"
      />

      <View style={[styles.switchRow, { borderColor: theme.appColors.border }]}>
        <View style={styles.flex}>
          <Text variant="bodyLarge">Favorito</Text>
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            Destaque este livro na sua biblioteca.
          </Text>
        </View>
        <Switch
          value={values.isFavorite}
          onValueChange={(isFavorite) => setField('isFavorite', isFavorite)}
          disabled={isSubmitting}
          accessibilityLabel="Favorito"
        />
      </View>

      <View style={styles.reviewField}>
        <FormTextField
          label="Resenha"
          value={values.review}
          onChangeText={(text) => setField('review', text)}
          error={errors.review}
          hint="Opcional. Suas impressões, trechos marcantes ou anotações sobre o livro."
          multiline
          numberOfLines={5}
          maxLength={5000}
          disabled={isSubmitting}
        />
      </View>

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submit}
        contentStyle={styles.submitContent}
      >
        Salvar
      </Button>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  label: { marginTop: spacing.xs },
  catalogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  catalogText: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewField: { marginTop: spacing.lg },
  submit: { marginTop: spacing.md },
  submitContent: { paddingVertical: spacing.xs },
});
