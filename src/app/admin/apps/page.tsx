// app/admin/apps/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@radix-ui/react-switch';
import dynamic from 'next/dynamic';

// 动态导入模态框组件，避免 SSR 相关问题
const FormModal = dynamic(() => import('./form-apps'), { ssr: false });

// 定义助手类型
interface Assistant {
  id: number;
  ASSISTANT_ID: string;
  name: string;
  description: string | null;
  icon_url: string | null; // 存储用户上传的图片URL
  in_use: string; // 'active', 'inactive'
  created_at: string;
}

// 定义分页数据类型
interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  pages: number;
}
// 定义 API 响应类型
interface GetAssistantsResponse {
  success: boolean;
  message?: string;
  data: {
    assistants: Assistant[];
    pagination: PaginationData;
  };
}

interface UpdateAssistantResponse {
  success: boolean;
  message: string;
}

export default function AppsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });

  // 从环境变量获取 API 基础 URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // 获取助手列表
  const fetchAssistants = async (page: number = 1, per_page: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/assistants?page=${page}&per_page=${per_page}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: GetAssistantsResponse = await response.json();
      if (result.success) {
        setAssistants(result.data.assistants);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.message || '获取助手列表失败');
      }
    } catch (err) {
      console.error('获取助手列表失败:', err);
      setError(err instanceof Error ? err.message : '获取助手列表失败');
      setAssistants([]);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取第一页数据
  useEffect(() => {
    fetchAssistants(pagination.current_page, pagination.per_page);
  }, []);

  // 切换到指定页
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchAssistants(page, pagination.per_page);
    }
  };

  // 生成页码数组 (用于分页按钮)
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

  const handleAddAssistant = () => {
    setEditingAssistant(null);
    setShowModal('add');
  };

  const handleEditAssistant = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setShowModal('edit');
  };

  const handleDeleteAssistant = async (assistantId: number) => {
    if (!confirm('确定要删除此助手吗？')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/assistants/${assistantId}`, {
        method: 'DELETE',
      });
      const result: { success: boolean; message?: string } = await response.json();

      if (result.success) {
        // 重新获取列表以反映删除
        fetchAssistants(pagination.current_page, pagination.per_page);
      } else {
        alert(result.message || '删除助手失败');
      }
    } catch (err) {
      console.error('删除助手失败:', err);
      alert('删除助手失败');
    }
  };

  // 切换助手可用状态
  const toggleAssistantStatus = async (assistant: Assistant) => {
    const newStatus = assistant.in_use === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/assistants/${assistant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ in_use: newStatus }),
      });
      const result: UpdateAssistantResponse = await response.json();
      if (result.success) {
        setAssistants(prev => prev.map(a => a.id === assistant.id ? { ...a, in_use: newStatus } : a));
      } else {
        alert(result.message || `切换助手状态失败`);
      }
    } catch (err) {
      console.error('切换助手状态失败:', err);
      alert('切换助手状态失败');
    }
  };

  // 用于缓存已加载默认图标的ID，防止重复尝试
  const [defaultIconsLoaded, setDefaultIconsLoaded] = useState<Set<number>>(new Set());

  // 图片错误处理函数
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>, assistantId: number) => {
    // 检查是否已经尝试过替换为默认图标
    if (!defaultIconsLoaded.has(assistantId)) {
      // 替换为默认图标
      e.currentTarget.src = '/path/to/default-icon.svg'; // 请替换为你的实际默认图标路径
      // 标记此助手ID的图标已加载过默认图标
      setDefaultIconsLoaded(prev => new Set(prev).add(assistantId));
    }
    // 如果已经是默认图标且再次失败，则不再做任何操作，避免无限循环
  }, [defaultIconsLoaded]); // 依赖项包括 defaultIconsLoaded


  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  if (error) {
    return <div className="p-6">错误: {error}</div>;
  }

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">应用管理</h1>
        <div className="mb-6">
          <button
            onClick={handleAddAssistant}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            新增助手
          </button>
        </div>

        {assistants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">暂无助手</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    ASSISTANT_ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    名称
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    描述
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300 min-w-[100px]">
                    启用
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    创建时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-base font-bold text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {assistants.map((assistant) => (
                  <tr key={assistant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {assistant.ASSISTANT_ID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {assistant.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate"
                      title={assistant.description || ''}
                    >
                      {assistant.description ? (assistant.description.length > 50 ? `${assistant.description.substring(0, 50)}...` : assistant.description) : '-'}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <Switch
                        checked={assistant.in_use === 'active'}
                        onCheckedChange={() => toggleAssistantStatus(assistant)}
                        id={`switch-${assistant.id}`}
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {/* Track (背景) - 应用 data-[state] 类 */}
                        <span
                          className="
                            absolute inset-0 rounded-full bg-gray-300
                            transition-colors duration-200 ease-in-out
                            data-[state=checked]:bg-green-500
                            dark:bg-gray-600 dark:data-[state=checked]:bg-green-600
                           "
                          data-state={assistant.in_use === 'active' ? 'checked' : 'unchecked'}
                        ></span>
                        {/* Thumb (滑块) - 应用 data-[state] 类 */}
                        <span
                          className="
                            pointer-events-none relative block h-5 w-5 rounded-full bg-white shadow-lg ring-0
                            transition-transform duration-200 ease-in-out
                            data-[state=unchecked]:translate-x-0.5
                            data-[state=checked]:translate-x-6
                           "
                          data-state={assistant.in_use === 'active' ? 'checked' : 'unchecked'}
                        ></span>
                      </Switch>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(assistant.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditAssistant(assistant)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteAssistant(assistant.id)}
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
                        className={`${pageNum === -1
                          ? 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-600'
                          : ''
                          } ${pageNum === pagination.current_page
                            ? 'relative z-10 inline-flex items-center bg-blue-600 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-2-blue-600'
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
      </div>

      {/* 新增/编辑助手模态框 - 使用动态导入的组件 */}
      {showModal && (
        <FormModal
          mode={showModal}
          assistant={editingAssistant}
          onClose={() => {
            setShowModal(null);
            setEditingAssistant(null);
          }}
          onSave={() => {
            fetchAssistants(pagination.current_page, pagination.per_page); // 保存后刷新列表
            setShowModal(null);
            setEditingAssistant(null);
          }}
        />
      )}
    </>
  );
}