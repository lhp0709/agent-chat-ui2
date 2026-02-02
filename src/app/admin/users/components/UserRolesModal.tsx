"use client";

import { useState, useEffect } from 'react';
import { Role, ApiResponse } from '../types';

interface UserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number | null;
  username: string;
  apiBaseUrl: string;
}

export default function UserRolesModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  username,
  apiBaseUrl 
}: UserRolesModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId]);

  const fetchData = async () => {
    setFetching(true);
    try {
      // 并行获取所有角色和用户的当前角色
      const [rolesRes, userRolesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/roles?per_page=1000`),
        fetch(`${apiBaseUrl}/api/admin/users/${userId}/roles`)
      ]);

      const rolesResult = await rolesRes.json();
      const userRolesResult = await userRolesRes.json();

      if (rolesResult.success) {
        setAvailableRoles(rolesResult.data.roles);
      }
      if (userRolesResult.success) {
        setSelectedRoles(userRolesResult.data.roles.map((r: Role) => r.id));
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      alert('获取数据失败');
    } finally {
      setFetching(false);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_ids: selectedRoles }),
      });
      
      const result: ApiResponse<any> = await response.json();
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.message || '更新角色失败');
      }
    } catch (err) {
      alert('更新角色失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            用户授权 - {username}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            管理该用户的角色权限
          </p>
        </div>
        
        <div className="p-6">
          {fetching ? (
            <p className="text-center text-gray-500">加载中...</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableRoles.map(role => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                  <div 
                    key={role.id}
                    onClick={() => handleRoleToggle(role.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{role.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID: {role.id}</p>
                    </div>
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      isSelected ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              已选择 <span className="font-medium text-blue-600 dark:text-blue-400">{selectedRoles.length}</span> 个角色
            </p>
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
            disabled={loading || fetching}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存授权'}
          </button>
        </div>
      </div>
    </div>
  );
}