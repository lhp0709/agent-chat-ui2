"use client";

import { useState, useEffect } from 'react';
import { Role, ApiResponse } from '../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiBaseUrl: string;
}

export default function CreateUserModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  apiBaseUrl 
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    real_name: '',
    email: '',
    password: 'DefaultPassword123!' // 默认密码
  });
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  // 获取可用角色列表
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    setFetchingRoles(true);
    try {
      // 获取所有角色（不分页）
      const response = await fetch(`${apiBaseUrl}/api/admin/roles?per_page=1000`);
      const result: ApiResponse<{ roles: Role[]; pagination: any }> = await response.json();
      if (result.success && result.data) {
        setAvailableRoles(result.data.roles);
      }
    } catch (err) {
      console.error('获取角色列表失败:', err);
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.username.trim() || !formData.real_name.trim() || !formData.email.trim()) {
      alert('用户名、真实姓名和邮箱不能为空');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role_ids: selectedRoles // 传递选中的角色ID数组
        }),
      });
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        // 重置表单
        setFormData({ username: '', real_name: '', email: '', password: 'DefaultPassword123!' });
        setSelectedRoles([]);
        onSuccess();
        onClose();
      } else {
        alert(result.message || '创建用户失败');
      }
    } catch (err) {
      alert('创建用户失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">新增用户</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                用户名 *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                真实姓名 *
              </label>
              <input
                type="text"
                name="real_name"
                value={formData.real_name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                邮箱 *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                初始密码
              </label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="DefaultPassword123!"
              />
              <p className="mt-1 text-xs text-gray-500">如不填写将使用默认密码</p>
            </div>
          </div>

          {/* 角色分配 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-300">
              分配角色（可多选）
            </label>
            {fetchingRoles ? (
              <p className="text-sm text-gray-500">加载角色中...</p>
            ) : availableRoles.length === 0 ? (
              <p className="text-sm text-gray-500">暂无可用角色</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 dark:border-gray-600">
                {availableRoles.map(role => (
                  <label key={role.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{role.name}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedRoles.length > 0 && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                已选择 {selectedRoles.length} 个角色
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 dark:bg-gray-700">
          <button
            onClick={() => {
              setFormData({ username: '', real_name: '', email: '', password: 'DefaultPassword123!' });
              setSelectedRoles([]);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {loading ? '保存中...' : '创建用户'}
          </button>
        </div>
      </div>
    </div>
  );
}