## Cooking inspiration

This is a single page application built to support cooking enthusiasts in various countries with 4 recipe ideas for preparing one main meal during the weekend.

It is using a Bring! integration to allow users to easily add ingredients to their shopping list.

## Tech stack in use

### Backend

- Use NuGet for package management, dotnet as build tool
  - ASP.NET Web API is used as backend framework, .NET version 10
  - layers in the backend are organized as follows:
    - Controllers: Handle incoming HTTP requests and route them to the appropriate services
    - Services: Contain business logic and, for example, interact with external API wrappers or repositories
    - Domain: Contains core business models shared across application flow (for example `RecipeSummary` and `RecipeCard`)
    - Infrastructure: Contains code for accessing data through repositories, or external APIs through wrappers
    - Tests: Unit tests for the API controllers, and services

### Frontend

- use npm for package management, and Vite as the build tool
- use Node version 20
- React is used for interactivity, version 18
- Axios is used for API calls, error handling is implemented to show user-friendly messages in case of failures
- TypeScript is used for all front-end code
- layers in the frontend are organized as follows:
  - Components: Reusable React components (e.g. RecipeCard, IngredientList)
  - Styles: CSS stylesheets for styling the application
  - Pages: React pages and routes (e.g. HomePage, RecipePage)
  - ViewModels: custom hooks and utility functions to manage state and data transformations for the components
  - Services: API client code to interact with the backend API (e.g. TranslationService)
  - Tests: Unit tests for the custom hooks and utility functions

### Testing frameworks and libraries

- XUnit, Moq, and FluentAssertions for backend code
- Vitest for frontend code
- Playwright for e2e tests

### Coding guidelines

- maximum cyclomatic complexity of 7 for any method or function

## Project structure

- server/ : ASP.NET Web API backend code
  - controllers/
  - domain/
  - services/
  - infrastructure/
  - tests/
- client/ : React frontend code
  - src/components/
  - src/pages/
  - src/styles/
  - src/viewModels/
  - src/services/
  - src/tests/
- scripts/

## Resources

Bring! integration documentation:
https://sites.google.com/getbring.com/bring-import-dev-guide/web-to-app-integration

Ubiquitous language Wiki page:
https://github.com/m-horvacki-levi9-com/cooking-inspiration/wiki/Ubiquitous-language

Architecture Decisions Record:
https://github.com/m-horvacki-levi9-com/cooking-inspiration/wiki/Architecture-Decisions-Record

Recipes providers:

### Cookpad

- url for searching recipes: https://cookpad.com/eng/search/{searchTerm}
- url for getting recipe details: https://cookpad.com/eng/recipes/{recipeId}

MCP servers
- Playwright: Used for generating Playwright tests or interacting with site
- GitHub: Used to interact with repository, documentation, and backlog
