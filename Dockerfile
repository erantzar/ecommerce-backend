FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY server/package.json server/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY server/ .

RUN pnpm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
