import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { novelRoutes } from "./routes/novels";
import { chapterRoutes } from "./routes/chapters";
import { characterRoutes } from "./routes/characters";
import { timelineRoutes } from "./routes/timeline";

const app = new Elysia()
  .use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
  }))
  .use(novelRoutes)
  .use(chapterRoutes)
  .use(characterRoutes)
  .use(timelineRoutes)
  .get("/", () => "Inkboot API is running")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
