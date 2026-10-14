import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, FAB, IconButton, Menu, Searchbar, Text } from 'react-native-paper';
import { BookGridItem } from '../components/BookGridItem';
import { BookListItem } from '../components/BookListItem';
import { OptionChips, type ChipOption } from '../components/OptionChips';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLibrary } from '../hooks/useLibrary';
import { useStoredPreference } from '../hooks/useStoredPreference';
import type { MainTabScreenProps } from '../navigation/types';
import { STORAGE_KEYS } from '../services/preferencesStorage';
import type { LibraryItem, LibrarySortField, ReadingStatus } from '../types/api';
import { SORT_OPTIONS, STATUS_OPTIONS } from '../utils/labels';
import { spacing } from '../theme/spacing';

type ViewMode = 'list' | 'grid';
type StatusFilter = ReadingStatus | 'ALL';

const isViewMode = (value: unknown): value is ViewMode => value === 'list' || value === 'grid';

const STATUS_FILTERS: ChipOption<StatusFilter>[] = [
  { value: 'ALL', label: 'Todos' },
  ...STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
];

const MAX_CONTENT_WIDTH = 640;
const GRID_COLUMNS = 3;

const defaultOrderFor = (sort: LibrarySortField): 'asc' | 'desc' =>
  sort === 'title' ? 'asc' : 'desc';

const keyExtractor = (item: LibraryItem): string => item.id;

export const LibraryScreen = ({ navigation }: MainTabScreenProps<'Library'>) => {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sort, setSort] = useState<LibrarySortField>('updatedAt');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useStoredPreference<ViewMode>(
    STORAGE_KEYS.libraryView,
    'list',
    isViewMode,
  );
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      sort,
      order: defaultOrderFor(sort),
    }),
    [debouncedSearch, statusFilter, sort],
  );
  const { data, error, isLoading, isRefreshing, reload, refresh } = useLibrary(query);

  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - spacing.lg * 2;
  const gridItemWidth = Math.floor((contentWidth - spacing.md * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
  const hasFilters = Boolean(debouncedSearch) || statusFilter !== 'ALL';

  const openBook = useCallback(
    (bookId: string) => navigation.navigate('BookDetails', { bookId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: LibraryItem }) =>
      viewMode === 'grid' ? (
        <BookGridItem item={item} width={gridItemWidth} onPress={openBook} />
      ) : (
        <BookListItem item={item} onPress={openBook} />
      ),
    [viewMode, gridItemWidth, openBook],
  );

  const renderEmpty = () => {
    if (isLoading) return <LoadingState message="Carregando biblioteca..." />;
    if (error) return <ErrorState message={error} onRetry={reload} />;
    if (hasFilters) {
      return (
        <EmptyState
          icon="book-search-outline"
          title="Nenhum livro encontrado"
          description="Ajuste a pesquisa ou os filtros para ver outros livros."
          action={
            <Button
              mode="outlined"
              onPress={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon="bookshelf"
        title="Biblioteca vazia"
        description="Pesquise no catálogo ou cadastre manualmente o primeiro livro da sua estante."
        action={
          <Button mode="contained" icon="plus" onPress={() => navigation.navigate('CatalogSearch')}>
            Adicionar livro
          </Button>
        }
      />
    );
  };

  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? '';

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right']}
    >
      <View style={styles.header}>
        <Searchbar
          placeholder="Pesquisar por título ou autor"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Pesquisar na biblioteca"
          style={[
            styles.search,
            { backgroundColor: theme.appColors.surface, borderColor: theme.appColors.border },
          ]}
          inputStyle={styles.searchInput}
        />
        <OptionChips
          horizontal
          options={STATUS_FILTERS}
          selected={statusFilter}
          onSelect={setStatusFilter}
          accessibilityLabel="Filtrar por status"
        />
        <View style={styles.toolbar}>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                icon="sort"
                compact
                onPress={() => setSortMenuVisible(true)}
                accessibilityLabel={`Ordenar. Atual: ${currentSortLabel}`}
              >
                {currentSortLabel}
              </Button>
            }
          >
            {SORT_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                title={option.label}
                leadingIcon={option.value === sort ? 'check' : undefined}
                onPress={() => {
                  setSort(option.value);
                  setSortMenuVisible(false);
                }}
              />
            ))}
          </Menu>
          <View style={styles.toolbarRight}>
            {data ? (
              <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                {data.length} {data.length === 1 ? 'livro' : 'livros'}
              </Text>
            ) : null}
            <IconButton
              icon={viewMode === 'list' ? 'view-grid-outline' : 'view-list-outline'}
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              accessibilityLabel={viewMode === 'list' ? 'Mostrar em grade' : 'Mostrar em lista'}
            />
          </View>
        </View>
      </View>

      <FlatList
        key={viewMode}
        data={error ? [] : (data ?? [])}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={viewMode === 'grid' ? GRID_COLUMNS : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.appColors.primary}
            colors={[theme.appColors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
      />

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('CatalogSearch')}
        style={[styles.fab, { backgroundColor: theme.appColors.primary }]}
        color={theme.appColors.onPrimary}
        accessibilityLabel="Adicionar livro"
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
    gap: spacing.xs,
  },
  search: { borderWidth: 1, elevation: 0 },
  searchInput: { minHeight: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarRight: { flexDirection: 'row', alignItems: 'center' },
  listContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 96,
    flexGrow: 1,
  },
  gridRow: { gap: spacing.md },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});
