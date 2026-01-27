import React from "react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { MultimodalPreview } from "./MultimodalPreview";
import { cn } from "@/lib/utils";
import { ContentBlock } from "@/lib/multimodal-utils"; // Import the new type

interface ContentBlocksPreviewProps {
  blocks: ContentBlock[]; // Update the type here to support both base64 and url
  onRemove: (idx: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Renders a preview of content blocks with optional remove functionality.
 * Uses cn utility for robust class merging.
 */
export const ContentBlocksPreview: React.FC<ContentBlocksPreviewProps> = ({
  blocks,
  onRemove,
  size = "lg",
  className,
}) => {
  if (!blocks.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2 p-3.5 pb-0", className)}>
      {blocks.map((block, idx) => (
        <MultimodalPreview
          key={idx}
          block={block} // This will now work with both Base64ContentBlock and UrlContentBlock
          removable
          onRemove={() => onRemove(idx)}
          size={size}
        />
      ))}
    </div>
  );
};