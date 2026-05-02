import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AIPanel } from './components/AIPanel';
import { Story, Chapter, Scene } from './types';
import { DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { PanelLeft, PanelRight, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DUMMY_STORY: Story = {
  id: 'st-1',
  title: 'The Silent Protocol',
  chapters: [
    {
      id: 'ch-1',
      title: 'Chapter One: The Awakening',
      scenes: [
        {
          id: 'sc-1',
          title: 'Cold Storage',
          content: 'The cryogenic pod hissed open. Elias blinked away the frost, the harsh fluorescent lights piercing his dilated pupils. He survived the jump.\n\nBut the silence of the ship was wrong. There should have been the low hum of the environmental scrubbers. Instead, there was nothing. Only the sound of his own ragged breathing echoing against the metal bulkheads.',
          wordCount: 42,
        },
        {
          id: 'sc-2',
          title: 'Empty Corridors',
          content: 'He pulled himself from the pod, his muscles screaming in protest. The gravity plating was still active, a small mercy. He stumbled towards the airlock doors. Locked.',
          wordCount: 28,
        }
      ]
    },
    {
      id: 'ch-2',
      title: 'Chapter Two: Echoes',
      scenes: [
        {
          id: 'sc-3',
          title: 'The Bridge',
          content: 'The bridge was a graveyard of shattered glass and sparked-out consoles. Sarah was nowhere to be found.',
          wordCount: 17,
        }
      ]
    }
  ]
};

export default function App() {
  const [story, setStory] = useState<Story>(DUMMY_STORY);
  const [activeSceneId, setActiveSceneId] = useState<string | null>('sc-1');
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  const getActiveScene = (): Scene | null => {
    if (!activeSceneId) return null;
    for (const chapter of story.chapters) {
      const scene = chapter.scenes.find(s => s.id === activeSceneId);
      if (scene) return scene;
    }
    return null;
  };

  const handleUpdateScene = (id: string, newContent: string) => {
    setStory(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(sc => 
          sc.id === id ? { ...sc, content: newContent, wordCount: newContent.split(/\\s+/).filter(w => w.length > 0).length } : sc
        )
      }))
    }));
  };

  const handleUpdateTitle = (id: string, newTitle: string) => {
    setStory(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(sc => 
          sc.id === id ? { ...sc, title: newTitle } : sc
        )
      }))
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'CHAPTER') {
      const newChapters = Array.from(story.chapters);
      const [moved] = newChapters.splice(source.index, 1);
      newChapters.splice(destination.index, 0, moved);
      setStory({ ...story, chapters: newChapters });
    } else if (type === 'SCENE') {
      // Logic for scene reordering within the SAME chapter (for simplicity right now, cross-chapter needs more logic)
      const sourceChapterId = source.droppableId.split('-')[1];
      const destChapterId = destination.droppableId.split('-')[1];
      
      if (sourceChapterId === destChapterId) {
        const chapterIndex = story.chapters.findIndex(c => c.id === sourceChapterId);
        if (chapterIndex === -1) return;
        
        const newChapters = [...story.chapters];
        const newScenes = [...newChapters[chapterIndex].scenes];
        const [moved] = newScenes.splice(source.index, 1);
        newScenes.splice(destination.index, 0, moved);
        
        newChapters[chapterIndex] = { ...newChapters[chapterIndex], scenes: newScenes };
        setStory({ ...story, chapters: newChapters });
      }
    }
  };

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: `ch-${uuidv4()}`,
      title: 'New Chapter',
      scenes: []
    };
    setStory({ ...story, chapters: [...story.chapters, newChapter] });
  };

  const handleAddScene = (chapterId: string) => {
    const newScene: Scene = {
      id: `sc-${uuidv4()}`,
      title: 'New Scene',
      content: '',
      wordCount: 0
    };
    
    setStory(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => {
        if (ch.id === chapterId) {
          return { ...ch, scenes: [...ch.scenes, newScene] };
        }
        return ch;
      })
    }));
    setActiveSceneId(newScene.id);
  };

  const activeScene = getActiveScene();

  const toggleFocusMode = () => {
    if (focusMode) {
      setFocusMode(false);
      setSidebarOpen(true);
      setAiPanelOpen(true);
    } else {
      setFocusMode(true);
      setSidebarOpen(false);
      setAiPanelOpen(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans">
      <AnimatePresence>
        {!focusMode && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="h-12 flex items-center justify-between px-10 opacity-30 flex-shrink-0 z-10"
          >
            <div className="flex items-center space-x-4 text-[11px] tracking-widest uppercase text-white">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`transition-colors flex items-center ${sidebarOpen ? 'text-white' : 'text-[#666] hover:text-white'}`}
              >
                <PanelLeft size={16} className="mr-2" />
                <span>Menu</span>
              </button>
              <div className="h-3 w-px bg-white opacity-20" />
              <span>Manuscript &mdash; {activeScene?.title || "Untitled"}</span>
            </div>
            
            <div className="flex items-center space-x-6 text-[11px] tracking-widest uppercase text-white">
              <div className="text-white opacity-80">
                {story.chapters.reduce((acc, ch) => acc + ch.scenes.reduce((sAcc, s) => sAcc + s.wordCount, 0), 0)} WORDS
              </div>
              <button 
                onClick={toggleFocusMode}
                className="text-[#666] hover:text-white transition-colors"
              >
                FOCUS MODE (F)
              </button>
              <button 
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className={`transition-colors flex items-center ${aiPanelOpen ? 'text-white' : 'text-[#666] hover:text-white'}`}
              >
                <span>Muse</span>
                <PanelRight size={16} className="ml-2" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden flex relative">
        <Sidebar 
          story={story} 
          isOpen={sidebarOpen} 
          activeSceneId={activeSceneId}
          onSceneSelect={setActiveSceneId}
          onDragEnd={handleDragEnd}
          onAddChapter={handleAddChapter}
          onAddScene={handleAddScene}
        />
        
        <main className="flex-1 h-full flex flex-col relative bg-[var(--color-bg-base)]">
          <AnimatePresence>
            {focusMode && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleFocusMode}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#ffffff1a] text-[var(--color-text-secondary)] hover:text-white hover:bg-[#ffffff2a] transition-colors z-50 backdrop-blur-md"
                title="Exit Focus Mode"
              >
                <Minimize size={18} />
              </motion.button>
            )}
          </AnimatePresence>
          <Editor 
            scene={activeScene} 
            onUpdateScene={handleUpdateScene} 
            onUpdateTitle={handleUpdateTitle}
          />
        </main>
        
        <AIPanel 
          isOpen={aiPanelOpen} 
          activeScene={activeScene}
          onClose={() => setAiPanelOpen(false)}
        />
      </div>
    </div>
  );
}
