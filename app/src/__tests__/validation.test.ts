import {
  hasErrors,
  validateBookForm,
  validateGoalForm,
  validateRegisterForm,
  validateSessionForm,
  type BookFormValues,
  type SessionFormValues,
} from '../utils/validation';

const book: BookFormValues = {
  title: 'Grande Sertão: Veredas',
  authors: 'João Guimarães Rosa',
  publisher: '',
  totalPages: '600',
  currentPage: '0',
  status: 'WANT_TO_READ',
  isFavorite: false,
  review: '',
};

describe('validateBookForm', () => {
  it('aceita um livro válido', () => {
    expect(hasErrors(validateBookForm(book))).toBe(false);
  });

  it('exige título, autor e número positivo de páginas', () => {
    const errors = validateBookForm({ ...book, title: ' ', authors: '', totalPages: '0' });
    expect(errors.title).toBe('Informe o título');
    expect(errors.authors).toBe('Informe o autor');
    expect(errors.totalPages).toBe('Informe um número positivo de páginas');
  });

  it('impede página atual maior que o total', () => {
    const errors = validateBookForm({ ...book, totalPages: '100', currentPage: '150' });
    expect(errors.currentPage).toBe('A página atual não pode passar do total de páginas');
  });

  it('rejeita números não inteiros', () => {
    expect(validateBookForm({ ...book, totalPages: '12.5' }).totalPages).toBeDefined();
  });

  it('aceita resenha opcional e limita o tamanho', () => {
    expect(validateBookForm({ ...book, review: 'Obra-prima.' }).review).toBeUndefined();
    expect(validateBookForm({ ...book, review: 'a'.repeat(5001) }).review).toBe(
      'Use no máximo 5000 caracteres',
    );
  });
});

describe('validateSessionForm', () => {
  const now = new Date(2026, 4, 10, 20, 0);
  const session: SessionFormValues = {
    startPage: '10',
    endPage: '40',
    durationMinutes: '30',
    date: '2026-05-10',
    time: '19:00',
    note: '',
  };

  it('aceita uma sessão válida', () => {
    expect(hasErrors(validateSessionForm(session, 300, now))).toBe(false);
  });

  it('exige página final maior que a inicial e dentro do livro', () => {
    expect(validateSessionForm({ ...session, endPage: '5' }, 300, now).endPage).toBe(
      'A página final deve ser maior que a inicial',
    );
    expect(validateSessionForm({ ...session, endPage: '400' }, 300, now).endPage).toBe(
      'O livro possui 300 páginas',
    );
  });

  it('rejeita data inválida e horário no futuro', () => {
    expect(validateSessionForm({ ...session, date: '2026-02-30' }, 300, now).date).toBeDefined();
    expect(validateSessionForm({ ...session, time: '21:00' }, 300, now).time).toBe(
      'A sessão não pode estar no futuro',
    );
  });
});

describe('validateGoalForm', () => {
  it('exige valor positivo e intervalo válido', () => {
    const errors = validateGoalForm({
      title: 'Meta',
      type: 'PAGES_READ',
      period: 'CUSTOM',
      targetValue: '0',
      startDate: '2026-06-01',
      endDate: '2026-05-01',
    });
    expect(errors.targetValue).toBe('Informe um valor positivo');
    expect(errors.endDate).toBe('O término deve ser igual ou posterior ao início');
  });
});

describe('validateRegisterForm', () => {
  it('valida senha forte e confirmação', () => {
    const errors = validateRegisterForm({
      name: 'Ana',
      username: '',
      email: 'ana@example.com',
      password: 'somenteletras',
      confirmPassword: 'diferente',
    });
    expect(errors.password).toBe('Use letras e números na senha');
    expect(errors.confirmPassword).toBe('As senhas não conferem');
  });
});
