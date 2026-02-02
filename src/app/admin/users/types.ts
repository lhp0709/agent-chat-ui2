export interface Role {
  id: number;
  name: string;
  created_at?: string;
}

export interface User {
  id: number;
  username: string;
  real_name: string;
  email: string;
  created_at: string;
  roles?: Role[];  // 用户关联的角色
}

export interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}