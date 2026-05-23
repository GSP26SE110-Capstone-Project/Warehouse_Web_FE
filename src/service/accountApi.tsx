import { api } from "../utils/Axios";
import type { GetAllUsersResponse, GetUsersResponse, UserRequest, UserResponse } from "../types/Account";
import type { ApiResponse } from "../types/ApiResponse";

export const accountApi = {
    getById: (userId: string) => {
        return api.get<GetUsersResponse>(`/users/${userId}`);
    },
    getAll: () => {
        return api.get<GetAllUsersResponse>("/users");
    },
    create: (data: UserRequest) => {
        return api.post<ApiResponse<UserResponse>>("/users", data);
    },
    update: (userId: string, data: UserRequest) => {
        return api.patch<ApiResponse<UserResponse>>(`/users/${userId}`, data);
    },
    delete: (userId: string) => {
        return api.delete(`/users/${userId}`);
    },
    updateBlock: (userId: string, data: { status: string }) => {
        return api.patch<ApiResponse<UserResponse>>(`/users/${userId}`, data);
    },


};