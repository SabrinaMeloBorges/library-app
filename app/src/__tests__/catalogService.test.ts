import {
  CatalogUnavailableError,
  catalogService,
  parseCatalogDoc,
} from '../services/catalogService';

const mockFetchResponse = (body: unknown, ok = true) => {
  global.fetch = jest.fn(async () => ({ ok, json: async () => body })) as unknown as typeof fetch;
};

describe('parseCatalogDoc', () => {
  it('normaliza um documento válido do Open Library', () => {
    expect(
      parseCatalogDoc({
        key: '/works/OL45883W',
        title: 'Dom Casmurro',
        author_name: ['Machado de Assis'],
        publisher: ['Garnier'],
        number_of_pages_median: 256,
        cover_i: 12345,
        isbn: ['invalido', '9788535910663'],
      }),
    ).toEqual({
      externalSource: 'openlibrary',
      externalId: 'works/OL45883W',
      title: 'Dom Casmurro',
      authors: 'Machado de Assis',
      publisher: 'Garnier',
      pageCount: 256,
      coverUrl: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
      isbn: '9788535910663',
    });
  });

  it('não inventa dados ausentes', () => {
    const parsed = parseCatalogDoc({
      key: '/works/OL1W',
      title: 'Sem dados',
      author_name: ['Autor'],
    });
    expect(parsed).toMatchObject({ publisher: null, pageCount: null, coverUrl: null, isbn: null });
  });

  it('descarta documentos inválidos', () => {
    expect(parseCatalogDoc({ key: '/books/OL1M', title: 'X', author_name: ['A'] })).toBeNull();
    expect(parseCatalogDoc({ key: '/works/OL1W', title: '', author_name: ['A'] })).toBeNull();
    expect(parseCatalogDoc({ key: '/works/OL1W', title: 'X' })).toBeNull();
  });
});

describe('catalogService.search', () => {
  it('retorna resultados válidos sem duplicatas', async () => {
    const doc = { key: '/works/OL1W', title: 'Livro', author_name: ['Autor'] };
    mockFetchResponse({ docs: [doc, doc, { key: 'invalido' }] });
    await expect(catalogService.search('livro')).resolves.toHaveLength(1);
  });

  it('lança erro de indisponibilidade quando a API falha', async () => {
    mockFetchResponse({}, false);
    await expect(catalogService.search('livro')).rejects.toBeInstanceOf(CatalogUnavailableError);
  });

  it('trata falha de rede', async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(catalogService.search('livro')).rejects.toThrow('Sem conexão com o catálogo');
  });
});
