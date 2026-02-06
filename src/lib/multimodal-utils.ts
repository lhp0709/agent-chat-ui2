import type { Base64ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";
import { SUPPORTED_FILE_TYPES } from "@/hooks/use-file-upload"

// 定义新的内容块类型，包含 URL
interface MixedContentBlock {
  type: "image" | "file";
  mime_type: string;
  url: string;         // 服务器 URL
  // data: string;        // Base64 数据
  metadata: {
    name?: string;     // 图片名称
    filename?: string; // PDF 文件名
    size?: number;     // 文件大小
  };
}

// 组合类型，支持URL
export type ContentBlock = MixedContentBlock;

// Returns a Promise of a typed multimodal block for images or PDFs (using server URL and keeping Base64)
export async function fileToContentBlock(
  file: File,
): Promise<MixedContentBlock> {
  
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    toast.error(
      `Unsupported file type: ${file.type}. Supported types are: ${SUPPORTED_FILE_TYPES.join(", ")}`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  // 首先将文件转换为 Base64
  const base64Data = await fileToBase64(file);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    

  try {
    // 创建 FormData 对象来发送文件
    const formData = new FormData();
    formData.append("file", file);

    // 发送 POST 请求到服务器
    const response = await fetch(`${apiBaseUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    
    // 从服务器响应中获取文件信息
    const { file_type, filename, url, size } = result;

    // 根据文件类型返回相应的内容块结构，同时包含 URL 和 Base64 数据
    if (SUPPORTED_FILE_TYPES.includes(file.type) && file_type.startsWith("image/")) {
      return {
        type: "image",
        mime_type: file_type,
        url,       // 服务器返回的 URL
        // data: base64Data, // 保留的 Base64 数据
        metadata: { 
          name: filename, // 图片名称
          size,           // 文件大小
        },
      };
    } else if (SUPPORTED_FILE_TYPES.includes(file.type )) {
      return {
        type: "file",
        mime_type: file_type,
        url,       // 服务器返回的 URL
        // data: base64Data, // 保留的 Base64 数据
        metadata: { 
          filename, // PDF 文件名
          size,     // 文件大小
        },
      };
    } else {
      // 理论上不应该到达这里，因为前面已有类型检查
      throw new Error(`Unexpected file type after validation: ${file.type}`);
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    toast.error(`Failed to upload file: ${error}`);
    // 即使上传失败，也可以返回仅包含 Base64 的块，但这可能不符合你的业务逻辑
    // 或者直接拒绝 Promise
    return Promise.reject(error);
  }
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Type guard for the new MixedContentBlock
export function isMixedContentBlock(block: unknown): block is MixedContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block)) {
    return false;
  }
  
  const typedBlock = block as MixedContentBlock;
  

  // Check required fields exist
  if (!("url" in typedBlock) || typeof typedBlock.url !== "string") return false;
  // if (!("data" in typedBlock) || typeof typedBlock.data !== "string") return false;
  if (!("mime_type" in typedBlock) || typeof typedBlock.mime_type !== "string") return false;
  
  // Validate based on type
  if (typedBlock.type === "image") {
    return typedBlock.mime_type.startsWith("image/");
  }
  
  if (typedBlock.type === "file") {
    return SUPPORTED_FILE_TYPES.includes(typedBlock.mime_type);
  }
  
  return false;
}

// Updated type guard that checks for all types
export function isContentBlock(block: unknown): block is ContentBlock {
  return isMixedContentBlock(block);
}

// Keep the original Base64 type guard as well
export function isBase64ContentBlock(
  block: unknown,
): block is Base64ContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  // file type (legacy)
  if (
    (block as { type: unknown }).type === "file" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    ((block as { mime_type: string }).mime_type.startsWith("image/") ||
      (block as { mime_type: string }).mime_type === "application/pdf")
  ) {
    return true;
  }
  // image type (new)
  if (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/")
  ) {
    return true;
  }
  return false;
}