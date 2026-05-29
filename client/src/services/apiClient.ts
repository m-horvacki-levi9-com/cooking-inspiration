import axios from 'axios';

import { apiBaseUrl } from './apiConfig';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});
