# pc-man

Небольшой браузерный idle-sim про героя, который прокачивает квалификации, собирает ПК, берёт заказы, строит карьеру, покупает имущество и развивает социальную жизнь.

Стек:
- `React 19`
- `TypeScript`
- `Vite`
- `Zustand`

## Локальный запуск

Установка зависимостей:

```bash
npm ci
```

Запуск dev-сервера:

```bash
npm run dev
```

Приложение будет доступно на:

```text
http://localhost:4173
```

Production build:

```bash
npm run build
```

## Запуск в Docker Compose

В репозитории уже есть:
- `Dockerfile`
- `docker-compose.yml`
- `docker/nginx/default.conf`

Запуск:

```bash
docker compose up -d --build
```

По умолчанию приложение будет доступно на:

```text
http://localhost:4173
```

Если нужен другой внешний порт:

```bash
APP_PORT=8080 docker compose up -d --build
```

Тогда приложение будет открываться на:

```text
http://localhost:8080
```

Остановка:

```bash
docker compose down
```

## Как устроен Docker-образ

- на этапе сборки используется `node:22-alpine`
- выполняется `npm ci`
- затем запускается `npm run build`
- готовый `dist` отдаётся через `nginx:alpine`
- `nginx` настроен с fallback на `index.html`, поэтому роуты `react-router` работают корректно

## Полезные команды

```bash
npm run dev
npm run build
docker compose config
docker compose up -d --build
docker compose down
```
