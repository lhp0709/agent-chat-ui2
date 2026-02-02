// app/admin/users/page.tsx
"use client";
import { useState, useEffect } from 'react';

// 定义用户类型
interface User {
  id: number;
  username: string;
  real_name: string;
  email: string;
  created_at: string; // ISO 字符串格式
}

// 定义分页数据类型
interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  pages: number;
}

// 定义 API 响应类型
interface GetUsersResponse {
  success: boolean;
  message?: string; // 添加可选的 message 属性
  data: {
    users: User[];
    pagination: PaginationData;
  };
}

interface CreateUserResponse {
  success: boolean;
  message: string;
  data?: User;
}

interface UpdateUserResponse {
  success: boolean;
  message: string;
}

interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', real_name: '', email: '' });
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });

  // 从环境变量获取 API 基础 URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''; // 如果环境变量未设置，则使用空字符串，这会导致相对路径

  // 获取用户列表
  const fetchUsers = async (page: number = 1, per_page: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      // 使用 API_BASE_URL 构建完整 URL
      const response = await fetch(`${API_BASE_URL}/api/admin/users?page=${page}&per_page=${per_page}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: GetUsersResponse = await response.json();
      if (result.success) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        // 使用 result.message，如果不存在则使用默认消息
        throw new Error(result.message || '获取用户列表失败');
      }
    } catch (err) {
      console.error('获取用户列表失败:', err);
      // setError(err instanceof Error ? err.message : '未知错误');
      setError(err instanceof Error ? err.message : '获取用户列表失败');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取第一页数据
  useEffect(() => {
    fetchUsers(pagination.current_page, pagination.per_page);
  }, []);

  // 切换到指定页
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchUsers(page, pagination.per_page);
    }
  };

  // 生成页码数组 (用于分页按钮)
  const getPageNumbers = (): number[] => {
    const delta = 2; // 显示当前页前后各2个页码
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, pagination.current_page - delta); i <= Math.min(pagination.pages - 1, pagination.current_page + delta); i++) {
      range.push(i);
    }

    if (pagination.pages > 1) {
      rangeWithDots.push(1); // 总是显示第一页
      if (range[0] > 2) {
        rangeWithDots.push(-1); // -1 表示省略号
      }
      range.forEach(page => rangeWithDots.push(page));
      if (range[range.length - 1] < pagination.pages - 1) {
        rangeWithDots.push(-1); // -1 表示省略号
      }
      if (pagination.pages > 1) {
        rangeWithDots.push(pagination.pages); // 总是显示最后一页
      }
    } else {
      rangeWithDots.push(1); // 只有一页时
    }

    return rangeWithDots;
  };

  const handleAddUser = () => {
    setNewUser({ username: '', real_name: '', email: '' });
    setEditingUser(null);
    setShowModal('add');
  };

  const handleEditUser = (user: User) => {
    // 确保 username, real_name, email 都是字符串，即使是 null 或 undefined 也要转换为空字符串
    setEditingUser(user);
    setNewUser({ 
      username: user.username || '', 
      real_name: user.real_name || '', // 如果 real_name 是 null 或 undefined，则使用空字符串
      email: user.email || ''          // 如果 email 是 null 或 undefined，则使用空字符串
    });
    setShowModal('edit');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (showModal === 'add') {
      setNewUser(prev => ({ ...prev, [name]: value }));
    } else if (showModal === 'edit' && editingUser) {
      setNewUser(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveUser = async () => {
    if (showModal === 'add') {
      // 确保提交的数据中，可能为 null 的字段被转换为空字符串或适当的值
      const dataToSend = {
        username: newUser.username.trim(), // 去除首尾空格
        real_name: newUser.real_name.trim(),
        email: newUser.email.trim(),
      };

      // 验证数据
      if (!dataToSend.username || !dataToSend.real_name || !dataToSend.email) {
          alert('用户名、真实姓名和邮箱不能为空');
          return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend), // 发送处理后的数据
        });
        const result: CreateUserResponse = await response.json();

        if (result.success && result.data) {
          fetchUsers(pagination.current_page, pagination.per_page);
          setNewUser({ username: '', real_name: '', email: '' });
          setShowModal(null);
        } else {
          alert(result.message || '新增用户失败');
        }
      } catch (err) {
        console.error('新增用户失败:', err);
        alert('新增用户失败');
      }
    } else if (showModal === 'edit' && editingUser) {
      // 确保提交的数据中，可能为 null 的字段被转换为空字符串或适当的值
      const dataToSend = {
        username: newUser.username.trim(),
        real_name: newUser.real_name.trim(),
        email: newUser.email.trim(),
      };

      // 验证数据
      if (!dataToSend.username || !dataToSend.real_name || !dataToSend.email) {
          alert('用户名、真实姓名和邮箱不能为空');
          return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend), // 发送处理后的数据
        });
        const result: UpdateUserResponse = await response.json();

        if (result.success) {
          fetchUsers(pagination.current_page, pagination.per_page);
          setNewUser({ username: '', real_name: '', email: '' });
          setEditingUser(null);
          setShowModal(null);
        } else {
          alert(result.message || '更新用户失败');
        }
      } catch (err) {
        console.error('更新用户失败:', err);
        alert('更新用户失败');
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除此用户吗？')) return;

    try {
      // 使用 API_BASE_URL 构建完整 URL
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const result: DeleteUserResponse = await response.json();

      if (result.success) {
        // 成功后刷新列表
        fetchUsers(pagination.current_page, pagination.per_page);
      } else {
        alert(result.message || '删除用户失败');
      }
    } catch (err) {
      console.error('删除用户失败:', err);
      alert('删除用户失败');
    }
  };

  if (loading) {
    return <p className="text-gray-500">加载中...</p>;
  }

  if (error) {
    return <p className="text-red-500">错误: {error}</p>;
  }

  // --- UI Logic ---
  return (
    <>
      <h1 className="text-xl font-bold text-gray-800 mb-4 dark:text-white">用户管理</h1>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">用户列表</h2>
        <button
          onClick={handleAddUser}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          新增用户
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">暂无用户</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  用户名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  姓名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  邮箱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  创建时间
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.real_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleString()} {/* 格式化日期 */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 分页控件 */}
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4 dark:border-gray-700">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  pagination.current_page === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'
                } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600`}
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.pages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  pagination.current_page === pagination.pages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'
                } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600`}
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  显示 <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  条，共 <span className="font-medium">{pagination.total}</span> 条
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      pagination.current_page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-500'
                    } dark:ring-gray-600 dark:hover:bg-gray-600 dark:text-gray-400`}
                  >
                    <span className="sr-only">Previous</span>
                    &lt;
                  </button>
                  {getPageNumbers().map((pageNum, index) => (
                    <button
                      key={index}
                      onClick={() => pageNum > 0 && handlePageChange(pageNum)}
                      className={`${
                        pageNum === -1 // 省略号
                          ? 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-600'
                          : ''
                      } ${
                        pageNum === pagination.current_page // 当前页
                          ? 'relative z-10 inline-flex items-center bg-blue-600 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600'
                      } ${pageNum > 0 ? '' : 'cursor-default'}`}
                      disabled={pageNum === -1 || pageNum === pagination.current_page}
                    >
                      {pageNum === -1 ? '...' : pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.pages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      pagination.current_page === pagination.pages ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-500'
                    } dark:ring-gray-600 dark:hover:bg-gray-600 dark:text-gray-400`}
                  >
                    <span className="sr-only">Next</span>
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增/编辑用户模态框 */}
      {showModal && (
        <div className="fixed inset-0  bg-purple-200 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">
                {showModal === 'add' ? '新增用户' : '编辑用户'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    用户名 *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={newUser.username}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="real_name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    真实姓名 *
                  </label>
                  <input
                    type="text"
                    id="real_name"
                    name="real_name"
                    value={newUser.real_name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    邮箱 *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 dark:bg-gray-700">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}