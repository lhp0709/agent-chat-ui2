// app/admin/apps/form-modal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

// 与主页面共享类型定义
interface Assistant {
  id: number;
  ASSISTANT_ID: string;
  name: string;
  description: string | null;
  icon_url: string | null; // 存储用户上传的图片URL
  in_use: string; // 'active', 'inactive'
  created_at: string;
}

interface CreateAssistantResponse {
  success: boolean;
  message: string;
  data?: Assistant;
}

interface UpdateAssistantResponse {
  success: boolean;
  message: string;
}

interface UploadResponse {
  file_type: string;
  filename: string;
  url: string;
  size: number;
}

interface FormModalProps {
  mode: 'add' | 'edit';
  assistant?: Assistant | null;
  onClose: () => void;
  onSave: () => void;
}

const FormModal: React.FC<FormModalProps> = ({ mode, assistant, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ASSISTANT_ID: '',
    name: '',
    description: '',
    icon_file: null as File | null, // 用于存储待上传的文件
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 用于预览图片
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // 当编辑时，同步传入的数据到本地状态
  useEffect(() => {
    if (mode === 'edit' && assistant) {
      setFormData({
        ASSISTANT_ID: assistant.ASSISTANT_ID,
        name: assistant.name,
        description: assistant.description || '',
        icon_file: null, // 编辑时，初始没有待上传的文件
      });
      setPreviewUrl(assistant.icon_url); // 设置当前的图标URL作为预览
    } else if (mode === 'add') {
      // 重置为初始状态
      setFormData({
        ASSISTANT_ID: '',
        name: '',
        description: '',
        icon_file: null,
      });
      setPreviewUrl(null); // 新增时没有预览
      setErrors({});
    }
  }, [mode, assistant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // 验证文件类型
      if (!file.type.match('image/(png|jpeg|jpg|svg\+xml)')) {
        alert('请选择 PNG, JPG, JPEG, 或 SVG 格式的图片文件。');
        if (fileInputRef.current) fileInputRef.current.value = ''; // 清空input
        return;
      }

      setFormData(prev => ({ ...prev, icon_file: file }));

      // 创建预览 URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // 清除之前的预览 URL (防止内存泄漏)
      return () => URL.revokeObjectURL(url);
    } else {
      setFormData(prev => ({ ...prev, icon_file: null }));
      // 如果是编辑模式且清空了文件，则恢复原始URL
      if (mode === 'edit' && assistant?.icon_url) {
        setPreviewUrl(assistant.icon_url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.ASSISTANT_ID.trim()) {
      newErrors.ASSISTANT_ID = 'ASSISTANT_ID 不能为空';
    }
    if (!formData.name.trim()) {
      newErrors.name = '名称不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`文件上传失败，状态码: ${response.status}`);
      }

      const result: UploadResponse = await response.json();
      return result.url; // 返回文件URL
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    let icon_url = null;

    // 如果有文件需要上传，先上传文件获取URL
    if (formData.icon_file) {
      icon_url = await uploadFile(formData.icon_file);
      if (!icon_url) {
        return; // 上传失败则直接返回
      }
    }

    // 准备发送到后端的数据（不包含文件）
    const dataToSend = {
      ASSISTANT_ID: formData.ASSISTANT_ID,
      name: formData.name,
      description: formData.description || '',
      ...(icon_url && { icon_url }), // 如果有新的icon_url才添加
    };

    try {
      let response;
      let result: CreateAssistantResponse | UpdateAssistantResponse;

      if (mode === 'add') {
        response = await fetch(`${API_BASE_URL}/api/admin/assistants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });
        result = await response.json() as CreateAssistantResponse;
      } else { // edit
        if (!assistant) return; // 理论上不会发生，但作为安全检查
        response = await fetch(`${API_BASE_URL}/api/admin/assistants/${assistant.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });
        result = await response.json() as UpdateAssistantResponse;
      }

      if (result.success) {
        onSave(); // 通知父组件保存成功
      } else {
        alert(result.message || (mode === 'add' ? '新增助手失败' : '更新助手失败'));
      }
    } catch (err) {
      console.error(mode === 'add' ? '新增助手失败:' : '更新助手失败:', err);
      alert(mode === 'add' ? '新增助手失败' : '更新助手失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">
            {mode === 'add' ? '新增助手' : '编辑助手'}
          </h3>
          <div className="space-y-4">
            {/* 文件上传区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                上传图标 (PNG, JPG, JPEG, SVG)
              </label>
              <div
                className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => fileInputRef.current?.click()} // 点击容器触发文件选择
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="图标预览"
                    className="w-full h-full object-contain rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg, image/svg+xml" // 限制可选文件类型
                onChange={handleFileChange}
                className="hidden" // 隐藏原生input
              />
            </div>
            <div>
              <label htmlFor="ASSISTANT_ID" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                ASSISTANT_ID *
              </label>
              <input
                type="text"
                id="ASSISTANT_ID"
                name="ASSISTANT_ID"
                value={formData.ASSISTANT_ID}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border ${
                  errors.ASSISTANT_ID ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                required
              />
              {errors.ASSISTANT_ID && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.ASSISTANT_ID}</p>}
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                名称 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
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

export default FormModal;