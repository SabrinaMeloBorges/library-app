import { describe, expect, it } from 'vitest';
import {
  progressPercentage,
  resolveProgress,
  type ProgressState,
} from '../../src/domain/readingProgress';

const now = new Date('2026-05-01T12:00:00Z');
const base: ProgressState = {
  status: 'WANT_TO_READ',
  currentPage: 0,
  totalPages: 200,
  startedAt: null,
  finishedAt: null,
};

describe('resolveProgress', () => {
  it('inicia a leitura quando a página avança', () => {
    const result = resolveProgress(base, { currentPage: 20 }, now);
    expect(result.status).toBe('READING');
    expect(result.startedAt).toEqual(now);
  });

  it('conclui o livro ao atingir a última página', () => {
    const result = resolveProgress({ ...base, status: 'READING' }, { currentPage: 200 }, now);
    expect(result.status).toBe('FINISHED');
    expect(result.finishedAt).toEqual(now);
  });

  it('preenche a última página ao marcar como concluído', () => {
    const result = resolveProgress(base, { status: 'FINISHED' }, now);
    expect(result.currentPage).toBe(200);
  });

  it('volta para lendo quando o progresso de um livro concluído diminui', () => {
    const finished: ProgressState = {
      ...base,
      status: 'FINISHED',
      currentPage: 200,
      startedAt: now,
      finishedAt: now,
    };
    const result = resolveProgress(finished, { currentPage: 150 }, now);
    expect(result.status).toBe('READING');
    expect(result.finishedAt).toBeNull();
  });

  it('respeita status informado explicitamente', () => {
    const result = resolveProgress(
      { ...base, status: 'READING', currentPage: 50 },
      { status: 'PAUSED' },
      now,
    );
    expect(result.status).toBe('PAUSED');
    expect(result.currentPage).toBe(50);
  });

  it('considera leitura iniciada quando "quero ler" vem com página atual', () => {
    const result = resolveProgress(base, { status: 'WANT_TO_READ', currentPage: 20 }, now);
    expect(result.status).toBe('READING');
    expect(result.currentPage).toBe(20);
  });

  it('volta o livro para a fila zerando a página atual', () => {
    const reading: ProgressState = { ...base, status: 'READING', currentPage: 90, startedAt: now };
    const result = resolveProgress(reading, { status: 'WANT_TO_READ' }, now);
    expect(result).toMatchObject({ status: 'WANT_TO_READ', currentPage: 0, startedAt: null });
  });
});

describe('progressPercentage', () => {
  it('calcula e limita o percentual', () => {
    expect(progressPercentage(50, 200)).toBe(25);
    expect(progressPercentage(10, 0)).toBe(0);
  });
});
