import { resolveApiBaseUrl } from "../services/apiConfig";

describe("resolveApiBaseUrl", () => {
  it("GivenNoEnvironmentOverride_WhenResolvingApiBaseUrl_ThenReturnsLocalProxyPath", () => {
    // Arrange

    // Act
    expect(resolveApiBaseUrl()).toBe("/api");

    // Assert
  });

  it("GivenEnvironmentOverride_WhenResolvingApiBaseUrl_ThenReturnsProvidedOverride", () => {
    // Arrange
    const apiBaseUrl = "https://localhost:7001/api";

    // Act
    const resolvedBaseUrl = resolveApiBaseUrl(apiBaseUrl);

    // Assert
    expect(resolvedBaseUrl).toBe("https://localhost:7001/api");
  });
});
