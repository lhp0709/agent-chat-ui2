"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function KnowledgePage() {
  const openRagflow = () => {
    window.open(`${process.env.NEXT_PUBLIC_RAGFLOW_API_URL}/datasets`, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">知识库管理平台</h2>
        <p className="text-gray-600">
          知识库管理平台由 RAGFlow 提供，请点击下方按钮前往 RAGFlow 进行管理。
        </p>
        <Button onClick={openRagflow} className="gap-2">
          前往 RAGFlow <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
