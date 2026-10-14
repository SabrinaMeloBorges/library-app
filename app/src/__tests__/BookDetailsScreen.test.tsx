import { fireEvent, screen } from '@testing-library/react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { BookDetailsScreen } from '../screens/BookDetailsScreen';
import { ApiError } from '../services/apiError';
import { libraryService } from '../services/libraryService';
import { readingSessionService } from '../services/readingSessionService';
import type { LibraryItem } from '../types/api';
import { renderWithProviders } from './renderWithProviders';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));
jest.mock('../services/libraryService', () => ({
  libraryService: { get: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));
jest.mock('../services/readingSessionService', () => ({
  readingSessionService: { list: jest.fn(), remove: jest.fn() },
}));

const getMock = libraryService.get as jest.MockedFunction<typeof libraryService.get>;
const updateMock = libraryService.update as jest.MockedFunction<typeof libraryService.update>;
const listSessionsMock = readingSessionService.list as jest.MockedFunction<
  typeof readingSessionService.list
>;

const BOOK_ID = '7d9b1d36-0f39-4c51-9a3f-1c7a0f3a9e10';

const item: LibraryItem = {
  id: BOOK_ID,
  status: 'READING',
  totalPages: 300,
  currentPage: 90,
  progress: 30,
  rating: 4,
  isFavorite: true,
  review: 'Narrador defunto e irônico.',
  startedAt: '2026-05-01T12:00:00.000Z',
  finishedAt: null,
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-02T12:00:00.000Z',
  book: {
    id: 'book-1',
    title: 'Memórias Póstumas de Brás Cubas',
    authors: 'Machado de Assis',
    publisher: 'Penguin',
    coverUrl: null,
    isbn: null,
    externalSource: null,
    externalId: null,
  },
};

const renderScreen = async (bookId: string) => {
  const navigation = { setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() };
  const props = {
    navigation,
    route: { key: 'details', name: 'BookDetails', params: { bookId } },
  } as unknown as RootStackScreenProps<'BookDetails'>;
  await renderWithProviders(<BookDetailsScreen {...props} />);
  return navigation;
};

beforeEach(() => {
  jest.clearAllMocks();
  listSessionsMock.mockResolvedValue([]);
});

describe('BookDetailsScreen', () => {
  it('usa o bookId recebido por parâmetro para buscar o livro', async () => {
    getMock.mockResolvedValue(item);
    const navigation = await renderScreen(BOOK_ID);

    expect(await screen.findByText('Machado de Assis')).toBeOnTheScreen();
    expect(screen.getAllByText('Memórias Póstumas de Brás Cubas').length).toBeGreaterThan(0);
    expect(screen.getByText('Página 90 de 300')).toBeOnTheScreen();
    expect(screen.getByText('Narrador defunto e irônico.')).toBeOnTheScreen();
    expect(getMock).toHaveBeenCalledWith(BOOK_ID);
    expect(listSessionsMock).toHaveBeenCalledWith({ userBookId: BOOK_ID });
    expect(screen.getByText('Nenhuma sessão registrada para este livro ainda.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Registrar sessão de leitura'));
    expect(navigation.navigate).toHaveBeenCalledWith('SessionForm', { userBookId: BOOK_ID });
  });

  it('salva alteração na API e exibe feedback de sucesso', async () => {
    getMock.mockResolvedValue(item);
    updateMock.mockResolvedValue({ ...item, status: 'PAUSED' });
    await renderScreen(BOOK_ID);

    await fireEvent.press(await screen.findByText('Pausado'));

    expect(updateMock).toHaveBeenCalledWith(BOOK_ID, { status: 'PAUSED' });
    expect(await screen.findByText('Status atualizado.')).toBeOnTheScreen();
  });

  it('rejeita parâmetro inválido sem chamar a API', async () => {
    await renderScreen('nao-e-um-uuid');
    expect(screen.getByText('Livro inválido')).toBeOnTheScreen();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('exibe erro para livro inexistente', async () => {
    getMock.mockRejectedValue(new ApiError('Livro não encontrado na sua biblioteca', 404));
    await renderScreen(BOOK_ID);
    expect(await screen.findByText('Livro não encontrado na sua biblioteca')).toBeOnTheScreen();
    expect(screen.getByText('Tentar novamente')).toBeOnTheScreen();
  });
});
