# Silent Manager MVP

Silent Manager is a mobile-first web app for gas station owners to monitor shifts, ingest Gilbarco Passport XMLGateway exports, and ask quick business questions.

## Assumptions
- Single owner can manage multiple stores, but the UI defaults to the first store.
- Chat is rule-based (intent classification) without external AI services.
- Alerts are generated from parsed shift data with deterministic rules.
- XML parsing is best-effort and tolerant of schema variation.

## Repo structure
- `apps/api`: Express + Prisma API
- `apps/web`: React + Vite + Tailwind UI
- `apps/agent`: Node.js Windows agent
- `apps/mobile`: Expo + React Native mobile app
- `packages/shared`: Shared types

## Access model (MVP)
This MVP uses a Store Access Token instead of login/register for both web and mobile.

- Each Store has a secret `storeAccessToken` stored hashed in the DB.
- Generate a token via seed output or `POST /api/stores/:storeId/access-token`.
- **Warning:** If you do not set `ADMIN_BOOTSTRAP_SECRET`, the access-token endpoint is unprotected.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start Postgres:

```bash
docker-compose up -d
```

3. Configure API env:

```bash
cp apps/api/.env.example apps/api/.env
```

(Optional) Set an admin secret in `apps/api/.env`:

```bash
ADMIN_BOOTSTRAP_SECRET=change-me
```

4. Run Prisma migrations and seed:

```bash
cd apps/api
npx prisma migrate dev --name init
npm run seed
```

5. Start API:

```bash
npm run dev
```

6. Start web app:

```bash
cd ../web
cp .env.example .env
npm run dev
```

7. Mobile app (Expo):

```bash
cd ../mobile
npm install
npm run dev
```

Then press `i` to open iOS Simulator.

> **Localhost note:** iOS Simulator can use `http://localhost:5000`. Real devices must use your machine IP (e.g., `http://192.168.1.10:5000`).

8. Agent setup:

```bash
cd ../agent
cp config.example.json config.json
npm install
npm run build
node dist/index.js dry-run --config config.json
node dist/index.js start --config config.json
```

## Simulate ingest locally

Use the sample XML fixtures in `apps/api/src/parsers/sample` and the agent test command:

```bash
node dist/index.js test-upload --config config.json --file ../api/src/parsers/sample/shift-report-sample.xml
```

## Push notifications (future)
Push notifications are not implemented. TODO: add APNs + Expo push token registration later.
