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

// 复选框组件
const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-6 h-6 rounded flex items-center justify-center transition-colors duration-200 ${
      checked 
        ? 'bg-green-500 hover:bg-green-600 text-white' 
        : 'bg-gray-300 hover:bg-gray-400 text-transparent'
    }`}
  >
    {checked && (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </button>
);

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [authorizedApps, setAuthorizedApps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal 状态
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '' });
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // 获取角色列表
  const fetchRoles = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/roles?page=${page}&per_page=${pagination.per_page}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setRoles(result.data.roles);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有应用
  const fetchAssistants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/assistants`);
      if (!response.ok) throw new Error('获取应用列表失败');
      const result = await response.json();
      if (result.success) {
        setAssistants(result.data.assistants);
      }
    } catch (err) {
      console.error('获取应用列表失败:', err);
    }
  };

  // 获取角色的权限
  const fetchPermissions = async (roleId: number) => {
    setPermissionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/roles/${roleId}/permissions`);
      if (!response.ok) throw new Error('获取权限失败');
      const result = await response.json();
      if (result.success) {
        setAuthorizedApps(result.data.authorized_app_ids);
      }
    } catch (err) {
      console.error('获取权限失败:', err);
    } finally {
      setPermissionLoading(false);
    }
  };

  // 切换授权状态
  const togglePermission = async (appId: number, currentStatus: boolean) => {
    if (!selectedRole) return;
    
    const url = `${API_BASE_URL}/api/admin/role_apps`;
    const method = currentStatus ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRole.id,
          app_id: appId
        }),
      });
      
      if (!response.ok) throw new Error('操作失败');
      const result = await response.json();
      
      if (result.success) {
        // 更新本地状态
        if (currentStatus) {
          setAuthorizedApps(prev => prev.filter(id => id !== appId));
        } else {
          setAuthorizedApps(prev => [...prev, appId]);
        }
      }
    } catch (err) {
      alert('操作失败，请重试');
    }
  };

  // 选择角色
  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    fetchPermissions(role.id);
  };

  // 角色 CRUD 操作
  const handleAddRole = () => {
    setRoleForm({ name: '' });
    setEditingRole(null);
    setShowModal('add');
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name });
    setShowModal('edit');
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      alert('角色名称不能为空');
      return;
    }

    const url = showModal === 'add' 
      ? `${API_BASE_URL}/api/admin/roles`
      : `${API_BASE_URL}/api/admin/roles/${editingRole?.id}`;
    
    const method = showModal === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roleForm.name.trim() }),
      });
      
      const result = await response.json();
      if (result.success) {
        fetchRoles(pagination.current_page);
        setShowModal(null);
        setRoleForm({ name: '' });
      } else {
        alert(result.message || '操作失败');
      }
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('确定要删除此角色吗？')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        if (selectedRole?.id === roleId) {
          setSelectedRole(null);
          setAuthorizedApps([]);
        }
        fetchRoles(pagination.current_page);
      } else {
        alert(result.message || '删除失败');
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  // 修复后的分页逻辑 - 避免类型混合导致的比较错误
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const delta = 2;
    
    // 先生成数字范围的数组（明确为 number[] 类型）
    const range: number[] = [];
    const start = Math.max(2, pagination.current_page - delta);
    const end = Math.min(pagination.pages - 1, pagination.current_page + delta);
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // 总是显示第一页
    pages.push(1);
    
    // 添加前省略号（如果范围第一个数大于2）
    if (range.length > 0 && start > 2) {
      pages.push('...');
    }
    
    // 添加中间页码
    range.forEach(page => pages.push(page));
    
    // 添加后省略号（如果范围最后一个数小于总页数-1）
    if (range.length > 0 && end < pagination.pages - 1) {
      pages.push('...');
    }
    
    // 总是显示最后一页（如果大于1）
    if (pagination.pages > 1) {
      pages.push(pagination.pages);
    }
    
    return pages;
  };

  useEffect(() => {
    fetchRoles();
    fetchAssistants();
  }, []);

  if (loading) return <p className="text-gray-500">加载中...</p>;
  if (error) return <p className="text-red-500">错误: {error}</p>;

  return (
    <div className="space-y-6">
      {/* 上方：角色管理 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">角色管理</h2>
            <button
              onClick={handleAddRole}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              新增角色
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
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
                  onClick={() => handleSelectRole(role)}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedRole?.id === role.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
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
                      onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      编辑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
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

        {/* 分页 */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            共 <span className="font-medium">{pagination.total}</span> 条记录
          </div>
          <div className="flex space-x-2">
            {getPageNumbers().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' && fetchRoles(page)}
                disabled={typeof page !== 'number' || page === pagination.current_page}
                className={`px-3 py-1 rounded-md text-sm ${
                  page === pagination.current_page
                    ? 'bg-blue-600 text-white'
                    : typeof page !== 'number'
                    ? 'text-gray-400 cursor-default'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 下方：应用权限配置 */}
      {selectedRole && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              应用权限配置 - <span className="text-blue-600 dark:text-blue-400">{selectedRole.name}</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              点击下方复选框授权或取消授权应用
            </p>
          </div>

          {permissionLoading ? (
            <div className="p-6 text-center text-gray-500">加载权限中...</div>
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
                  {[...assistants].sort((a, b) => a.id - b.id).map((assistant) => {
                    const isAuthorized = authorizedApps.includes(assistant.id);
                    return (
                      <tr key={assistant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                          <Checkbox 
                            checked={isAuthorized}
                            onChange={() => togglePermission(assistant.id, isAuthorized)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedRole && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">请从上方角色列表中选择一个角色以配置权限</p>
        </div>
      )}

      {/* 新增/编辑角色 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-purple-200 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">
                {showModal === 'add' ? '新增角色' : '编辑角色'}
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  角色名称 *
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="请输入角色名称"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 dark:bg-gray-700">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                取消
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}