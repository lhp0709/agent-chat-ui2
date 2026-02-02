"use client";

import { useState, useEffect } from 'react';
import { User, Role, ApiResponse } from '../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  apiBaseUrl: string;
}

export default function EditUserModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user, 
  apiBaseUrl 
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    real_name: '',
    email: ''
  });
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  // 当 user 变化时，初始化表单数据
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        username: user.username || '',
        real_name: user.real_name || '',
        email: user.email || ''
      });
      // 如果用户对象包含 roles，初始化选中的角色
      if (user.roles) {
        setSelectedRoles(user.roles.map(r => r.id));
      } else {
        // 否则需要单独获取用户当前角色
        fetchUserRoles(user.id);
      }
    }
  }, [user, isOpen]);

  // 获取可用角色列表
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    setFetchingRoles(true);
    try {
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

  const fetchUserRoles = async (userId: number) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/roles`);
      const result: ApiResponse<{ roles: Role[] }> = await response.json();
      if (result.success && result.data) {
        setSelectedRoles(result.data.roles.map(r => r.id));
      }
    } catch (err) {
      console.error('获取用户角色失败:', err);
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
    if (!user) return;

    if (!formData.username.trim() || !formData.real_name.trim() || !formData.email.trim()) {
      alert('用户名、真实姓名和邮箱不能为空');
      return;
    }

    setLoading(true);
    try {
      // 先更新用户基本信息
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          real_name: formData.real_name.trim(),
          email: formData.email.trim(),
          role_ids: selectedRoles // 同时更新角色
        }),
      });
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.message || '更新用户失败');
      }
    } catch (err) {
      alert('更新用户失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">编辑用户 - {user.username}</h3>
        </div>
        
        <div className="p-6 space-y-6">
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
          </div>

          
          
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 dark:bg-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}