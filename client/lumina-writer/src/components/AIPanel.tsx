import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, Activity, X, Lightbulb } from 'lucide-react';
import { Scene } from '../types';

interface AIPanelProps {
  isOpen: boolean;
  activeScene: Scene | null;
  onClose: () => void;
}

export function AIPanel({ isOpen, activeScene, onClose }: AIPanelProps) {
  const getPacingAnalysis = (wordCount: number) => {
    if (wordCount < 10) return "Just getting started. Establish the mood.";
    if (wordCount < 50) return "Pacing is deliberate. The tone is atmospheric.";
    return "Pacing is accelerating. Consider adding sensory details to break the block of text.";
  };

  const getThemeSuggestions = (wordCount: number) => {
    if (wordCount < 20) return ["Consider hinting at the primary conflict early.", "How does the environment reflect the character's internal state?"];
    return ["Show, don't tell: Try replacing an adjective with an action.", "There is an opportunity here to deepen the subtext between characters."];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 288, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full bg-[var(--color-bg-panel)] flex-shrink-0 flex flex-col border-l border-[var(--color-border-subtle)] overflow-hidden"
        >
          <div className="p-6 pb-2 flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-semibold">The Muse Insight</h2>
            <button onClick={onClose} className="p-1 hover:bg-[#ffffff0a] rounded text-[#666] hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-10">
            {!activeScene ? (
              <div className="text-sm text-[var(--color-text-secondary)] mt-10 text-center px-4">
                Open a scene to begin receiving insights.
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-semibold flex items-center gap-2">
                    <Activity size={12} /> Pacing & Tone
                  </h3>
                  <div className="bg-[#222] rounded-lg p-4 border border-[#333]">
                    <p className="text-[12px] leading-relaxed italic text-white opacity-80 mb-3">
                      "{getPacingAnalysis(activeScene.wordCount)}"
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-[#888]">
                      <span>Tone: Neutral</span>
                      <span className="text-blue-400 cursor-pointer">Apply</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-semibold flex items-center gap-2">
                    <MessageSquare size={12} /> Scene Elements
                  </h3>
                  <div className="bg-[#222] rounded-lg p-4 border border-[#333]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-[10px] font-bold text-[#888]">EV</div>
                        <div>
                          <div className="text-[12px] font-medium text-white opacity-90">Elias Vance</div>
                          <div className="text-[10px] text-[#666]">Internal Conflict: High</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#666] font-semibold flex items-center gap-2">
                    <Lightbulb size={12} /> Suggestions
                  </h3>
                  <div className="bg-[#222] rounded-lg p-4 border border-[#333] space-y-3">
                    {getThemeSuggestions(activeScene.wordCount).map((sug, i) => (
                      <p key={i} className="text-[12px] cursor-pointer hover:text-white transition-colors text-[#888] leading-relaxed">
                        {sug}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
