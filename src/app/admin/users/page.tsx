"use client";

import { useState, useEffect } from 'react';
import { User, PaginationData } from './types';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import UserRolesModal from './components/UserRolesModal';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });

  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [managingUser, setManagingUser] = useState<{id: number, username: string} | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const fetchUsers = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users?page=${page}&per_page=${pagination.per_page}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.message || '获取用户列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current_page);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchUsers(page);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleManageRoles = (user: User) => {
    setManagingUser({ id: user.id, username: user.username });
    setShowRolesModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除此用户吗？')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        fetchUsers(pagination.current_page);
      } else {
        alert(result.message || '删除用户失败');
      }
    } catch (err) {
      alert('删除用户失败');
    }
  };

  const getPageNumbers = (): number[] => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, pagination.current_page - delta); i <= Math.min(pagination.pages - 1, pagination.current_page + delta); i++) {
      range.push(i);
    }

    if (pagination.pages > 1) {
      rangeWithDots.push(1);
      if (range[0] > 2) {
        rangeWithDots.push(-1);
      }
      range.forEach(page => rangeWithDots.push(page));
      if (range[range.length - 1] < pagination.pages - 1) {
        rangeWithDots.push(-1);
      }
      if (pagination.pages > 1) {
        rangeWithDots.push(pagination.pages);
      }
    } else {
      rangeWithDots.push(1);
    }

    return rangeWithDots;
  };

  if (loading) return <p className="text-gray-500">加载中...</p>;
  if (error) return <p className="text-red-500">错误: {error}</p>;

  return (
    <>
      <h1 className="text-xl font-bold text-gray-800 mb-4 dark:text-white">用户管理</h1>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">用户列表</h2>
        <button
          onClick={() => setShowCreateModal(true)}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
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
                    {user.roles && user.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <span key={role.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">未分配</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleManageRoles(user)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      授权
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
                    &lt;
                  </button>
                  {getPageNumbers().map((pageNum, index) => (
                    <button
                      key={index}
                      onClick={() => pageNum > 0 && handlePageChange(pageNum)}
                      className={`${
                        pageNum === -1
                          ? 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-600'
                          : ''
                      } ${
                        pageNum === pagination.current_page
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
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗组件 */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchUsers(pagination.current_page)}
        apiBaseUrl={API_BASE_URL}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSuccess={() => fetchUsers(pagination.current_page)}
        user={editingUser}
        apiBaseUrl={API_BASE_URL}
      />

      <UserRolesModal
        isOpen={showRolesModal}
        onClose={() => {
          setShowRolesModal(false);
          setManagingUser(null);
        }}
        onSuccess={() => fetchUsers(pagination.current_page)}
        userId={managingUser?.id || null}
        username={managingUser?.username || ''}
        apiBaseUrl={API_BASE_URL}
      />
    </>
  );
}