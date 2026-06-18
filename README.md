# Cooking Inspiration

Cooking Inspiration is a weekend meal inspiration SPA. The app currently lets users search Cookpad by keyword, then shows up to **four randomized recipe ideas** with images, descriptions, ingredients, and a **Bring! import** action for the selected recipe.

## Current status

| Area | Status |
| --- | --- |
| Frontend | React 18 + TypeScript SPA is implemented with a search form, loading/error/empty states, responsive recipe cards, and Bring! widget integration. |
| Backend | ASP.NET Core Web API is implemented with `GET /health` and `GET /api/recipes/search?keyword=...`. |
| Recipe provider | Cookpad search scraping is implemented, including recipe detail enrichment when search cards are incomplete. |
| Result selection | The backend returns up to 4 recipes per search and randomizes which matches are shown. |
| Testing | Backend unit/integration tests are present. Frontend unit tests and Playwright smoke coverage are present. |
| Scope today | The production flow in this repository is recipe discovery; broader localization and other future ideas are not wired into the app yet. |

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, MUI, Axios, Vitest, Playwright |
| Backend | ASP.NET Core Web API, .NET 10, HtmlAgilityPack, xUnit, Moq, FluentAssertions |

## Requirements

- PowerShell 7+
- Node.js 20.x (`.nvmrc` included)
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

- `client/` contains the SPA, API client, Bring! integration, unit tests, and Playwright smoke test.
- `server/` contains the Web API, Cookpad integration, application services, and backend tests.
- `PoC/` contains the legacy proof-of-concept and is separate from the current app.

## Run locally

### Backend

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

Available endpoints:

- `GET /health`
- `GET /api/recipes/search?keyword=pasta`

Example health response:

```json
{
  "status": "healthy"
}
```

### Frontend

From the `client\` directory:

```powershell
npm install
npm run dev
```

Additional frontend commands:

```powershell
npm run build
npm test
npm run test:e2e
```

The Vite app calls the backend through `/api` by default.

To override the API base URL for local development, copy `client\.env.example` to `client\.env` and set:

```text
VITE_API_BASE_URL=http://localhost:5242/api
```

## Testing

- Backend: `dotnet test server\server.slnx`
- Frontend unit tests: `Set-Location client; npm test`
- Frontend e2e smoke test: `Set-Location client; npm run test:e2e`

Before running Playwright on a new machine:

```powershell
Set-Location client
npx playwright install chromium
```
