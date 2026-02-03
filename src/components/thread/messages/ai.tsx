// ai.tsx
import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import { AIMessage, ToolMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolCallWithResultSection } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment, useMemo } from "react";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent, artifact }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

function parseStandardStreamedToolCalls(
  message: AIMessage
): AIMessage["tool_calls"] | undefined {
  const chunks = (message as any).tool_call_chunks;
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return undefined;
  }

  const toolCallsMap = new Map<number, { name: string; args: string; id: string }>();

  for (const chunk of chunks) {
    const index = chunk.index ?? 0;
    if (!toolCallsMap.has(index)) {
      toolCallsMap.set(index, { name: "", args: "", id: "" });
    }
    const current = toolCallsMap.get(index)!;
    if (chunk.name) current.name += chunk.name;
    if (chunk.args) current.args += chunk.args;
    if (chunk.id) current.id += chunk.id;
  }

  return Array.from(toolCallsMap.values()).map((tc) => {
    let json: Record<string, any> = {};
    if (tc.args) {
      try {
        json = parsePartialJson(tc.args) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: tc.name,
      id: tc.id,
      args: json,
      type: "tool_call",
    };
  });
}

interface InterruptProps {
  interruptValue?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interruptValue,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  return (
    <>
      {isAgentInboxInterruptSchema(interruptValue) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ThreadView interrupt={interruptValue} />
        )}
      {interruptValue &&
      !isAgentInboxInterruptSchema(interruptValue) &&
      (isLastMessage || hasNoAIOrToolMessages) ? (
        <GenericInterruptView interrupt={interruptValue} />
      ) : null}
    </>
  );
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;

  const standardStreamedToolCalls = useMemo(() => {
    if (hasAnthropicToolCalls || !message || message.type !== "ai") return undefined;
    return parseStandardStreamedToolCalls(message as AIMessage);
  }, [message, hasAnthropicToolCalls]);

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  // hasAnthropicToolCalls moved up
  const isToolResult = message?.type === "tool";

  // 优化：预先构建 toolResults 数组，避免在子组件中重复计算
  const relevantToolResults = useMemo(() => {
    if (hideToolCalls) return [];
    if (!hasToolCalls && !hasAnthropicToolCalls) return [];
    
    const currentToolCalls = hasAnthropicToolCalls 
      ? anthropicStreamedToolCalls 
      : (standardStreamedToolCalls ?? (message?.type === "ai" ? (message as AIMessage).tool_calls : undefined));
      
    if (!currentToolCalls) return [];

    const toolCallIds = new Set(currentToolCalls.map(tc => tc.id).filter(Boolean));
    
    return thread.messages.filter(
      (m): m is ToolMessage => 
        m.type === "tool" && 
        !!m.tool_call_id && 
        toolCallIds.has(m.tool_call_id)
    );
  }, [
    thread.messages, 
    hideToolCalls, 
    hasToolCalls, 
    hasAnthropicToolCalls, 
    anthropicStreamedToolCalls, 
    standardStreamedToolCalls,
    (message?.type === "ai" ? (message as AIMessage).tool_calls : undefined)
  ]);

  if (isToolResult && hideToolCalls) {
    return null;
  }

  return (
    <div className="group mr-auto flex items-start gap-2 w-full">
      <div className="flex flex-col gap-2 w-full max-w-full">
        {isToolResult ? (
          <>
            <Interrupt
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
          </>
        ) : (
          <>
            {contentString.length > 0 && (
              <div className="py-1 prose dark:prose-invert max-w-none">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {!hideToolCalls && (hasToolCalls || hasAnthropicToolCalls) && hasToolCalls && (
              <ToolCallWithResultSection
                toolCalls={
                  hasAnthropicToolCalls
                    ? anthropicStreamedToolCalls!
                    : (standardStreamedToolCalls ?? message!.tool_calls!)
                }
                toolResults={relevantToolResults}
              />
            )}

            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
            <Interrupt
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            <div
              className={cn(
                "mr-auto flex items-center gap-2 transition-opacity",
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={(branch) => thread.setBranch(branch)}
                isLoading={isLoading}
              />
              <CommandBar
                content={contentString}
                isLoading={isLoading}
                isAiMessage={true}
                handleRegenerate={() => handleRegenerate(parentCheckpoint)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-2">
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
      </div>
    </div>
  );
}