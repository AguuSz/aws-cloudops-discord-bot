# AWS CloudOps Study Bot

Bot de Discord para practicar preguntas del examen AWS Certified SysOps Administrator - Associate (SOA-C03).

Envia desafios diarios con preguntas de opcion multiple, evalua respuestas y trackea estadisticas de estudio.

## Features

- **Desafio diario automatico**: envia una pregunta por dia a la hora configurada (timezone Argentina/Cordoba)
- **Seleccion inteligente**: prioriza preguntas no respondidas y las mas falladas
- **Soporte multi-respuesta**: preguntas con 2 o 3 respuestas correctas (toggle de seleccion)
- **Estadisticas**: porcentaje de acierto, rachas, preguntas mas dificiles, barra de progreso
- **397 preguntas** parseadas del repositorio [Ditectrev/AWS-Certified-CloudOps-Engineer-Associate](https://github.com/Ditectrev/AWS-Certified-CloudOps-Engineer-Associate-SOA-C03-Practice-Tests-Exams-Questions-Answers)

## Comandos

| Comando                 | Descripcion                     |
| ----------------------- | ------------------------------- |
| `/challenge`            | Pregunta aleatoria on-demand    |
| `/challenge numero:42`  | Pregunta especifica #42         |
| `/stats`                | Estadisticas de estudio         |
| `/setup channel #canal` | Canal para desafios diarios     |
| `/setup time 09:00`     | Hora del desafio (tz Argentina) |
| `/setup enable`         | Activar desafio diario          |
| `/setup disable`        | Desactivar desafio diario       |
| `/setup status`         | Ver configuracion actual        |

## Stack

- TypeScript + discord.js v14
- SQLite (better-sqlite3)
- node-cron (scheduling)
- dayjs (timezone handling)

## Setup

### Requisitos previos

1. Crear aplicacion en [Discord Developer Portal](https://discord.com/developers/applications)
2. En **Bot**: obtener el token
3. En **OAuth2 > URL Generator**: scopes `bot` + `applications.commands`, permisos `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Invitar el bot al server con la URL generada

### Configuracion

```bash
cp bot/.env.example bot/.env
```

Completar en `.env`:

- `DISCORD_TOKEN`: token del bot
- `CLIENT_ID`: Application ID (General Information)
- `GUILD_ID`: click derecho en server > Copiar ID (requiere Modo Desarrollador)

### Docker (recomendado)

```bash
cd bot
docker compose up -d --build
```

El bot auto-seed la DB al primer arranque. Registrar comandos:

```bash
npx tsx src/commands/deploy.ts
```

### Local

```bash
cd bot
npm install
npm run seed
npm run deploy-commands
npm run dev
```

## Estructura

```
bot/
├── src/
│   ├── index.ts                  # Entry point + auto-seed
│   ├── config.ts                 # Variables de entorno
│   ├── parser/
│   │   └── questionParser.ts     # Parsea README.md -> preguntas
│   ├── db/
│   │   ├── connection.ts         # SQLite singleton
│   │   ├── schema.ts             # Tablas: questions, user_answers, bot_config
│   │   └── seed.ts               # Script de seed independiente
│   ├── commands/
│   │   ├── deploy.ts             # Registro slash commands
│   │   ├── challenge.ts          # /challenge
│   │   ├── setup.ts              # /setup
│   │   └── stats.ts              # /stats
│   ├── handlers/
│   │   ├── interactionHandler.ts # Router commands + buttons
│   │   └── buttonHandler.ts      # Toggle seleccion + evaluacion
│   ├── services/
│   │   ├── questionService.ts    # Seleccion inteligente
│   │   ├── schedulerService.ts   # Cron desafio diario
│   │   └── statsService.ts       # Queries estadisticas
│   ├── ui/
│   │   ├── embedBuilder.ts       # Embeds pregunta/resultado
│   │   └── componentBuilder.ts   # Botones emoji
│   └── utils/
│       ├── emojiMap.ts           # Mapeo opciones -> emojis
│       └── timeUtils.ts          # dayjs + timezone
├── Dockerfile
├── docker-compose.yml
└── data/                         # SQLite DB (gitignored)
questions-repo/                   # Repo de preguntas (clonado)
```
