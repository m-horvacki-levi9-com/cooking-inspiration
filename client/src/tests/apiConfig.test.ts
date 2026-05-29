import { resolveApiBaseUrl } from '../services/apiConfig';

describe('resolveApiBaseUrl', () => {
  it('defaults to the local proxy path when no environment override is provided', () => {
    expect(resolveApiBaseUrl()).toBe('/api');
  });

  it('uses the provided environment override when it is not empty', () => {
    expect(resolveApiBaseUrl('https://localhost:7001/api')).toBe('https://localhost:7001/api');
  });
});
