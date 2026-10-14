import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { FeedItemCard } from '../components/FeedItemCard';
import { CelebrationProvider } from '../context/CelebrationContext';
import { achievementService } from '../services/achievementService';
import { parseWorkDetails } from '../services/catalogService';
import type { FeedActivity } from '../types/social';
import { validateUsername } from '../utils/validation';
import { renderWithProviders } from './renderWithProviders';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));
jest.mock('../services/achievementService', () => ({
  achievementService: { pending: jest.fn(), markSeen: jest.fn(async () => undefined) },
}));

const pendingMock = achievementService.pending as jest.MockedFunction<
  typeof achievementService.pending
>;
const markSeenMock = achievementService.markSeen as jest.MockedFunction<
  typeof achievementService.markSeen
>;

const baseActivity: FeedActivity = {
  id: 'activity-1',
  type: 'REVIEW_POSTED',
  createdAt: new Date().toISOString(),
  user: { id: 'user-2', name: 'Clara Souza', username: 'clara.souza' },
  book: {
    userBookId: 'ub-1',
    title: 'Rebecca',
    authors: 'Daphne du Maurier',
    coverUrl: null,
    status: 'FINISHED',
    rating: 4,
    progress: 100,
    review: 'Manderley é personagem por si só.',
  },
  goal: null,
  achievement: null,
  likeCount: 2,
  commentCount: 1,
  likedByMe: false,
};

const renderCard = (activity: FeedActivity) => {
  const handlers = { onOpenUser: jest.fn(), onOpenComments: jest.fn(), onToggleLike: jest.fn() };
  return {
    handlers,
    view: renderWithProviders(<FeedItemCard activity={activity} {...handlers} />),
  };
};

beforeEach(() => jest.clearAllMocks());

describe('FeedItemCard', () => {
  it('mostra a resenha e encaminha curtida e comentários', async () => {
    const { handlers, view } = renderCard(baseActivity);
    await view;
    expect(screen.getByText('“Manderley é personagem por si só.”')).toBeOnTheScreen();
    expect(screen.getByLabelText('Avaliação 4 de 5')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Curtir'));
    expect(handlers.onToggleLike).toHaveBeenCalledWith(baseActivity);
    await fireEvent.press(screen.getByLabelText('Comentários'));
    expect(handlers.onOpenComments).toHaveBeenCalledWith('activity-1');
    await fireEvent.press(screen.getByLabelText('Ver perfil de Clara Souza'));
    expect(handlers.onOpenUser).toHaveBeenCalledWith('user-2');
  });

  it('exalta conquistas desbloqueadas com o nível', async () => {
    await renderCard({
      ...baseActivity,
      type: 'ACHIEVEMENT_UNLOCKED',
      book: null,
      achievement: {
        code: 'PAGES_1000',
        title: 'Mil páginas',
        description: 'Leu 1.000 páginas.',
        tier: 'SILVER',
        threshold: 1000,
      },
    }).view;
    expect(screen.getByText('Mil páginas')).toBeOnTheScreen();
    expect(screen.getByText('Conquista Prata')).toBeOnTheScreen();
  });
});

describe('CelebrationProvider', () => {
  it('celebra conquistas pendentes e marca como vistas ao continuar', async () => {
    pendingMock.mockResolvedValue([
      {
        code: 'FIRST_GOAL',
        title: 'Meta batida',
        description: 'Concluiu a primeira meta de leitura.',
        tier: 'SILVER',
        threshold: 1,
        unlockedAt: new Date().toISOString(),
      },
    ]);
    await renderWithProviders(<CelebrationProvider>{null}</CelebrationProvider>);

    expect(await screen.findByText('Meta batida', {}, { timeout: 3000 })).toBeOnTheScreen();
    expect(screen.getByText('Conquista desbloqueada · Prata')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Continuar'));
    await waitFor(() => expect(markSeenMock).toHaveBeenCalledWith(['FIRST_GOAL']));
  });
});

describe('dados auxiliares', () => {
  it('extrai descrição e assuntos de uma obra do Open Library', () => {
    expect(
      parseWorkDetails({
        description: { value: '  Um clássico.  ' },
        subjects: ['Fiction', 'Brazil', 'Classics', 'Extra'],
      }),
    ).toEqual({ description: 'Um clássico.', subjects: 'Fiction, Brazil, Classics' });
    expect(parseWorkDetails(null)).toEqual({ description: null, subjects: null });
  });

  it('valida nomes de usuário', () => {
    expect(validateUsername('', false)).toBeUndefined();
    expect(validateUsername('', true)).toBe('Informe um nome de usuário');
    expect(validateUsername('ana.leitora_1', true)).toBeUndefined();
    expect(validateUsername('Ana Leitora!', true)).toBeDefined();
  });
});
