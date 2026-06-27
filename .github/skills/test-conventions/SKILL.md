---
name: test-conventions
description: "Enforce repository test conventions. Use when creating, updating, reviewing, or refactoring tests in frontend unit tests, backend xUnit tests, Playwright e2e tests, or PoC tests. Ensures test names follow GivenWhenThen format and each test body includes Arrange/Act/Assert comments in order."
user-invocable: true
---

# Test Conventions Guardrail

Use this skill whenever you create or modify tests in this repository.

## Goal

Ensure every test follows both conventions:

1. Test name format: `Given{something}_When{something}_Then{something}`
2. Explicit AAA comments inside each test body:
   - `// Arrange`
   - `// Act`
   - `// Assert`

## Applies To

- Frontend unit tests (`client/src/tests/**/*.test.ts`, `client/src/tests/**/*.test.tsx`)
- Frontend e2e tests (`client/e2e/**/*.spec.ts`)
- Backend tests (`server/tests/**/*.cs`)
- PoC tests (`PoC/tests/**/*.js`)

## Naming Rules

- Use PascalCase tokens for each segment.
- Keep names behavior-focused and deterministic.
- Do not use free-form sentence names.

### Valid Examples

- `GivenKeyword_WhenSearchingRecipes_ThenReturnsCompactRecipes`
- `GivenRecipeExists_WhenDetailsEndpointIsCalled_ThenReturnsDetailedPayload`
- `GivenOpenRecipeModal_WhenCloseButtonIsClicked_ThenClosesModal`

### Invalid Examples

- `renders recipe list`
- `Search returns recipes`
- `should work`

## AAA Comment Rules

- Every test body must include all three comment markers.
- Order is always Arrange -> Act -> Assert.
- Keep setup in Arrange, execution in Act, checks in Assert.
- If a test has multiple assertions, keep them under one Assert block.

## Language Patterns

### TypeScript / JavaScript

```ts
it("GivenCondition_WhenAction_ThenResult", async () => {
  // Arrange
  const input = "value";

  // Act
  const result = await execute(input);

  // Assert
  expect(result).toBe("expected");
});
```

### C# (xUnit)

```csharp
[Fact]
public async Task GivenCondition_WhenAction_ThenResult()
{
    // Arrange
    var sut = CreateSut();

    // Act
    var result = await sut.ExecuteAsync();

    // Assert
    result.Should().BeTrue();
}
```

## Review Checklist

Before finishing any test-related change, verify:

1. Every new or edited test name matches `Given..._When..._Then...`.
2. Every new or edited test body contains `// Arrange`, `// Act`, and `// Assert`.
3. Comment ordering is correct and sections contain the right code type.
4. Test suite still passes.

## Auto-Fix Guidance

If you find a violation:

1. Rename the test to the required pattern.
2. Insert missing AAA markers in the correct order.
3. Move code under the proper AAA section if needed.
4. Re-run relevant tests.
