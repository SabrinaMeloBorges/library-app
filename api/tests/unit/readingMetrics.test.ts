import { describe, expect, it } from 'vitest';
import {
  countFinishedBooksInRange,
  countReadingDays,
  countUniquePagesRead,
  sumMinutesRead,
} from '../../src/domain/readingMetrics';

describe('readingMetrics', () => {
  it('conta páginas sobrepostas apenas uma vez por livro', () => {
    const pages = countUniquePagesRead([
      { userBookId: 'a', startPage: 0, endPage: 50 },
      { userBookId: 'a', startPage: 40, endPage: 80 },
      { userBookId: 'a', startPage: 100, endPage: 110 },
      { userBookId: 'b', startPage: 0, endPage: 50 },
    ]);
    expect(pages).toBe(80 + 10 + 50);
  });

  it('soma os minutos de leitura', () => {
    expect(sumMinutesRead([{ durationMinutes: 30 }, { durationMinutes: 15 }])).toBe(45);
  });

  it('agrupa dias de leitura no fuso configurado', () => {
    const days = countReadingDays(
      [
        { readAt: new Date('2026-03-10T23:30:00-03:00') },
        { readAt: new Date('2026-03-11T01:00:00Z') },
        { readAt: new Date('2026-03-11T10:00:00-03:00') },
      ],
      'America/Sao_Paulo',
    );
    expect(days).toBe(2);
  });

  it('conta apenas livros concluídos dentro do intervalo', () => {
    const count = countFinishedBooksInRange(
      [
        { status: 'FINISHED', finishedAt: new Date('2026-02-01T12:00:00Z') },
        { status: 'FINISHED', finishedAt: new Date('2025-12-31T12:00:00Z') },
        { status: 'READING', finishedAt: null },
      ],
      { start: '2026-01-01', end: '2026-12-31' },
      'America/Sao_Paulo',
    );
    expect(count).toBe(1);
  });
});
