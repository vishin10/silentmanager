# Silent Manager MVP

Silent Manager is a mobile-first web app for gas station owners to monitor shifts, ingest Gilbarco Passport XMLGateway exports, and ask quick business questions.

## Assumptions
- Single owner can manage multiple stores, but the UI defaults to the first store.
- Chat is rule-based (intent classification) without external AI services.
- Alerts are generated from parsed shift data with deterministic rules.
- XML parsing is best-effort and tolerant of schema variation.

## Repo structure
- `backend/api`: Express + Prisma API
- `frontend/web`: React + Vite + Tailwind UI
- `backend/agent`: Node.js Windows agent
- `packages/shared`: Shared types

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
cp backend/api/.env.example backend/api/.env
```

4. Run Prisma migrations and seed:

```bash
cd backend/api
npx prisma migrate dev --name init
npm run seed
```

5. Start API:

```bash
npm run dev
```

6. Start web app:

```bash
cd ../../frontend/web
cp .env.example .env
npm run dev
```

7. Agent setup:

```bash
cd ../../backend/agent
cp config.example.json config.json
npm install
npm run build
node dist/index.js dry-run --config config.json
node dist/index.js start --config config.json
```

## Simulate ingest locally

Use the sample XML fixtures in `backend/api/src/parsers/sample` and the agent test command:

```bash
node dist/index.js test-upload --config config.json --file ../api/src/parsers/sample/shift-report-sample.xml
```
