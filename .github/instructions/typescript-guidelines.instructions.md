---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript Coding Guidelines

- Use semicolons.
- Avoid using 'any' as a type.
- Use single quotes for string literals, including in test files, and reserve double quotes for strings that contain a single quote.
- Use the nullish coalescing operator `??` (not `||`) to provide default values, so valid falsy values such as `''` or `0` are not unexpectedly replaced.
