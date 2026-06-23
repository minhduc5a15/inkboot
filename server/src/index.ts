import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { novelRoutes } from './routes/novels';
import { chapterRoutes } from './routes/chapters';
import { characterRoutes } from './routes/characters';
import { timelineRoutes } from './routes/timeline';
import { worldRoutes } from './routes/world';
import { searchRoutes } from './routes/search';

import { plotBoardRoutes } from './routes/plotBoard';

export const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    })
  )
  .onError(({ code, error, set }) => {
    console.error(`[Elysia Error] ${code}:`, error);

    if (code === 'VALIDATION') {
      set.status = 422;
      return {
        status: 'error',
        message: 'Validation Error',
        details: error.message,
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        status: 'error',
        message: 'Not Found',
      };
    }

    set.status = 500;
    return {
      status: 'error',
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : String(error) }),
    };
  })
  .use(novelRoutes)
  .use(chapterRoutes)
  .use(characterRoutes)
  .use(timelineRoutes)
  .use(worldRoutes)
  .use(searchRoutes)
  .use(plotBoardRoutes)
  .get('/', () => 'Inkboot API is running');

if (process.env.NODE_ENV !== 'test') {
  app.listen(process.env.PORT ? parseInt(process.env.PORT) : 4000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}
