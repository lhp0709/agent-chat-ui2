import React from "react";
import { File, Image as ImageIcon, X as XIcon } from "lucide-react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ContentBlock } from "@/lib/multimodal-utils";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css'; // 导入样式
import { SUPPORTED_FILE_TYPES } from "@/hooks/use-file-upload"

export interface MultimodalPreviewProps {
  block: ContentBlock;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}
interface DownloadLinkProps {
  url: string;
  filename: string;
  children: React.ReactNode;
}

export const DownloadLink : React.FC<DownloadLinkProps>  = ({ url, filename, children }) => {
  const handleDownload = async (e:React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // 如果 fetch 失败，回退到普通链接
      window.open(url, '_blank');
    }
  };

  return (
    <a 
      href="#"
      onClick={handleDownload}
      className="text-blue-500 underline text-xs"
    >
      {children}
    </a>
  );
};


export const MultimodalPreview: React.FC<MultimodalPreviewProps> = ({
  block,
  removable = false,
  onRemove,
  className,
  size = "lg",
}) => {
    // Handle Mixed image blocks (use Base64 for preview)
  if (
    block.type === "image" &&
    typeof block.mime_type === "string" &&
    block.mime_type.startsWith("image/") 
  ) {
    const url = block.url;
    let imgClass: string = "rounded-md object-cover h-16 w-16 text-lg";
    if (size === "sm") imgClass = "rounded-md object-cover h-10 w-10 text-base";
    if (size === "lg") imgClass = "rounded-md object-cover h-24 w-24 text-xl";
    return (
      <div className={cn("relative inline-block", className)}>
        <Zoom>
          <img
            src={url} // Use url for preview
            alt={String(block.metadata?.name || "uploaded image")}
            className={imgClass}
            width={size === "sm" ? 16 : size === "md" ? 32 : 48}
            height={size === "sm" ? 16 : size === "md" ? 32 : 48}
          />
          {removable && (
            <button
              type="button"
              className="absolute top-1 right-1 z-10 rounded-full bg-gray-500 text-white hover:bg-gray-700"
              onClick={onRemove}
              aria-label="Remove image"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </Zoom>
        
      </div>
    );
  }


  // Handle Mixed PDF blocks (show filename and potentially a link to server URL)
  if (
    block.type === "file" &&
    SUPPORTED_FILE_TYPES.includes(block.mime_type) &&
    typeof block.url === "string" // Ensure URL exists for download/link
  ) {
    const filename =
      block.metadata?.filename || block.metadata?.name || "undifine file";
    return (
      <div
        className={cn(
          "relative flex items-start gap-2 rounded-md border bg-gray-100 px-3 py-2",
          className,
        )}
      >
        <div className="flex flex-shrink-0 flex-col items-start justify-start">
          <File
            className={cn(
              "text-teal-700",
              size === "sm" ? "h-5 w-5" : "h-7 w-7",
            )}
          />
        </div>
        <span
          className={cn("min-w-0 flex-1 text-sm break-all text-gray-800")}
          style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}
        >
          {String(filename)}
          {/* Optional: Add a link to the server URL for downloading/opening */}
          <br />
          {/* <a 
            href={block.url} 
            // target="_blank" 
            // rel="noopener noreferrer"
            className="text-blue-500 underline text-xs"
            download={filename}
          >
            Open File
          </a> */}
          <DownloadLink url={block.url} filename={filename}>
            下载文件
          </DownloadLink>
        </span>
        {removable && (
          <button
            type="button"
            className="ml-2 self-start rounded-full bg-gray-200 p-1 text-teal-700 hover:bg-gray-300"
            onClick={onRemove}
            aria-label="Remove PDF"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-gray-100 px-3 py-2 text-gray-500",
        className,
      )}
    >
      <File className="h-5 w-5 flex-shrink-0" />
      <span className="truncate text-xs">Unsupported file type</span>
      {removable && (
        <button
          type="button"
          className="ml-2 rounded-full bg-gray-200 p-1 text-gray-500 hover:bg-gray-300"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};