// tool-calls.tsx
import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState, useMemo, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import * as ReactWindow from "react-window";
const List = (ReactWindow as any).FixedSizeList;
import { AutoSizer } from "react-virtualized-auto-sizer";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

// 大数据阈值：50KB
const LARGE_CONTENT_THRESHOLD = 50000;
// 虚拟化阈值：超过此数量使用虚拟列表
const VIRTUALIZATION_THRESHOLD = 20;

// 计算内容大小
const getContentSize = (content: any): number => {
  if (typeof content === 'string') return content.length;
  try {
    return JSON.stringify(content).length;
  } catch {
    return String(content).length;
  }
};

// 格式化文件大小显示
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// 值渲染组件 - 处理大数据展示
const ValueCell = memo(({ value }: { value: any }) => {
  if (value === null || value === undefined) return <span className="text-gray-400">null</span>;
  
  if (typeof value === 'object') {
    const str = JSON.stringify(value);
    if (str.length > 200) {
      return (
        <details className="cursor-pointer">
          <summary className="text-blue-600 hover:text-blue-800 text-xs">
            对象 ({formatSize(str.length)})
          </summary>
          <code className="block mt-1 rounded bg-gray-50 px-2 py-1 text-xs break-all font-mono max-h-40 overflow-auto">
            {str}
          </code>
        </details>
      );
    }
    return (
      <code className="rounded bg-gray-50 px-2 py-1 text-xs break-all font-mono">
        {str}
      </code>
    );
  }
  
  return <span className="text-sm text-gray-600">{String(value)}</span>;
});

ValueCell.displayName = 'ValueCell';

// 分页显示大数据数组
const PaginatedJSON = memo(({ data }: { data: any[] }) => {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const currentData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2 text-xs bg-white p-2 rounded border">
        <span className="text-gray-600">共 {data.length} 项，显示 {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, data.length)}</span>
        <div className="space-x-1">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 bg-gray-50 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span className="px-2 text-gray-700">{page + 1} / {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 bg-gray-50 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white p-3 rounded border max-h-96 overflow-auto">
        {JSON.stringify(currentData, null, 2)}
      </pre>
    </div>
  );
});

PaginatedJSON.displayName = 'PaginatedJSON';

// 分页显示大对象
const PaginatedObject = memo(({ data }: { data: Record<string, any> }) => {
  const entries = useMemo(() => Object.entries(data), [data]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const currentEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2 text-xs bg-white p-2 rounded border">
        <span className="text-gray-600">共 {entries.length} 个字段</span>
        <div className="space-x-1">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 bg-gray-50 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span className="px-2 text-gray-700">{page + 1} / {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 bg-gray-50 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto border rounded bg-white">
        <table className="min-w-full text-xs">
          <tbody className="divide-y divide-gray-200">
            {currentEntries.map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900 w-1/3 break-all bg-gray-50 border-r">{key}</td>
                <td className="px-3 py-2 break-all text-gray-600">
                  {isComplexValue(value) ? (
                    <code className="font-mono text-xs bg-gray-100 px-1 rounded">
                      {JSON.stringify(value).slice(0, 100)}
                      {JSON.stringify(value).length > 100 ? '...' : ''}
                    </code>
                  ) : (
                    String(value)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

PaginatedObject.displayName = 'PaginatedObject';

// 内容渲染组件
const ContentRenderer = memo(({ content }: { content: any }) => {
  if (content.type === 'large') {
    return (
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">大数据</span>
          <span className="text-xs text-gray-500">大小: {content.size}</span>
        </div>
        <pre className="whitespace-pre-wrap break-all text-xs bg-white p-3 rounded border border-gray-200 max-h-32 overflow-hidden">
          {content.preview}
        </pre>
      </div>
    );
  }
  
  if (content.type === 'json') {
    // 大数据 JSON 使用分页
    if (Array.isArray(content.data) && content.data.length > 100) {
      return <PaginatedJSON data={content.data} />;
    }
    if (typeof content.data === 'object' && content.data !== null && !Array.isArray(content.data) && Object.keys(content.data).length > 50) {
      return <PaginatedObject data={content.data} />;
    }
    
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white p-3 rounded border border-gray-200 max-h-96 overflow-auto">
        {JSON.stringify(content.data, null, 2)}
      </pre>
    );
  }
  
  return <code className="text-sm break-all bg-white p-3 rounded border border-gray-200 block whitespace-pre-wrap">{String(content.data)}</code>;
});

ContentRenderer.displayName = 'ContentRenderer';

interface ToolCallWithResult {
  toolCall: NonNullable<AIMessage['tool_calls']>[0];
  toolResult?: ToolMessage;
}

// 单个工具项组件
const ToolCallItem = memo(({ 
  toolCall, 
  toolResult, 
  index 
}: { 
  toolCall: ToolCallWithResult['toolCall']; 
  toolResult?: ToolMessage; 
  index: number;
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  
  const contentSize = useMemo(() => 
    toolResult ? getContentSize(toolResult.content) : 0,
  [toolResult]);

  const isLargeContent = contentSize > LARGE_CONTENT_THRESHOLD;
  
  const argsEntries = toolCall.args ? Object.entries(toolCall.args) : [];
  const hasArgs = argsEntries.length > 0;
  const isLoading = !toolResult;

  // 结果内容处理
  const resultContent = useMemo(() => {
    if (!toolResult) return null;
    
    // 大数据默认折叠
    if (isLargeContent && !showFullContent) {
      const preview = typeof toolResult.content === 'string' 
        ? toolResult.content.slice(0, 300) + (toolResult.content.length > 300 ? '...' : '')
        : '[复杂数据对象，点击展开查看]';
      
      return {
        type: 'large',
        preview,
        size: formatSize(contentSize)
      };
    }

    // 正常处理
    if (typeof toolResult.content === "string") {
      try {
        const parsed = JSON.parse(toolResult.content);
        return { type: 'json', data: parsed };
      } catch {
        return { type: 'text', data: toolResult.content };
      }
    }
    return { type: 'text', data: toolResult.content };
  }, [toolResult, isLargeContent, showFullContent, contentSize]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 bg-white shadow-sm">
      {/* 工具头 */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">
            {toolCall.name}
          </h3>
          {toolCall.id && (
            <code className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-mono">
              ...{toolCall.id.slice(-8)}
            </code>
          )}
        </div>
        {isLargeContent && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
            {resultContent?.size}
          </span>
        )}
      </div>

      {/* 参数表格 */}
      {(hasArgs || isLoading) && (
        <div className="max-h-48 overflow-y-auto border-b border-gray-200">
          {hasArgs ? (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <tbody className="divide-y divide-gray-200">
                {argsEntries.map(([key, value]) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium whitespace-nowrap text-gray-900 w-1/4 text-xs uppercase tracking-wider">
                      {key}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      <ValueCell value={value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div className="px-4 py-3 text-xs text-gray-500 italic flex items-center gap-2">
               <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
               正在接收参数...
             </div>
          )}
        </div>
      )}

      {/* 结果区域 */}
      {toolResult && resultContent && (
        <div className="bg-gray-50">
          <div className="px-4 py-2 text-xs font-semibold text-gray-700 flex justify-between items-center border-b border-gray-200">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              执行结果
            </span>
            {isLargeContent && (
              <button 
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-blue-600 hover:text-blue-800 font-medium text-xs transition-colors"
              >
                {showFullContent ? '折叠内容' : '展开全部'}
              </button>
            )}
          </div>
          <div className="p-3">
            <ContentRenderer content={resultContent} />
          </div>
        </div>
      )}
    </div>
  );
});

ToolCallItem.displayName = 'ToolCallItem';

// 虚拟列表中的行组件
const VirtualRow = memo(({ 
  data, 
  index, 
  style 
}: { 
  data: ToolCallWithResult[]; 
  index: number; 
  style: React.CSSProperties;
}) => {
  const item = data[index];
  return (
    <div style={{ ...style, paddingRight: '8px' }}>
      <ToolCallItem
        toolCall={item.toolCall}
        toolResult={item.toolResult}
        index={index}
      />
    </div>
  );
});

VirtualRow.displayName = 'VirtualRow';

export const ToolCallWithResultSection = memo(({
  toolCalls,
  toolResults,
}: {
  toolCalls: NonNullable<AIMessage['tool_calls']>;
  toolResults: ToolMessage[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 缓存配对结果
  const pairedItems = useMemo(() => {
    const toolResultMap = new Map<string, ToolMessage>();
    toolResults.forEach((res) => {
      if (res.tool_call_id) {
        toolResultMap.set(res.tool_call_id, res);
      }
    });
    
    return toolCalls
      .filter(tc => tc.id != null)
      .map((tc) => ({
        toolCall: tc,
        toolResult: tc.id ? toolResultMap.get(tc.id) : undefined,
      }));
  }, [toolCalls, toolResults]);

  const useVirtualization = pairedItems.length > VIRTUALIZATION_THRESHOLD;

  const isExecuting = useMemo(() => {
    return pairedItems.some(item => !item.toolResult);
  }, [pairedItems]);

  return (
    <div className="w-full my-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center px-4 py-2.5 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
            {pairedItems.length}
          </span>
          <span className={isExecuting ? "animate-pulse font-medium text-blue-700" : ""}>
            {isExecuting ? "工具执行中..." : "工具调用"}
          </span>
          {isExecuting && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
        </div>
        <motion.span 
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pt-2">
          {useVirtualization ? (
            <div className="h-[600px] bg-gray-50 rounded-lg border border-gray-200 p-2">
              {/* @ts-expect-error React-window types mismatch with AutoSizer callback */}
              <AutoSizer>
                {({ height, width }: { height: number; width: number }): React.ReactNode => (
                  <List
                    height={height}
                    itemCount={pairedItems.length}
                    itemSize={250}
                    width={width}
                    itemData={pairedItems}
                  >
                    {VirtualRow}
                  </List>
                )}
              </AutoSizer>
            </div>
          ) : (
            pairedItems.map(({ toolCall, toolResult }, idx) => (
              <ToolCallItem
                key={toolCall.id || idx}
                toolCall={toolCall}
                toolResult={toolResult}
                index={idx}
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
});

ToolCallWithResultSection.displayName = 'ToolCallWithResultSection';

// 保持向后兼容的独立组件
export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="w-full my-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center px-4 py-2.5 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {toolCalls.length}
          </span>
          <span>工具调用</span>
        </div>
        <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
      </button>

      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
          {toolCalls.map((tc, idx) => {
            const args = tc.args as Record<string, any> | undefined;
            const hasArgs = args && Object.keys(args).length > 0;

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {tc.name}
                    {tc.id && (
                      <code className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                        ...{tc.id.slice(-8)}
                      </code>
                    )}
                  </h3>
                </div>
                {hasArgs ? (
                  <div className="max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(args!).map(([key, value]) => (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium whitespace-nowrap text-gray-900 w-1/3 text-xs">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              <ValueCell value={value} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 text-sm text-gray-400 italic">无参数</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentInfo = useMemo(() => {
    let parsedContent: any;
    let isJsonContent = false;
    let size = 0;

    try {
      if (typeof message.content === "string") {
        size = message.content.length;
        parsedContent = JSON.parse(message.content);
        isJsonContent = isComplexValue(parsedContent);
      } else {
        parsedContent = message.content;
        size = JSON.stringify(message.content).length;
      }
    } catch {
      parsedContent = message.content;
      size = String(message.content).length;
    }

    return { parsedContent, isJsonContent, size, isLarge: size > LARGE_CONTENT_THRESHOLD };
  }, [message.content]);

  const displayContent = useMemo(() => {
    if (contentInfo.isLarge && !isExpanded) {
      return {
        type: 'preview',
        data: typeof message.content === 'string' 
          ? message.content.slice(0, 500) + '...'
          : '[大数据内容，点击展开]'
      };
    }
    
    if (contentInfo.isJsonContent) {
      if (Array.isArray(contentInfo.parsedContent) && contentInfo.parsedContent.length > 100) {
        return { type: 'paginated-array', data: contentInfo.parsedContent };
      }
      if (typeof contentInfo.parsedContent === 'object' && Object.keys(contentInfo.parsedContent).length > 50) {
        return { type: 'paginated-object', data: contentInfo.parsedContent };
      }
      return { 
        type: 'json', 
        data: JSON.stringify(contentInfo.parsedContent, null, 2) 
      };
    }
    
    return { type: 'text', data: String(message.content) };
  }, [contentInfo, isExpanded, message.content]);

  return (
    <div className="w-full my-2">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 text-sm">工具执行结果</h3>
              {contentInfo.isLarge && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {formatSize(contentInfo.size)}
                </span>
              )}
            </div>
            {message.tool_call_id && (
              <code className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-mono">
                ...{message.tool_call_id.slice(-8)}
              </code>
            )}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50">
          {displayContent.type === 'paginated-array' ? (
            <PaginatedJSON data={displayContent.data} />
          ) : displayContent.type === 'paginated-object' ? (
            <PaginatedObject data={displayContent.data} />
          ) : displayContent.type === 'json' ? (
            <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white p-3 rounded border border-gray-200 max-h-96 overflow-auto">
              {displayContent.data}
            </pre>
          ) : (
            <div className="bg-white p-3 rounded border border-gray-200">
              <code className="text-sm break-all whitespace-pre-wrap block">
                {displayContent.data}
              </code>
            </div>
          )}
          
          {contentInfo.isLarge && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 w-full py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center justify-center gap-1"
            >
              {isExpanded ? (
                <>收起 <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>展开全部 ({formatSize(contentInfo.size)}) <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
