const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonContent = (schema: object) => ({ 'application/json': { schema } });
const dataResponse = (description: string, schema: object) => ({
  description,
  content: jsonContent({ type: 'object', properties: { data: schema } }),
});
const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ref('Error')),
});
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const secured = [{ bearerAuth: [] }];
const commonErrors = {
  400: errorResponse('Dados inválidos'),
  401: errorResponse('Não autenticado'),
};

const readingStatus = {
  type: 'string',
  enum: ['WANT_TO_READ', 'READING', 'FINISHED', 'PAUSED', 'ABANDONED'],
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Library API',
    version: '1.0.0',
    description:
      'API REST do Library: biblioteca pessoal, sessões de leitura, metas e estatísticas.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
          user: ref('User'),
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', maxLength: 80 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
      },
      ReadingStatus: readingStatus,
      LibraryItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: readingStatus,
          totalPages: { type: 'integer' },
          currentPage: { type: 'integer' },
          progress: { type: 'integer', minimum: 0, maximum: 100 },
          rating: { type: 'integer', nullable: true, minimum: 1, maximum: 5 },
          isFavorite: { type: 'boolean' },
          review: { type: 'string', nullable: true },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          finishedAt: { type: 'string', format: 'date-time', nullable: true },
          book: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              authors: { type: 'string' },
              publisher: { type: 'string', nullable: true },
              coverUrl: { type: 'string', nullable: true },
              isbn: { type: 'string', nullable: true },
              externalSource: { type: 'string', nullable: true },
              externalId: { type: 'string', nullable: true },
            },
          },
        },
      },
      CreateLibraryItemInput: {
        type: 'object',
        required: ['title', 'authors', 'totalPages'],
        properties: {
          title: { type: 'string', maxLength: 255 },
          authors: { type: 'string', maxLength: 255 },
          publisher: { type: 'string', nullable: true },
          coverUrl: { type: 'string', format: 'uri', nullable: true },
          isbn: { type: 'string', nullable: true },
          externalSource: { type: 'string', enum: ['openlibrary'], nullable: true },
          externalId: { type: 'string', nullable: true },
          totalPages: { type: 'integer', minimum: 1 },
          currentPage: { type: 'integer', minimum: 0, default: 0 },
          status: readingStatus,
          isFavorite: { type: 'boolean', default: false },
          rating: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
          review: { type: 'string', nullable: true },
        },
      },
      UpdateLibraryItemInput: {
        type: 'object',
        description:
          'Todos os campos de CreateLibraryItemInput, exceto origem externa, de forma opcional.',
        properties: {
          title: { type: 'string' },
          authors: { type: 'string' },
          totalPages: { type: 'integer', minimum: 1 },
          currentPage: { type: 'integer', minimum: 0 },
          status: readingStatus,
          isFavorite: { type: 'boolean' },
          rating: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
          review: { type: 'string', nullable: true },
        },
      },
      ReadingSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userBookId: { type: 'string', format: 'uuid' },
          bookTitle: { type: 'string' },
          startPage: { type: 'integer' },
          endPage: { type: 'integer' },
          pagesRead: { type: 'integer' },
          durationMinutes: { type: 'integer' },
          readAt: { type: 'string', format: 'date-time' },
          note: { type: 'string', nullable: true },
        },
      },
      ReadingSessionInput: {
        type: 'object',
        required: ['userBookId', 'startPage', 'endPage', 'durationMinutes', 'readAt'],
        properties: {
          userBookId: { type: 'string', format: 'uuid' },
          startPage: { type: 'integer', minimum: 0 },
          endPage: { type: 'integer', minimum: 1 },
          durationMinutes: { type: 'integer', minimum: 1, maximum: 1440 },
          readAt: { type: 'string', format: 'date-time' },
          note: { type: 'string', nullable: true, maxLength: 1000 },
        },
      },
      Goal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          type: {
            type: 'string',
            enum: ['BOOKS_FINISHED', 'PAGES_READ', 'MINUTES_READ', 'READING_DAYS'],
          },
          period: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] },
          targetValue: { type: 'integer' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          currentValue: { type: 'integer' },
          percentage: { type: 'integer' },
          state: { type: 'string', enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'EXPIRED'] },
        },
      },
      GoalInput: {
        type: 'object',
        required: ['title', 'type', 'period', 'targetValue', 'startDate', 'endDate'],
        properties: {
          title: { type: 'string', maxLength: 120 },
          type: {
            type: 'string',
            enum: ['BOOKS_FINISHED', 'PAGES_READ', 'MINUTES_READ', 'READING_DAYS'],
          },
          period: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] },
          targetValue: { type: 'integer', minimum: 1 },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
      StatisticsOverview: {
        type: 'object',
        properties: {
          year: { type: 'integer' },
          thisYear: ref('ReadingSummary'),
          allTime: ref('ReadingSummary'),
          totalBooks: { type: 'integer' },
          readingNowCount: { type: 'integer' },
          statusDistribution: { type: 'object', additionalProperties: { type: 'integer' } },
          annualGoal: { allOf: [ref('Goal')], nullable: true },
          goals: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              active: { type: 'integer' },
              completed: { type: 'integer' },
            },
          },
          continueReading: { type: 'array', items: ref('LibraryItem') },
          recentActivity: { type: 'array', items: { type: 'object' } },
        },
      },
      ReadingSummary: {
        type: 'object',
        properties: {
          booksFinished: { type: 'integer' },
          pagesRead: { type: 'integer' },
          minutesRead: { type: 'integer' },
          readingDays: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Infra'],
        summary: 'Verifica se a API está no ar',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Autenticação'],
        summary: 'Cria uma conta e retorna o token',
        requestBody: { required: true, content: jsonContent(ref('RegisterInput')) },
        responses: {
          201: { description: 'Conta criada', content: jsonContent(ref('AuthResult')) },
          400: errorResponse('Dados inválidos'),
          409: errorResponse('E-mail já cadastrado'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Autentica e retorna o token',
        requestBody: { required: true, content: jsonContent(ref('LoginInput')) },
        responses: {
          200: { description: 'Autenticado', content: jsonContent(ref('AuthResult')) },
          401: errorResponse('Credenciais inválidas'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticação'],
        summary: 'Retorna o usuário autenticado',
        security: secured,
        responses: {
          200: {
            description: 'Usuário',
            content: jsonContent({ type: 'object', properties: { user: ref('User') } }),
          },
          401: errorResponse('Não autenticado'),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticação'],
        summary: 'Revoga a sessão do token atual',
        security: secured,
        responses: {
          204: { description: 'Sessão encerrada' },
          401: errorResponse('Não autenticado'),
        },
      },
    },
    '/library': {
      get: {
        tags: ['Biblioteca'],
        summary: 'Lista os livros do usuário',
        security: secured,
        parameters: [
          { name: 'status', in: 'query', schema: readingStatus },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Título ou autor' },
          { name: 'favorites', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['title', 'updatedAt', 'createdAt', 'progress', 'rating'],
            },
          },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: dataResponse('Lista de livros', { type: 'array', items: ref('LibraryItem') }),
          ...commonErrors,
        },
      },
      post: {
        tags: ['Biblioteca'],
        summary: 'Adiciona um livro à biblioteca',
        security: secured,
        requestBody: { required: true, content: jsonContent(ref('CreateLibraryItemInput')) },
        responses: {
          201: dataResponse('Livro adicionado', ref('LibraryItem')),
          ...commonErrors,
          409: errorResponse('Livro já está na biblioteca'),
        },
      },
    },
    '/library/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Biblioteca'],
        summary: 'Detalhes de um livro da biblioteca',
        security: secured,
        responses: {
          200: dataResponse('Livro', ref('LibraryItem')),
          ...commonErrors,
          404: errorResponse('Não encontrado'),
        },
      },
      patch: {
        tags: ['Biblioteca'],
        summary: 'Atualiza dados, status, progresso ou avaliação',
        security: secured,
        requestBody: { required: true, content: jsonContent(ref('UpdateLibraryItemInput')) },
        responses: {
          200: dataResponse('Livro atualizado', ref('LibraryItem')),
          ...commonErrors,
          404: errorResponse('Não encontrado'),
        },
      },
      delete: {
        tags: ['Biblioteca'],
        summary: 'Remove o livro e suas sessões',
        security: secured,
        responses: {
          204: { description: 'Removido' },
          ...commonErrors,
          404: errorResponse('Não encontrado'),
        },
      },
    },
    '/reading-sessions': {
      get: {
        tags: ['Sessões de leitura'],
        summary: 'Histórico de sessões',
        security: secured,
        parameters: [
          { name: 'userBookId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200 } },
        ],
        responses: {
          200: dataResponse('Sessões', { type: 'array', items: ref('ReadingSession') }),
          ...commonErrors,
        },
      },
      post: {
        tags: ['Sessões de leitura'],
        summary: 'Registra uma sessão e atualiza o progresso do livro',
        security: secured,
        requestBody: { required: true, content: jsonContent(ref('ReadingSessionInput')) },
        responses: {
          201: dataResponse('Sessão registrada', ref('ReadingSession')),
          ...commonErrors,
          404: errorResponse('Livro não encontrado'),
        },
      },
    },
    '/reading-sessions/{id}': {
      parameters: [idParameter],
      patch: {
        tags: ['Sessões de leitura'],
        summary: 'Edita uma sessão e recalcula o progresso',
        security: secured,
        requestBody: { required: true, content: jsonContent(ref('ReadingSessionInput')) },
        responses: {
          200: dataResponse('Sessão atualizada', ref('ReadingSession')),
          ...commonErrors,
          404: errorResponse('Não encontrada'),
        },
      },
      delete: {
        tags: ['Sessões de leitura'],
        summary: 'Remove uma sessão e recalcula o progresso',
        security: secured,
        responses: {
          204: { description: 'Removida' },
          ...commonErrors,
          404: errorResponse('Não encontrada'),
        },
      },
    },
    '/goals': {
      get: {
        tags: ['Metas'],
        summary: 'Lista metas com progresso calculado',
        security: secured,
        responses: {
          200: dataResponse('Metas', { type: 'array', items: ref('Goal') }),
          ...commonErrors,
        },
      },
      post: {
        tags: ['Metas'],
        summary: 'Cria uma meta',
        security: secured,
        requestBody: { required: true, content: jsonContent(ref('GoalInput')) },
        responses: { 201: dataResponse('Meta criada', ref('Goal')), ...commonErrors },
      },
    },
    '/goals/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Metas'],
        summary: 'Detalhes de uma meta',
        security: secured,
        responses: {
          200: dataResponse('Meta', ref('Goal')),
          ...commonErrors,
          404: errorResponse('Não encontrada'),
        },
      },
      patch: {
        tags: ['Metas'],
        summary: 'Atualiza uma meta',
        security: secured,
        requestBody: { required: true, content: jsonContent(ref('GoalInput')) },
        responses: {
          200: dataResponse('Meta atualizada', ref('Goal')),
          ...commonErrors,
          404: errorResponse('Não encontrada'),
        },
      },
      delete: {
        tags: ['Metas'],
        summary: 'Remove uma meta',
        security: secured,
        responses: {
          204: { description: 'Removida' },
          ...commonErrors,
          404: errorResponse('Não encontrada'),
        },
      },
    },
    '/statistics/overview': {
      get: {
        tags: ['Estatísticas'],
        summary: 'Indicadores do dashboard e da tela de estatísticas',
        security: secured,
        responses: { 200: dataResponse('Visão geral', ref('StatisticsOverview')), ...commonErrors },
      },
    },
  },
};
