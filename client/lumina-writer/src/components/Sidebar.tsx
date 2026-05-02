import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, FileText, Plus, Book, MoreHorizontal, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { Story, Chapter, Scene } from '../types';

interface SidebarProps {
  story: Story;
  isOpen: boolean;
  activeSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  onDragEnd: (result: DropResult) => void;
  onAddChapter: () => void;
  onAddScene: (chapterId: string) => void;
}

export function Sidebar({ story, isOpen, activeSceneId, onSceneSelect, onDragEnd, onAddChapter, onAddScene }: SidebarProps) {
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full bg-[var(--color-bg-panel)] flex-shrink-0 flex flex-col border-r border-[var(--color-border-subtle)] overflow-hidden"
        >
          <div className="p-6 pb-2 flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-semibold">{story.title}</h2>
            <button onClick={onAddChapter} className="p-1 hover:bg-[#ffffff0a] rounded text-[var(--color-text-secondary)] hover:text-white transition-colors">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 pt-2">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="chapters" type="CHAPTER">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                    {story.chapters.map((chapter, index) => (
                      // @ts-ignore - React 19 type issue with hello-pangea key
                      <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`rounded-md ${snapshot.isDragging ? 'bg-[var(--color-bg-hover)] shadow-lg' : ''}`}
                          >
                            <div className="flex items-center group px-1 py-1.5 rounded hover:bg-[var(--color-bg-hover)] text-sm transition-colors text-[var(--color-text-primary)]">
                              <div {...provided.dragHandleProps} className="p-1 opacity-0 group-hover:opacity-50 hover:opacity-100 cursor-grab text-[var(--color-text-secondary)]">
                                <GripVertical size={14} />
                              </div>
                              <button onClick={() => toggleChapter(chapter.id)} className="p-1 text-[#888]">
                                {expandedChapters[chapter.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <span className="flex-1 text-left truncate text-xs text-[#888] font-medium mr-2 tracking-wide uppercase">{chapter.title}</span>
                              <button onClick={() => onAddScene(chapter.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                                <Plus size={12} />
                              </button>
                            </div>
                            
                            <AnimatePresence>
                              {expandedChapters[chapter.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <Droppable droppableId={`scenes-${chapter.id}`} type="SCENE">
                                    {(provided) => (
                                      <div ref={provided.innerRef} {...provided.droppableProps} className="pl-6 pr-2 py-1 space-y-0.5 border-l border-[var(--color-border-subtle)] ml-3">
                                        {chapter.scenes.map((scene, sceneIndex) => (
                                          // @ts-ignore - React 19 type issue with hello-pangea key
                                          <Draggable key={scene.id} draggableId={scene.id} index={sceneIndex}>
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                              >
                                                <button
                                                  onClick={() => onSceneSelect(scene.id)}
                                                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                                                    activeSceneId === scene.id 
                                                      ? 'text-white font-medium bg-[#ffffff0a]' 
                                                      : 'text-white opacity-60 hover:opacity-100 hover:bg-[#ffffff05]'
                                                  }`}
                                                >
                                                  <span className="truncate flex-1 text-left">{scene.title}</span>
                                                </button>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
