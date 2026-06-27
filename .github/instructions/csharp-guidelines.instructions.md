---
applyTo: "**/*.cs"
---

# C# Coding Guidelines

- Use Linq where possible.
- Prefer async I/O operations.
- Always follow good security practices: do not hardcode sensitive information, and use environment variables, secure vaults, or Managed Identity when accessing Azure resources.
- Follow RESTful API design principles.

## Error handling and logging

- Do not couple a service to the implementation details of a lower layer (such as a repository or external client) by catching exception types those internals throw (for example `HttpRequestException`). At a layer boundary, catch generically (`catch (Exception)`) and translate the failure into the layer's own result type.
- Inject `ILogger<T>` and log a generic warning or error before returning a failure result from a caught exception; do not discard exceptions silently. Keep the message implementation-agnostic (for example "Failed to retrieve recipes") rather than naming the underlying provider or transport.

## Constants and configuration

- Do not duplicate literal values such as base URLs across files. Declare them once as a `const` (or bind them from configuration) and reference that single definition everywhere.
