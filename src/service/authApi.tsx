import type { LoginFormData, LoginResponse } from "../types/Account";
import { api } from "../utils/Axios";

// Auth API methods
export const authApi = {
  login: (credentials: LoginFormData) => {
    return api.post<LoginResponse>('/auth/login', credentials);
  },
  getUserById: (id: string) => api.get(`/api/users/${id}`),

  // API cập nhật (giữ nguyên hoặc đổi endpoint tùy backend)
  updateProfile: (id: string, data: { fullName: string; phoneNumber: string }) =>
    api.patch(`/api/users/${id}`, data),

  getCurrentUserId: (): string | null => {
    // Lấy chuỗi JSON từ localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    try {
      const user = JSON.parse(userJson);
      return user.id || user.userId || null; // Tùy vào tên field backend trả về
    } catch (e) {
      return null;
    }
  }


};