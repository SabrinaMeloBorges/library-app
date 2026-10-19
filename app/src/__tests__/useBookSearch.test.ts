import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBookSearch } from '../hooks/useBookSearch';
import {
  CatalogUnavailableError,
  catalogService,
  type CatalogBook,
} from '../services/catalogService';

jest.mock('../services/catalogService', () => {
  const actual = jest.requireActual('../services/catalogService');
  return { ...actual, catalogService: { search: jest.fn() } };
});

const searchMock = catalogService.search as jest.MockedFunction<typeof catalogService.search>;

const book: CatalogBook = {
  externalSource: 'openlibrary',
  externalId: 'works/OL1W',
  title: 'O Alienista',
  authors: 'Machado de Assis',
  publisher: null,
  pageCount: 96,
  coverUrl: null,
  isbn: null,
};

const typeQuery = async (setQuery: (value: string) => void, value: string) => {
  await act(async () => setQuery(value));
  await act(() => new Promise((resolve) => setTimeout(resolve, 5)));
};

describe('useBookSearch', () => {
  beforeEach(() => searchMock.mockReset());

  it('permanece ocioso com termos curtos', async () => {
    const { result } = await renderHook(() => useBookSearch(0));
    await typeQuery(result.current.setQuery, 'ab');
    expect(result.current.status).toBe('idle');
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('busca, exibe carregamento e retorna resultados', async () => {
    let resolveSearch: (books: CatalogBook[]) => void = () => undefined;
    searchMock.mockImplementation(
      () => new Promise<CatalogBook[]>((resolve) => (resolveSearch = resolve)),
    );
    const { result } = await renderHook(() => useBookSearch(0));

    await typeQuery(result.current.setQuery, 'alienista');
    await waitFor(() => expect(result.current.status).toBe('loading'));

    await act(async () => resolveSearch([book]));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.results).toEqual([book]);
    expect(searchMock).toHaveBeenCalledTimes(1);
  });

  it('informa lista vazia', async () => {
    searchMock.mockResolvedValue([]);
    const { result } = await renderHook(() => useBookSearch(0));
    await typeQuery(result.current.setQuery, 'xyzxyz');
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('expõe erro e permite tentar novamente', async () => {
    searchMock.mockRejectedValueOnce(new CatalogUnavailableError()).mockResolvedValueOnce([book]);
    const { result } = await renderHook(() => useBookSearch(0));

    await typeQuery(result.current.setQuery, 'alienista');
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('O catálogo de livros está indisponível no momento.');

    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(searchMock).toHaveBeenCalledTimes(2);
  });
});
