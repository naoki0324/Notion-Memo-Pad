"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, Plus, Copy, Check, Trash2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

const STORAGE_KEY = "notion_memo_pads";

export default function NotionMemoApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [memoPads, setMemoPads] = useState([]);
  const [selectedMemoId, setSelectedMemoId] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Load memos from localStorage
  const loadMemos = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const memos = stored ? JSON.parse(stored) : [];
      setMemoPads(memos);
      setIsLoading(false);

      // Select first memo if available
      if (memos.length > 0 && !selectedMemoId) {
        setSelectedMemoId(memos[0].id);
        setEditorContent(memos[0].content);
      }
    } catch (error) {
      console.error("Error loading memos:", error);
      setIsLoading(false);
    }
  };

  // Save memos to localStorage
  const saveMemos = (memos) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    } catch (error) {
      console.error("Error saving memos:", error);
      alert("メモの保存に失敗しました");
    }
  };

  // Load memos on component mount
  useEffect(() => {
    loadMemos();
  }, []);

  const selectedMemo = memoPads.find((memo) => memo.id === selectedMemoId);
  const currentIndex = memoPads.findIndex((memo) => memo.id === selectedMemoId);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (
      selectedMemoId &&
      selectedMemo &&
      editorContent !== selectedMemo.content
    ) {
      const updatedMemos = memoPads.map((memo) =>
        memo.id === selectedMemoId
          ? {
              ...memo,
              content: editorContent,
              title: getFirstLine(editorContent),
              updated_at: new Date().toISOString(),
            }
          : memo,
      );
      setMemoPads(updatedMemos);
      saveMemos(updatedMemos);
    }
  }, [selectedMemoId, editorContent, selectedMemo, memoPads]);

  // Set up auto-save with debouncing
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(autoSave, 500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorContent]);

  // Load selected memo content into editor
  useEffect(() => {
    if (selectedMemo) {
      setEditorContent(selectedMemo.content);
      setIsEditing(false);
    }
  }, [selectedMemo]);

  const handleCreateMemo = () => {
    const newMemo = {
      id: Date.now().toString(),
      title: "無題",
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedMemos = [newMemo, ...memoPads];
    setMemoPads(updatedMemos);
    setSelectedMemoId(newMemo.id);
    setEditorContent("");
    setIsEditing(true);
    saveMemos(updatedMemos);

    // Focus textarea after creating new memo
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleSelectMemo = (memo) => {
    // Save current memo before switching
    if (
      selectedMemoId &&
      selectedMemo &&
      editorContent !== selectedMemo.content
    ) {
      const updatedMemos = memoPads.map((m) =>
        m.id === selectedMemoId
          ? {
              ...m,
              content: editorContent,
              title: getFirstLine(editorContent),
              updated_at: new Date().toISOString(),
            }
          : m,
      );
      setMemoPads(updatedMemos);
      saveMemos(updatedMemos);
    }
    setSelectedMemoId(memo.id);
  };

  const handleDeleteMemo = (id, e) => {
    e.stopPropagation();

    const updatedMemos = memoPads.filter((memo) => memo.id !== id);
    setMemoPads(updatedMemos);
    saveMemos(updatedMemos);

    // Clear selection if the deleted memo was selected
    if (selectedMemoId === id) {
      if (updatedMemos.length > 0) {
        setSelectedMemoId(updatedMemos[0].id);
        setEditorContent(updatedMemos[0].content);
      } else {
        setSelectedMemoId(null);
        setEditorContent("");
      }
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert("クリップボードへのコピーに失敗しました");
    }
  };

  const handleTextareaChange = (e) => {
    setEditorContent(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      textareaRef.current?.blur();
      return;
    }

    if (e.key === "Enter") {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const value = textarea.value;

      // Get the current line
      const lines = value.substring(0, start).split("\n");
      const currentLine = lines[lines.length - 1];

      // Check if current line starts with bullet point
      const bulletMatch = currentLine.match(/^(\s*- )/);

      if (bulletMatch) {
        e.preventDefault();

        // If the line only contains "- " (and optional whitespace), remove the bullet
        if (currentLine.trim() === "-") {
          const lineStart = start - currentLine.length;
          const newValue =
            value.substring(0, lineStart) + value.substring(start);
          setEditorContent(newValue);

          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        // Otherwise, add a new bullet point
        const indent = bulletMatch[1];
        const newValue =
          value.substring(0, start) + "\n" + indent + value.substring(start);
        setEditorContent(newValue);

        setTimeout(() => {
          const newPosition = start + indent.length + 1;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    }
  };

  const getFirstLine = (content) => {
    const firstLine = content.split("\n")[0]?.trim();
    if (!firstLine) return "無題";

    // Strip markdown formatting for clean title display
    let cleanLine = firstLine;

    // Remove heading markers
    cleanLine = cleanLine.replace(/^#{1,3}\s+/, "");

    // Convert bullet points from - to •
    cleanLine = cleanLine.replace(/^-\s+/, "• ");

    return cleanLine || "無題";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#121212]">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 bg-[#F9FAFC] dark:bg-[#1E1E1E] border-r border-[#E5E7EB] dark:border-[#2A2A2A] overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-[800] text-[20px] text-[#111318] dark:text-white">
                Notion メモ
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateMemo}
                  className="flex items-center gap-2 px-3 py-2 bg-[#0070FF] hover:bg-[#005ECC] text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  {memoPads.length > 0 && (
                    <span className="text-sm font-medium">
                      {currentIndex + 1}/{memoPads.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Memo List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-[#6B7280] dark:text-[#9CA3AF]">
                メモを読み込み中...
              </div>
            ) : memoPads.length === 0 ? (
              <div className="p-4 text-center text-[#6B7280] dark:text-[#9CA3AF]">
                まだメモがありません。＋をクリックして作成しましょう！
              </div>
            ) : (
              <div className="p-2">
                {memoPads.map((memo) => (
                  <div
                    key={memo.id}
                    onClick={() => handleSelectMemo(memo)}
                    className={`group p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMemoId === memo.id
                        ? "bg-[#0070FF] text-white"
                        : "bg-white dark:bg-[#2A2A2A] hover:bg-[#F3F4F6] dark:hover:bg-[#353535] text-[#111318] dark:text-[#E5E7EB]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={16} className="flex-shrink-0" />
                          <h3 className="font-[600] text-[14px] truncate">
                            {getFirstLine(memo.content)}
                          </h3>
                        </div>
                        <p className="text-[12px] opacity-70">
                          {formatDate(memo.updated_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteMemo(memo.id, e)}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all ${
                          selectedMemoId === memo.id
                            ? "text-white"
                            : "text-red-500"
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b border-[#E5E7EB] dark:border-[#2A2A2A] bg-white dark:bg-[#121212] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
            >
              <Menu size={20} className="text-[#111318] dark:text-[#E5E7EB]" />
            </button>
            <h2 className="font-[600] text-[16px] text-[#111318] dark:text-[#E5E7EB]">
              {selectedMemo
                ? getFirstLine(selectedMemo.content)
                : "メモを選択してください"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {selectedMemo && (
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 px-3 py-2 bg-[#0070FF] hover:bg-[#005ECC] text-white rounded-lg transition-colors"
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                <span className="text-[14px] font-[500]">
                  {copySuccess ? "コピーしました！" : "コピー"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Unified Editor */}
        <div className="flex-1 relative">
          {selectedMemo ? (
            <div className="h-full relative">
              {/* Editor Textarea */}
              <textarea
                ref={textareaRef}
                value={editorContent}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
                className={`absolute inset-0 w-full h-full resize-none outline-none text-[16px] leading-[1.6] font-mono bg-transparent text-[#111318] dark:text-[#E5E7EB] border-none p-6 z-10 ${
                  isEditing ? "opacity-70" : "opacity-0"
                }`}
                style={{
                  transition: "opacity 0.2s ease",
                }}
                placeholder="# タイトル

## サブタイトル

- 箇条書き1
- 箇条書き2
  - ネストした箇条書き

1. 番号付きリスト
2. 2番目の項目

**太字** や *斜体*、`コード`、~~取り消し線~~ などのMarkdownが使えます。

> 引用テキスト

---

メモをここに書き始めてください..."
              />

              {/* Rendered Preview */}
              <div
                className={`absolute inset-0 p-6 overflow-y-auto bg-white dark:bg-[#121212] transition-opacity duration-200 ${
                  isEditing ? "opacity-30 pointer-events-none" : "opacity-100"
                }`}
                onClick={() => {
                  setIsEditing(true);
                  setTimeout(() => textareaRef.current?.focus(), 0);
                }}
              >
                <div className="prose prose-lg max-w-none dark:prose-invert cursor-text">
                  {editorContent.trim() ? (
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold mb-4 text-[#111318] dark:text-white">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold mb-3 text-[#1F2937] dark:text-gray-200">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-medium mb-2 text-[#374151] dark:text-gray-300">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4 leading-relaxed text-[#111318] dark:text-gray-200">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-4 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-4 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-[#111318] dark:text-gray-200">
                            {children}
                          </li>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400 mb-4">
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic">{children}</em>
                        ),
                      }}
                    >
                      {editorContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-gray-400 italic">
                      クリックして書き始めてください...
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Mode Hint */}
              {isEditing && (
                <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm z-20">
                  Escで終了 • クリックして戻る • Enterで箇条書き継続
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#6B7280] dark:text-[#9CA3AF] text-center">
              <div>
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-[18px] font-[600] mb-2">
                  Notion メモへようこそ
                </h3>
                <p className="text-[14px]">
                  サイドバーからメモを選択するか、新しいメモを作成して始めましょう。
                  <br />
                  リアルタイムでMarkdownが表示される統合エディターです。
                  <br />
                  「- 」で始まる行でEnterを押すと自動で箇条書きが続きます。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
