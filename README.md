# Samga.nis - Система учета успеваемости

Полнофункциональная система учета успеваемости с интегрированным AI-ассистентом.

## Функциональность

- Просмотр оценок по предметам
- Анализ успеваемости
- AI-ассистент с доступом к оценкам
- Мобильная и веб-версии

## Запуск проекта

### Установка зависимостей

```bash
npm install
```

### Запуск проекта

```bash
# Запуск в режиме разработки
npm run dev

# Запуск в production режиме
npm run start

# Сборка проекта
npm run build

# Запуск линтера
npm run lint
```

Фронтенд будет доступен по адресу `http://localhost:3000`

## AI-ассистент

AI-ассистент "Plexy" доступен на странице `/ai` и предоставляет информацию об оценках через модель Llama 3.1 Nemotron, используя API OpenRouter.

Основные характеристики:
- Прямое подключение к OpenRouter API
- Использование модели `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- Встроенный системный промпт с информацией об оценках
- Поддержка загрузки изображений

# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
