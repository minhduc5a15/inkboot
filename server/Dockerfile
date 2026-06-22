FROM oven/bun:latest AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

RUN chmod +x start.sh
CMD ["./start.sh"]
