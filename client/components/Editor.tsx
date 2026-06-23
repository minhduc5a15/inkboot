'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import SearchAndReplace from '@sereneinserenade/tiptap-search-and-replace';
import { useDebouncedCallback } from 'use-debounce';
import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import type { Editor as EditorType } from '@tiptap/react';
import {
  Bold,
  Italic,
  List,
  Save,
  CloudCheck,
  Loader2,
  History,
  Minimize,
  Users,
  Globe,
  Search as SearchIcon,
  MapPin,
  Shield,
  ScrollText,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { useFocus } from '@/lib/focus-context';
import { toast } from 'sonner';
import { ChapterVersion, WorldEntity } from '@/types';

interface EditorProps {
  id: string;
  novelId: string;
  initialContent?: string;
  title: string;
  order: number;
  characters: Array<
    Record<string, unknown> & { id: string; name: string; appearance?: string }
  >;
}

export default function Editor({
  id,
  novelId,
  initialContent,
  title,
  order,
  characters,
}: EditorProps) {
  const { isFocusMode, toggleFocusMode } = useFocus();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>(
    'saved'
  );
  const [wordCount, setWordCount] = useState(0);
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [worldEntities, setWorldEntities] = useState<WorldEntity[]>([]);
  const [worldSearch, setWorldSearch] = useState('');

  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [searchResultIndex, setSearchResultIndex] = useState(0);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [renderedPreview, setRenderedPreview] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearchReplace((prev) => !prev);
      }
      if (e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'π')) {
        e.preventDefault();
        setIsPreviewMode((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchWorldEntities = useCallback(async () => {
    try {
      const res = await fetch(
        `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000'}/world/novel/${novelId}`
      );
      const data = await res.json();
      setWorldEntities(data);
    } catch {
      console.error('Failed to fetch world entities');
    }
  }, [novelId]);

  const calculateStats = (editor: EditorType) => {
    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(
        `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000'}/chapters/${id}/versions`
      );
      const data = await res.json();
      setVersions(data);
    } catch {
      console.error('Failed to fetch versions');
    }
  }, [id]);

  const saveSnapshot = async () => {
    if (!editor) return;
    try {
      const content = JSON.stringify(editor.getJSON());
      const res = await fetch(
        `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000'}/chapters/${id}/versions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      if (res.ok) {
        toast.success('Đã lưu phiên bản mới');
        fetchVersions();
      }
    } catch {
      toast.error('Không thể lưu bản nháp');
    }
  };

  const restoreVersion = async (versionId: string, versionContent: string) => {
    try {
      const response = await fetch(
        `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000'}/chapters/${id}/restore`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionId }),
        }
      );

      if (response.ok) {
        const content = JSON.parse(versionContent);
        editor?.commands.setContent(content);
        setSaveStatus('saved');
        toast.success('Đã khôi phục thành công');
      }
    } catch {
      toast.error('Lỗi khi khôi phục');
    }
  };

  const debouncedSave = useDebouncedCallback(async (content: string) => {
    setSaveStatus('saving');
    try {
      const response = await fetch(
        `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000'}/chapters/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      if (!response.ok) throw new Error('Failed to save');
      setSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
    }
  }, 2000);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorldEntities();
  }, [fetchWorldEntities]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Bắt đầu câu chuyện của bạn...',
      }),
      SearchAndReplace.configure({
        searchResultClass: 'search-result',
      }),
    ],
    content: (() => {
      if (!initialContent) return '';
      try {
        return JSON.parse(initialContent);
      } catch {
        return '';
      }
    })(),
    editorProps: {
      attributes: {
        class:
          'prose prose-lg focus:outline-none max-w-none font-serif text-[19px] leading-[1.8] text-[#c0c0c0] transition-all duration-500 prose-invert text-justify',
      },
    },
    onUpdate: ({ editor }) => {
      calculateStats(editor);
      const json = JSON.stringify(editor.getJSON());
      debouncedSave(json);
    },
    onTransaction: ({ editor }) => {
      calculateStats(editor);
      const storage = editor.storage as unknown as Record<string, unknown>;
      const searchStorage = storage.searchAndReplace as { results: unknown[]; resultIndex: number } | undefined;
      if (searchStorage) {
        setSearchResultCount(searchStorage.results.length);
        setSearchResultIndex(searchStorage.resultIndex);
      }
    },
  });

  useEffect(() => {
    if (isPreviewMode && editor) {
      const rawText = editor.getText();
      // Parse markdown to HTML
      const html = marked.parse(rawText);
      // marked.parse can return a promise if async options are used, but since we didn't pass any, it returns string.
      // We can use Promise.resolve to handle it safely or cast if we know it's a string, or resolve it.
      Promise.resolve(html).then((res) => {
        setRenderedPreview(res);
      });
    }
  }, [isPreviewMode, editor]);

  useEffect(() => {
    if (!editor) return;
    if (showSearchReplace) {
      editor.commands.setCaseSensitive(caseSensitive);
      editor.commands.setSearchTerm(searchTerm);
      editor.commands.setReplaceTerm(replaceTerm);
    } else {
      editor.commands.setSearchTerm('');
    }
  }, [searchTerm, replaceTerm, caseSensitive, showSearchReplace, editor]);

  useEffect(() => {
    if (searchResultCount > 0) {
      const currentResult = document.querySelector('.search-result-current');
      if (currentResult) {
        currentResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResultIndex, searchResultCount, searchTerm]);

  if (!editor) return null;

  return (
    <div
      className={`flex-1 overflow-y-auto px-6 md:px-20 pt-12 pb-32 flex justify-center transition-all duration-700 ${isFocusMode ? 'pt-[15vh]' : ''}`}
    >
      {/* Search & Replace Widget */}
      <AnimatePresence>
        {showSearchReplace && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 right-8 z-[200] bg-zinc-900 border border-zinc-800 shadow-xl rounded-md p-2 w-[400px] flex flex-col gap-2"
          >
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Find..."
                  className="w-full bg-zinc-950 text-sm text-[#d4d4d4] px-2 py-1.5 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <button
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800 flex items-center justify-center h-6 w-6 transition-colors ${caseSensitive ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 border border-transparent'}`}
                  title="Match Case"
                >
                  <span className="font-serif italic text-xs font-semibold leading-none">Aa</span>
                </button>
              </div>
              {searchTerm && (
                <span className="text-xs text-zinc-500 px-1 whitespace-nowrap min-w-[70px] text-center">
                  {searchResultCount > 0 ? `${searchResultIndex + 1} of ${searchResultCount}` : 'No results'}
                </span>
              )}
              <button
                onClick={() => editor?.commands.previousSearchResult()}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Previous Match"
              >
                <ArrowUp size={16} />
              </button>
              <button
                onClick={() => editor?.commands.nextSearchResult()}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Next Match"
              >
                <ArrowDown size={16} />
              </button>
              <button
                onClick={() => setShowSearchReplace(false)}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded ml-1 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replace"
                className="flex-1 bg-zinc-950 text-sm text-[#d4d4d4] px-2 py-1.5 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                onClick={() => editor?.commands.replace()}
                className="p-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded font-medium px-3 transition-colors"
                title="Replace"
              >
                Replace
              </button>
              <button
                onClick={() => editor?.commands.replaceAll()}
                className="p-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded font-medium px-3 transition-colors"
                title="Replace All"
              >
                All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lumina-style Focus Mode Exit */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleFocusMode}
            className="absolute top-8 right-8 p-2.5 rounded-full bg-[#ffffff1a] text-zinc-400 hover:text-white hover:bg-[#ffffff2a] transition-colors z-[150] backdrop-blur-md border border-zinc-700/50"
            title="Exit Focus Mode"
          >
            <Minimize size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="max-w-2xl w-full">
        {/* Unified Header & Toolbar */}
        <header className="mb-6 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold">
              Chương {order}
            </span>
            <input
              type="text"
              readOnly
              value={title}
              className="w-full bg-transparent border-none outline-none text-4xl font-serif text-white italic opacity-90 leading-tight tracking-tight"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Toolbar (Integrated into Header) */}
            <AnimatePresence>
              {!isFocusMode && !isPreviewMode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-0.5 p-0.5 bg-zinc-900/40 backdrop-blur border border-zinc-700 rounded-md shadow-sm"
                >
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('bold') ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('italic') ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                  >
                    <Italic size={14} />
                  </button>
                  <div className="w-px h-3 bg-zinc-700 mx-1" />
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('bulletList') ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                  >
                    <List size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!isFocusMode && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 transition-all ${isPreviewMode ? 'text-emerald-400 bg-white/5 border border-emerald-500/30' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                  title={isPreviewMode ? "Soạn thảo" : "Xem trước Markdown"}
                >
                  {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Users size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 text-[#d4d4d4]">
                    <DialogHeader>
                      <DialogTitle className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Nhân vật tham chiếu
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[50vh] pr-4 mt-4">
                      <div className="space-y-6">
                        {!Array.isArray(characters) ||
                        characters.length === 0 ? (
                          <p className="text-center text-zinc-500 text-xs py-8">
                            Chưa có nhân vật nào.
                          </p>
                        ) : (
                          characters.map(
                            (
                              char: Record<string, unknown> & {
                                id: string;
                                name: string;
                                appearance?: string;
                              }
                            ) => (
                              <div
                                key={char.id}
                                className="space-y-2 pb-4 border-b border-zinc-800 last:border-0"
                              >
                                <h3 className="font-serif italic text-lg text-white">
                                  {char.name}
                                </h3>
                                <p className="text-sm text-zinc-400 italic">
                                  {char.appearance}
                                </p>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      onClick={fetchWorldEntities}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Globe size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 text-[#d4d4d4] max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Worldbuilding / Kiến thức
                      </DialogTitle>
                    </DialogHeader>
                    <div className="relative mt-4">
                      <SearchIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                        size={14}
                      />
                      <Input
                        placeholder="Tìm kiếm thực thể..."
                        value={worldSearch}
                        onChange={(e) => setWorldSearch(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 pl-9 h-10 text-xs"
                      />
                    </div>
                    <ScrollArea className="h-[50vh] pr-4 mt-4">
                      <div className="space-y-4">
                        {worldEntities
                          .filter((e) =>
                            e.name
                              .toLowerCase()
                              .includes(worldSearch.toLowerCase())
                          )
                          .map((entity) => (
                            <Popover key={entity.id}>
                              <PopoverTrigger asChild>
                                <div className="p-4 rounded border border-zinc-800 bg-zinc-950 hover:border-zinc-600 transition-all cursor-pointer group">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-zinc-800 rounded text-zinc-400 group-hover:text-white">
                                        {entity.type === 'location' ? (
                                          <MapPin size={14} />
                                        ) : entity.type === 'organization' ? (
                                          <Shield size={14} />
                                        ) : (
                                          <ScrollText size={14} />
                                        )}
                                      </div>
                                      <h3 className="font-serif italic text-lg text-white group-hover:underline">
                                        {entity.name}
                                      </h3>
                                    </div>
                                    <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold border border-zinc-800 px-1.5 py-0.5 rounded">
                                      {entity.type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-500 italic line-clamp-2">
                                    {entity.description || 'Không có mô tả.'}
                                  </p>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-zinc-900 border-zinc-800 text-[#d4d4d4] p-4 shadow-2xl">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                                    <h4 className="font-serif italic text-white text-lg">
                                      {entity.name}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-zinc-400 leading-relaxed italic font-serif">
                                    {entity.description}
                                  </p>
                                  {entity.content && (
                                    <div className="text-[12px] text-zinc-500 leading-relaxed whitespace-pre-wrap pt-2 border-t border-zinc-800">
                                      {entity.content.substring(0, 300)}...
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-1 pt-2">
                                    {entity.tags?.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ))}
                        {worldEntities.length === 0 && (
                          <p className="text-center text-zinc-500 text-xs py-8">
                            Chưa có kiến thức thế giới nào.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      onClick={fetchVersions}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5"
                    >
                      <History size={16} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-zinc-900 border-l border-zinc-800 text-[#d4d4d4]">
                    <SheetHeader>
                      <SheetTitle className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Lịch sử phiên bản
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-8 space-y-4">
                      <Button
                        onClick={saveSnapshot}
                        variant="outline"
                        className="w-full border-zinc-800 hover:bg-zinc-800 text-[10px] uppercase tracking-widest font-bold"
                      >
                        <Save size={14} className="mr-2" /> Lưu bản nháp
                      </Button>
                      {versions.map((v) => (
                        <div
                          key={v.id}
                          className="p-4 rounded border border-zinc-800 bg-zinc-950 space-y-4"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(v.createdAt).toLocaleString()}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">
                              Snapshotted
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[10px] uppercase tracking-widest h-8 px-4 border border-zinc-800 hover:bg-zinc-800"
                                >
                                  Xem
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-zinc-900 border-zinc-800 text-[#d4d4d4] max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                    Xem phiên bản (
                                    {new Date(v.createdAt).toLocaleDateString()}
                                    )
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 font-serif text-zinc-400 italic leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-4">
                                  {(() => {
                                    try {
                                      const contentObj = JSON.parse(v.content);
                                      const getText = (
                                        node: Record<string, unknown>
                                      ): string => {
                                        if (node.type === 'text')
                                          return (node.text as string) || '';
                                        if (Array.isArray(node.content))
                                          return node.content
                                            .map((n) =>
                                              getText(
                                                n as Record<string, unknown>
                                              )
                                            )
                                            .join(
                                              node.type === 'paragraph'
                                                ? '\n'
                                                : ' '
                                            );
                                        if (node.type === 'paragraph')
                                          return '\n';
                                        return '';
                                      };
                                      const fullText = getText(contentObj);
                                      return (
                                        fullText.substring(0, 2000) +
                                        (fullText.length > 2000 ? '...' : '')
                                      );
                                    } catch {
                                      return 'Không thể hiển thị nội dung.';
                                    }
                                  })()}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="text-[10px] uppercase tracking-widest h-8 px-4 bg-zinc-800 hover:bg-zinc-700"
                                >
                                  Khôi phục
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-zinc-900 border-zinc-800 text-[#d4d4d4]">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-serif italic">
                                    Xác nhận khôi phục?
                                  </DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-zinc-400 py-4">
                                  Nội dung hiện tại của chương sẽ được ghi đè
                                  bởi phiên bản này. Bạn có muốn tiếp tục?
                                </p>
                                <div className="flex justify-end gap-3 mt-4">
                                  <Button
                                    variant="ghost"
                                    className="text-[10px] uppercase tracking-widest"
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      restoreVersion(v.id, v.content)
                                    }
                                    className="bg-white text-black hover:bg-white/90 text-[10px] uppercase tracking-widest font-bold px-6"
                                  >
                                    Xác nhận
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </header>

        {/* Editor Content Area with Separator */}
        <div
          className={`min-h-[80vh] transition-all duration-700 ${!isFocusMode ? 'border-t border-zinc-700 pt-6 mt-4' : ''}`}
        >
          {isPreviewMode ? (
            <div 
              className="prose prose-lg focus:outline-none max-w-none font-serif text-[19px] leading-[1.8] text-[#c0c0c0] prose-invert text-justify"
              dangerouslySetInnerHTML={{ __html: renderedPreview }}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        {/* Floating Stats */}
        <div className="fixed bottom-6 right-8 z-[120] pointer-events-none group">
          <AnimatePresence>
            {!isFocusMode ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 text-[10px] tracking-widest uppercase text-white font-medium opacity-40 pointer-events-auto hover:opacity-100 transition-opacity bg-zinc-900/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-zinc-800 shadow-lg"
              >
                <span>{wordCount} WORDS</span>
                <div className="h-3 w-px bg-white opacity-20" />
                <span>{Math.ceil(wordCount / 200)} MINS</span>
                <div className="h-3 w-px bg-white opacity-20" />
                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CloudCheck size={12} className="text-emerald-500" />
                  )}
                  <span className="opacity-80">{saveStatus}</span>
                </div>
              </motion.div>
            ) : (
              <div className="opacity-0 group-hover:opacity-40 transition-opacity duration-500 text-[10px] text-white uppercase tracking-[0.4em] bg-zinc-900/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-zinc-800">
                ALT + F TO EXIT
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
