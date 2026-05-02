import { Scene } from '../types';
import { ChangeEvent, useRef, useEffect } from 'react';

interface EditorProps {
  scene: Scene | null;
  onUpdateScene: (id: string, newContent: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export function Editor({ scene, onUpdateScene, onUpdateTitle }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [scene?.content]);

  if (!scene) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
        <p>Select a scene to start writing</p>
      </div>
    );
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateScene(scene.id, e.target.value);
  };
  
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdateTitle(scene.id, e.target.value);
  };

  return (
    <div className="flex-1 overflow-y-auto px-10 md:px-20 pt-20 pb-32 flex justify-center">
      <div className="max-w-2xl w-full">
        <input
          type="text"
          value={scene.title}
          onChange={handleTitleChange}
          placeholder="Scene Title..."
          className="w-full bg-transparent border-none outline-none text-4xl font-serif text-white mb-12 italic opacity-90 leading-tight tracking-tight placeholder-[#ffffff30]"
        />
        <textarea
          ref={textareaRef}
          value={scene.content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          className="w-full bg-transparent border-none outline-none text-[19px] leading-[1.8] font-serif text-[#c0c0c0] resize-none overflow-hidden placeholder-[#ffffff30] text-justify"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
