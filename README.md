# Cooking Inspiration

Cooking Inspiration is a weekend meal inspiration app with planned Bring! shopping-list support and localization. This repository now includes the initial frontend and backend scaffold requested in ticket #2.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Axios, Vitest, Playwright |
| Backend | ASP.NET Web API, .NET 10, xUnit, Moq, FluentAssertions |

## Requirements

- PowerShell 7+
- Node.js 20.18.0 (`.nvmrc` included)
- npm 10+
- .NET SDK 10.0.102 (`global.json` included)

## Project structure

```text
client/
  e2e/
  src/
    components/
    pages/
    services/
    styles/
    tests/
    viewModels/
server/
  controllers/
  infrastructure/
  services/
  tests/
scripts/
PoC/
```

- `client/` contains the React SPA scaffold and frontend test setup.
- `server/` contains the ASP.NET Web API scaffold, `/health` endpoint, and backend tests.
- `scripts/` is reserved for future helper scripts.
- `PoC/` is the legacy proof-of-concept and is not part of the new app shell.

## Backend workflow

From the repository root:

```powershell
dotnet restore server\server.slnx
dotnet build server\server.slnx --no-restore
dotnet test server\server.slnx --no-build
dotnet run --project server\server.csproj --launch-profile server
```

The backend runs on:

- `http://localhost:5242`
- `https://localhost:7242`

Health check:

```text
GET http://localhost:5242/health
```

Expected response:

```json
{
  "status": "healthy"
}
```

## Frontend workflow

From the repository root:

```powershell
Set-Location client
npm install
npm run dev
```

Additional frontend commands:

```powershell
npm run build
npm test
npm run test:e2e
```

The Vite dev server proxies `/api` and `/health` to the backend. By default it targets `http://localhost:5242`.

To override the backend URL for local development, copy `client\.env.example` to `client\.env` and update `VITE_BACKEND_URL`.

## Tests

- Backend unit/integration tests: `dotnet test server\server.slnx`
- Frontend unit tests: `Set-Location client; npm test`
- Frontend smoke e2e: `Set-Location client; npm run test:e2e`

Before running the Playwright smoke test on a new machine, install the browser once:

```powershell
Set-Location client
npx playwright install chromium
```

## What is included in this scaffold

- .NET 10 backend with controller, services, infrastructure, and tests layers
- `GET /health` endpoint proving the API starts correctly
- React 18 + TypeScript frontend with components, pages, styles, services, tests, and view model folders
- Axios configuration for future API calls
- Vitest and Playwright baseline tests
- Shared local development defaults for running frontend and backend together
