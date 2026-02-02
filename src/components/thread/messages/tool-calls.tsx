import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState,useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}


interface ToolCallWithResult {
  toolCall: NonNullable<AIMessage['tool_calls']>[0];
  toolResult?: ToolMessage;
}

export function ToolCallWithResultSection({
  toolCalls,
  toolResults,
}: {
  toolCalls: NonNullable<AIMessage['tool_calls']>;
  toolResults: ToolMessage[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 构建映射：tool_call_id -> ToolMessage
  const toolResultMap = new Map<string, ToolMessage>();
  toolResults.forEach((res) => {
    if (res.tool_call_id) {
      toolResultMap.set(res.tool_call_id, res);
    }
  });
  // 过滤掉 id 为 null 或 undefined 的 toolCall，并缓存结果
  const validToolCalls = useMemo(() => {
    return toolCalls.filter(tc => tc.id != null); // tc.id != null 同时排除了 null 和 undefined
  }, [toolCalls]);

  // 配对
  const pairedItems: ToolCallWithResult[] = validToolCalls.map((tc) => ({
    toolCall: tc,
    toolResult: tc.id ? toolResultMap.get(tc.id) : undefined,
  }));
  console.log("工具调用情况:",pairedItems)
  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="tool-call-result-section"
      >
        <span>工具调用 ({pairedItems.length} 项)</span>
        <span className="ml-2">{isExpanded ? '▲' : '▼'}</span>
      </button>

      <div
        id="tool-call-result-section"
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
        style={{ maxHeight: isExpanded ? '1000px' : '0' }}
      >
        <div className="space-y-3">
          {pairedItems.map(({ toolCall, toolResult }, idx) => (
            <div key={toolCall.id || idx} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* 工具调用部分 */}
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">
                  {toolCall.name}
                  {toolCall.id && (
                    <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                      {toolCall.id}
                    </code>
                  )}
                </h3>
              </div>

              {/* 工具参数 */}
              {toolCall.args ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(toolCall.args).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {isComplexValue(value) ? (
                            <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                              {JSON.stringify(value, null, 2)}
                            </code>
                          ) : (
                            String(value)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <code className="block p-3 text-sm">{"{}"}</code>
              )}

              {/* 工具结果（如果有） */}
              {toolResult && (
                <div className="mt-2 border-t border-gray-200 pt-2">
                  <div className="bg-gray-50 px-4 py-1 text-xs font-medium text-gray-600">
                    工具执行结果
                  </div>
                  <div className="p-3 bg-gray-100">
                    {(() => {
                      let content = toolResult.content;
                      try {
                        if (typeof content === 'string') {
                          const parsed = JSON.parse(content);
                          if (isComplexValue(parsed)) {
                            return (
                              <code className="block font-mono text-sm break-all">
                                {JSON.stringify(parsed, null, 2)}
                              </code>
                            );
                          }
                        }
                      } catch {}
                      return <code className="block text-sm">{String(content)}</code>;
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      {/* 折叠控制按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="tool-calls-content"
      >
        <span>
          工具调用 ({toolCalls.length} 项)
        </span>
        <span className="ml-2">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* 可折叠内容区域 */}
      <div
        id="tool-calls-content"
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
        style={{ maxHeight: isExpanded ? '600px' : '0' }}
      >
        <div className="grid grid-rows-[1fr_auto] gap-2">
          {toolCalls.map((tc, idx) => {
            const args = tc.args as Record<string, any> | undefined;
            const hasArgs = args && Object.keys(args).length > 0;

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border border-gray-200"
              >
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <h3 className="font-medium text-gray-900">
                    {tc.name}
                    {tc.id && (
                      <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                        {tc.id}
                      </code>
                    )}
                  </h3>
                </div>
                {hasArgs ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(args!).map(([key, value], argIdx) => (
                        <tr key={argIdx}>
                          <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                            {key}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {isComplexValue(value) ? (
                              <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                                {JSON.stringify(value, null, 2)}
                              </code>
                            ) : (
                              String(value)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <code className="block p-3 text-sm">{"{}"}</code>
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

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;
  const displayedContent =
    shouldTruncate && !isExpanded
      ? contentStr.length > 500
        ? contentStr.slice(0, 500) + "..."
        : contentLines.slice(0, 4).join("\n") + "\n..."
      : contentStr;

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {message.name ? (
              <h3 className="font-medium text-gray-900">
                Tool Result:{" "}
                <code className="rounded bg-gray-100 px-2 py-1">
                  {message.name}
                </code>
              </h3>
            ) : (
              <h3 className="font-medium text-gray-900">Tool Result</h3>
            )}
            {message.tool_call_id && (
              <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                {message.tool_call_id}
              </code>
            )}
          </div>
        </div>
        <motion.div
          className="min-w-full bg-gray-100"
          initial={false}
          animate={{ height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3">
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.div
                key={isExpanded ? "expanded" : "collapsed"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {isJsonContent ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {(Array.isArray(parsedContent)
                        ? isExpanded
                          ? parsedContent
                          : parsedContent.slice(0, 5)
                        : Object.entries(parsedContent)
                      ).map((item, argIdx) => {
                        const [key, value] = Array.isArray(parsedContent)
                          ? [argIdx, item]
                          : [item[0], item[1]];
                        return (
                          <tr key={argIdx}>
                            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {isComplexValue(value) ? (
                                <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                                  {JSON.stringify(value, null, 2)}
                                </code>
                              ) : (
                                String(value)
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <code className="block text-sm">{displayedContent}</code>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {((shouldTruncate && !isJsonContent) ||
            (isJsonContent &&
              Array.isArray(parsedContent) &&
              parsedContent.length > 5)) && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 py-2 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-600"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
