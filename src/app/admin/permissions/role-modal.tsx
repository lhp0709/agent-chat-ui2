'use client';

import { useState, useEffect } from 'react';

interface RoleModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  role?: {
    id: number;
    name: string;
  } | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ 
  isOpen, 
  mode, 
  role, 
  onClose, 
  onSubmit 
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (mode === 'edit' && role) {
      setName(role.name);
    } else if (mode === 'add') {
      setName('');
    }
  }, [mode, role]);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入角色名称');
      return;
    }
    
    onSubmit(name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">
            {mode === 'add' ? '新增角色' : '编辑角色'}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                角色名称 *
              </label>
              <input
                type="text"
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="输入角色名称"
              />
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 dark:bg-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;