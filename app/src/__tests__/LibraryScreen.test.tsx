import { fireEvent, screen } from '@testing-library/react-native';
import type { MainTabScreenProps } from '../navigation/types';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ApiError } from '../services/apiError';
import { libraryService } from '../services/libraryService';
import type { LibraryItem } from '../types/api';
import { renderWithProviders } from './renderWithProviders';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));
jest.mock('../services/libraryService', () => ({
  libraryService: { list: jest.fn() },
}));

const listMock = libraryService.list as jest.MockedFunction<typeof libraryService.list>;

const buildItem = (id: string, title: string): LibraryItem => ({
  id,
  status: 'WANT_TO_READ',
  totalPages: 200,
  currentPage: 0,
  progress: 0,
  rating: null,
  isFavorite: false,
  review: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-01T12:00:00.000Z',
  book: {
    id: `book-${id}`,
    title,
    authors: 'Clarice Lispector',
    publisher: null,
    coverUrl: null,
    isbn: null,
    externalSource: null,
    externalId: null,
  },
});

const renderScreen = async () => {
  const navigation = { navigate: jest.fn() };
  const props = {
    navigation,
    route: { key: 'library', name: 'Library' },
  } as unknown as MainTabScreenProps<'Library'>;
  await renderWithProviders(<LibraryScreen {...props} />);
  return navigation;
};

beforeEach(() => jest.clearAllMocks());

describe('LibraryScreen', () => {
  it('lista os livros na FlatList e navega para os detalhes com o bookId', async () => {
    listMock.mockResolvedValue([
      buildItem('11111111-1111-4111-8111-111111111111', 'A Hora da Estrela'),
      buildItem('22222222-2222-4222-8222-222222222222', 'Perto do Coração Selvagem'),
    ]);
    const navigation = await renderScreen();

    expect(await screen.findByText('Perto do Coração Selvagem')).toBeOnTheScreen();
    expect(screen.getByText('2 livros')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('A Hora da Estrela, de Clarice Lispector'));
    expect(navigation.navigate).toHaveBeenCalledWith('BookDetails', {
      bookId: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('mostra estado vazio para biblioteca sem livros', async () => {
    listMock.mockResolvedValue([]);
    await renderScreen();
    expect(await screen.findByText('Biblioteca vazia')).toBeOnTheScreen();
  });

  it('mostra erro com opção de tentar novamente', async () => {
    listMock.mockRejectedValueOnce(new ApiError('Não foi possível conectar à API', null));
    listMock.mockResolvedValueOnce([
      buildItem('33333333-3333-4333-8333-333333333333', 'Laços de Família'),
    ]);
    await renderScreen();

    expect(await screen.findByText('Não foi possível conectar à API')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByText('Laços de Família')).toBeOnTheScreen();
  });
});
