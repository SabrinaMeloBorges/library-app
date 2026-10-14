import { useCallback, useLayoutEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Searchbar, Text } from 'react-native-paper';
import { BookCover } from '../components/BookCover';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { MIN_SEARCH_LENGTH, useBookSearch } from '../hooks/useBookSearch';
import type { RootStackScreenProps } from '../navigation/types';
import type { CatalogBook } from '../services/catalogService';
import { spacing } from '../theme/spacing';

const MAX_CONTENT_WIDTH = 640;

const keyExtractor = (book: CatalogBook): string => book.externalId;

export const CatalogSearchScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'CatalogSearch'>) => {
  const theme = useAppTheme();
  const subject = route.params?.subject;
  const subjectLabel = route.params?.subjectLabel;
  const { query, setQuery, results, status, error, retry } = useBookSearch(undefined, subject);

  useLayoutEffect(() => {
    if (subjectLabel) navigation.setOptions({ title: subjectLabel });
  }, [navigation, subjectLabel]);

  const addManually = useCallback(() => navigation.navigate('BookForm'), [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: CatalogBook }) => (
      <View style={[styles.result, { borderBottomColor: theme.appColors.border }]}>
        <BookCover uri={item.coverUrl} title={item.title} width={52} />
        <View style={styles.resultText}>
          <Text variant="titleMedium" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.appColors.textMuted }}>
            {item.authors}
          </Text>
          {item.publisher ? (
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: theme.appColors.textMuted }}
            >
              {item.publisher}
            </Text>
          ) : null}
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {item.pageCount ? `${item.pageCount} páginas` : 'Número de páginas não informado'}
          </Text>
          <Button
            mode="outlined"
            compact
            icon="plus"
            style={styles.addButton}
            onPress={() => navigation.navigate('BookForm', { catalogBook: item })}
            accessibilityLabel={`Adicionar ${item.title} à biblioteca`}
          >
            Adicionar
          </Button>
        </View>
      </View>
    ),
    [navigation, theme],
  );

  const renderEmpty = () => {
    switch (status) {
      case 'loading':
        return <LoadingState message="Buscando no catálogo..." />;
      case 'error':
        return (
          <View>
            <ErrorState
              title="Catálogo indisponível"
              message={error ?? 'Não foi possível buscar livros.'}
              onRetry={retry}
            />
            <Button mode="contained" icon="pencil-plus-outline" onPress={addManually}>
              Cadastrar manualmente
            </Button>
          </View>
        );
      case 'empty':
        return (
          <EmptyState
            icon="book-search-outline"
            title="Nenhum resultado"
            description="Tente outro título ou nome de autor, ou cadastre o livro manualmente."
            action={
              <Button mode="outlined" onPress={addManually}>
                Cadastrar manualmente
              </Button>
            }
          />
        );
      default:
        return (
          <EmptyState
            icon="magnify"
            title="Pesquise no catálogo"
            description={`Digite pelo menos ${MIN_SEARCH_LENGTH} letras do título ou do autor. Os dados vêm do Open Library.`}
          />
        );
    }
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <View style={styles.header}>
        <Searchbar
          placeholder={subjectLabel ? `Buscar em ${subjectLabel}` : 'Título ou autor'}
          value={query}
          onChangeText={setQuery}
          autoFocus={!subject}
          loading={status === 'loading'}
          accessibilityLabel="Pesquisar no catálogo de livros"
          style={[
            styles.search,
            { backgroundColor: theme.appColors.surface, borderColor: theme.appColors.border },
          ]}
        />
        <Button mode="text" icon="pencil-plus-outline" onPress={addManually} style={styles.manual}>
          Cadastrar manualmente
        </Button>
      </View>
      <FlatList
        data={status === 'success' ? results : []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  search: { borderWidth: 1, elevation: 0 },
  manual: { alignSelf: 'flex-start', marginTop: spacing.xs },
  listContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  result: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: { flex: 1, gap: 2 },
  addButton: { alignSelf: 'flex-start', marginTop: spacing.sm },
});
