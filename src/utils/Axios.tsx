import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";

// Get base URL from environment variables
const baseUrl = import.meta.env.VITE_BASE_API_URL || 'http://localhost:4000/api';

// Create Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available (support multiple storage keys)
    const token = localStorage.getItem('accessToken')
      || localStorage.getItem('token')
      || localStorage.getItem('access_token')
      || sessionStorage.getItem('accessToken')
      || sessionStorage.getItem('token')
      || sessionStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    // if (import.meta.env.DEV) {
    //   console.log('🚀 Request:', {
    //     method: config.method?.toUpperCase(),
    //     url: config.url,
    //     data: config.data,
    //     headers: config.headers,
    //   });
    // }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    // if (import.meta.env.DEV) {
    //   console.log('✅ Response:', {
    //     status: response.status,
    //     url: response.config.url,
    //     data: response.data,
    //   });
    // }

    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          // Skip redirect for payment callback endpoints (they don't require auth)
          {
          const url = error.config?.url || '';
          const pathname = window.location?.pathname || '';
          const isPaymentCallbackApi =
            url.includes('/payments/payos/confirm') ||
            url.includes('/payments/webhook') ||
            url.includes('/payments/status') ||
            url.includes('/payments');
          const isOnPaymentCallbackPage = pathname.startsWith('/payment/callback');

          if (!isPaymentCallbackApi && !isOnPaymentCallbackPage) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            const current = `${pathname}${window.location?.search || ''}`;
            const redirect = encodeURIComponent(current || '/');
            window.location.href = `/login?redirect=${redirect}`;
          }
          }
          break;

        case 403:
          // Forbidden
          console.error('🚫 Access forbidden');
          break;

        case 404:
          // Not found
          console.error('🔍 Resource not found');
          break;

        case 422:
          // Validation error
          console.error('⚠️ Validation error:', data);
          break;

        case 500:
          // Server error
          console.error('🔥 Server error');
          break;

        default:
          console.error(`❌ HTTP Error ${status}:`, data);
      }
    } else if (error.request) {
      // Network error
      console.error('🌐 Network Error:', error.message);
    } else {
      // Other error
      console.error('❌ Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.get(url, config);
  },

  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.post(url, data, config);
  },

  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.put(url, data, config);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.patch(url, data, config);
  },

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.delete(url, config);
  },

  // Upload file
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default axiosInstance;