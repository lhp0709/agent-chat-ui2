// app/admin/permissions/page.tsx
"use client";
import { useState, useEffect } from 'react';

// 类型定义
interface Role {
  id: number;
  name: string;
  created_at: string;
}

interface Assistant {
  id: number;
  ASSISTANT_ID: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  pages: number;
}

// API响应类型
interface RolesResponse {
  success: boolean;
  data: {
    roles: Role[];
    pagination: PaginationData;
  };
  message?: string;
}

interface AssistantsResponse {
  success: boolean;
  data: {
    assistants: Assistant[];
  };
  message?: string;
}

interface PermissionsResponse {
  success: boolean;
  data: {
    role_id: number;
    authorized_app_ids: number[];
  };
  message?: string;
}

interface ActionResponse {
  success: boolean;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function PermissionsPage() {
  // 角色列表状态
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rolePagination, setRolePagination] = useState<PaginationData>({
    current_page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });

  // 应用列表状态
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assistantsLoading, setAssistantsLoading] = useState(false);
  const [authorizedApps, setAuthorizedApps] = useState<Set<number>>(new Set());

  // 模态框状态
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  // 获取角色列表
  const fetchRoles = async (page: number = 1) => {
    setRolesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/roles?page=${page}&per_page=10`);
      const result: RolesResponse = await res.json();
      
      if (result.success) {
        setRoles(result.data.roles);
        setRolePagination(result.data.pagination);
        
        // 如果当前选中的角色不在列表中，取消选中
        if (selectedRoleId && !result.data.roles.find(r => r.id === selectedRoleId)) {
          setSelectedRoleId(null);
          setAuthorizedApps(new Set());
        }
      }
    } catch (err) {
      console.error('获取角色列表失败:', err);
      alert('获取角色列表失败');
    } finally {
      setRolesLoading(false);
    }
  };

  // 获取应用列表
  const fetchAssistants = async () => {
    setAssistantsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/assistants`);
      const result: AssistantsResponse = await res.json();
      
      if (result.success) {
        setAssistants(result.data.assistants);
      }
    } catch (err) {
      console.error('获取应用列表失败:', err);
    } finally {
      setAssistantsLoading(false);
    }
  };

  // 获取角色的权限
  const fetchRolePermissions = async (roleId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/roles/${roleId}/permissions`);
      const result: PermissionsResponse = await res.json();
      
      if (result.success) {
        setAuthorizedApps(new Set(result.data.authorized_app_ids));
      }
    } catch (err) {
      console.error('获取权限失败:', err);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchRoles();
    fetchAssistants();
  }, []);

  // 当选择角色时加载权限
  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    } else {
      setAuthorizedApps(new Set());
    }
  }, [selectedRoleId]);

  // 处理角色选择
  const handleRoleSelect = (role: Role) => {
    setSelectedRoleId(role.id);
  };

  // 处理权限切换
  const handlePermissionToggle = async (appId: number, isAuthorized: boolean) => {
    if (!selectedRoleId) return;

    try {
      const method = isAuthorized ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE_URL}/api/admin/role_apps`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRoleId,
          app_id: appId,
        }),
      });

      const result: ActionResponse = await res.json();
      
      if (result.success) {
        // 更新本地状态
        setAuthorizedApps(prev => {
          const newSet = new Set(prev);
          if (isAuthorized) {
            newSet.delete(appId);
          } else {
            newSet.add(appId);
          }
          return newSet;
        });
      } else {
        alert(result.message || '操作失败');
      }
    } catch (err) {
      console.error('更新权限失败:', err);
      alert('更新权限失败');
    }
  };

  // 角色表单处理
  const handleAddRole = () => {
    setRoleForm({ name: '' });
    setEditingRole(null);
    setShowModal('add');
  };

  const handleEditRole = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发行选择
    setEditingRole(role);
    setRoleForm({ name: role.name });
    setShowModal('edit');
  };

  const handleDeleteRole = async (roleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除该角色吗？此操作将同时移除该角色的所有应用授权。')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });
      const result: ActionResponse = await res.json();

      if (result.success) {
        fetchRoles(rolePagination.current_page);
        if (selectedRoleId === roleId) {
          setSelectedRoleId(null);
        }
      } else {
        alert(result.message || '删除失败');
      }
    } catch (err) {
      console.error('删除角色失败:', err);
      alert('删除角色失败');
    }
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      alert('角色名称不能为空');
      return;
    }

    setSubmitLoading(true);
    try {
      const url = showModal === 'add' 
        ? `${API_BASE_URL}/api/admin/roles`
        : `${API_BASE_URL}/api/admin/roles/${editingRole?.id}`;
      
      const method = showModal === 'add' ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roleForm.name.trim() }),
      });

      const result = await res.json();

      if (result.success) {
        fetchRoles(rolePagination.current_page);
        setShowModal(null);
        setRoleForm({ name: '' });
      } else {
        alert(result.message || '保存失败');
      }
    } catch (err) {
      console.error('保存角色失败:', err);
      alert('保存失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 生成分页按钮
  const getPageNumbers = (): (number | string)[] => {
    const { current_page, pages } = rolePagination;
    const delta = 2;
    const range: number[] = [];
    
    for (let i = Math.max(2, current_page - delta); i <= Math.min(pages - 1, current_page + delta); i++) {
      range.push(i);
    }

    const rangeWithDots: (number | string)[] = [];
    
    if (pages > 1) {
      rangeWithDots.push(1);
      if (range[0] > 2) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(...range);
      if (range[range.length - 1] < pages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(pages);
    } else if (pages === 1) {
      rangeWithDots.push(1);
    }

    return rangeWithDots;
  };

  // 判断应用是否已授权
  const isAuthorized = (appId: number) => authorizedApps.has(appId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4 dark:text-white">用户权限管理</h1>
      
      {/* 上方：角色信息区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">角色列表</h2>
          <button
            onClick={handleAddRole}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            新增角色
          </button>
        </div>

        {rolesLoading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">暂无角色</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      选择
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      角色名称
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
                  {roles.map((role) => (
                    <tr 
                      key={role.id} 
                      onClick={() => handleRoleSelect(role)}
                      className={`cursor-pointer transition-colors ${
                        selectedRoleId === role.id 
                          ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedRoleId === role.id 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedRoleId === role.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {role.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(role.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={(e) => handleEditRole(role, e)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          编辑
                        </button>
                        <button
                          onClick={(e) => handleDeleteRole(role.id, e)}
                          className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页控件 */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 dark:border-gray-700">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    共 <span className="font-medium">{rolePagination.total}</span> 条记录
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => fetchRoles(rolePagination.current_page - 1)}
                      disabled={rolePagination.current_page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:ring-gray-600 dark:hover:bg-gray-600 dark:text-gray-400"
                    >
                      &lt;
                    </button>
                    {getPageNumbers().map((pageNum, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNum === 'number' && fetchRoles(pageNum)}
                        disabled={pageNum === '...'}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-gray-600 ${
                          pageNum === rolePagination.current_page
                            ? 'z-10 bg-blue-600 text-white focus-visible:outline-blue-600'
                            : 'text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-600'
                        } ${pageNum === '...' ? 'cursor-default' : ''}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => fetchRoles(rolePagination.current_page + 1)}
                      disabled={rolePagination.current_page === rolePagination.pages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:ring-gray-600 dark:hover:bg-gray-600 dark:text-gray-400"
                    >
                      &gt;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 下方：应用授权区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            应用授权配置
            {selectedRoleId && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                (当前角色ID: {selectedRoleId})
              </span>
            )}
          </h2>
        </div>

        {!selectedRoleId ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            请先在上方选择一个角色进行授权配置
          </div>
        ) : assistantsLoading ? (
          <div className="p-8 text-center text-gray-500">加载应用列表中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    应用名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    ASSISTANT_ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    描述
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    是否授权
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {assistants.map((assistant) => {
                  const authorized = isAuthorized(assistant.id);
                  return (
                    <tr 
                      key={assistant.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {assistant.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {assistant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {assistant.ASSISTANT_ID}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {assistant.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handlePermissionToggle(assistant.id, authorized)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            authorized
                              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 focus:ring-green-500'
                              : 'bg-gray-200 border-gray-300 text-transparent hover:bg-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-500 focus:ring-gray-400'
                          }`}
                          title={authorized ? '点击取消授权' : '点击授权'}
                        >
                          {authorized && (
                            <svg 
                              className="w-4 h-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={3} 
                                d="M5 13l4 4L19 7" 
                              />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新增/编辑角色模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800 transform transition-all">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">
                {showModal === 'add' ? '新增角色' : '编辑角色'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    角色名称 *
                  </label>
                  <input
                    type="text"
                    id="roleName"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && !submitLoading && handleSaveRole()}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="请输入角色名称"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 dark:bg-gray-700">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                disabled={submitLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={submitLoading || !roleForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}