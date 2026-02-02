export default function KnowledgePage() {
  return (
    <>
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden p-6">
            <h1 className="text-xl font-bold mb-4 shrink-0">知识库</h1>
            <div className="flex-1 min-h-0 overflow-auto">
                {/* 知识库内容 */}
            </div>
        </div>
    </>
  );
}