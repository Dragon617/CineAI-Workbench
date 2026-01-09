
import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Video, Copy, RefreshCw, Wand2, Info, Languages } from 'lucide-react';
import { Shot, Asset, Language } from '../types'; // Fix: Use Asset instead of missing Character/Scene types
import * as gemini from '../services/geminiService';

interface VisualPromptWorkspaceProps {
  storyboard: Shot[];
  characters: Asset[]; // Fix: Type is Asset
  scenes: Asset[];     // Fix: Type is Asset
  lang: Language;
}

const VisualPromptWorkspace: React.FC<VisualPromptWorkspaceProps> = ({ storyboard, characters, scenes, lang }) => {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(storyboard[0] || null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const t = {
    zh: { timeline: "镜头列表", detail: "镜头详情", scene: "场景", computing: "正在计算影视级参数...", master: "主视觉提示词", copy: "复制提示词", imgSet: "画面设置", movSet: "动作设置", lens: "镜头", aperture: "光圈", film: "胶片感", move: "主运动", strength: "强度", fps: "帧率", noteTitle: "一致性建议", noteBody: "提示词已自动整合资产库特征。建议在使用绘图 AI 时同步参考 Phase 3 的角色表。" },
    en: { timeline: "Shot Timeline", detail: "Shot Detail", scene: "Scene", computing: "Calculating cinematic parameters...", master: "Master Visual Prompt", copy: "Copy Prompt", imgSet: "Image Settings", movSet: "Motion Settings", lens: "Lens", aperture: "Aperture", film: "Film Stock", move: "Primary Movement", strength: "Motion Strength", fps: "Frame Rate", noteTitle: "Consistency Note", noteBody: "Prompts include identifiers from the Asset Library. Refer back to Phase 3 Character Sheets for seeding." }
  }[lang];

  const handleGenerate = async (shot: Shot) => {
    setSelectedShot(shot);
    setIsGenerating(true);
    try {
      // Fix: generateVisualPrompts expects 3 arguments: shot, assets array, and lang.
      // We merge characters and scenes into a single array to satisfy the signature.
      const prompt = await gemini.generateVisualPrompts(shot, [...characters, ...scenes], lang);
      setGeneratedPrompt(prompt);
    } catch (err) { console.error(err); } finally { setIsGenerating(false); }
  };

  useEffect(() => {
    if (storyboard.length > 0 && !selectedShot) handleGenerate(storyboard[0]);
  }, [storyboard]);

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-72 border-r border-gray-800 flex flex-col bg-gray-900/40">
        <div className="p-4 border-b border-gray-800 bg-gray-900/60">
           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.timeline}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {storyboard.map((shot, idx) => (
            <button key={shot.id || idx} onClick={() => handleGenerate(shot)} className={`w-full text-left p-4 border-b border-gray-800/50 hover:bg-gray-800 ${selectedShot?.shotNumber === shot.shotNumber ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-500">Shot #{shot.shotNumber}</span>
                <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-blue-400 font-mono">{shot.duration}</span>
              </div>
              <p className="text-sm font-medium text-gray-200 truncate">{shot.action}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-950">
        {selectedShot ? (
          <>
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
               <div>
                 <div className="flex items-center gap-4 mb-1">
                   <h2 className="text-2xl font-bold">{t.detail}: {selectedShot.shotType}</h2>
                   <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-400">{t.scene}: {selectedShot.sceneName}</span>
                 </div>
                 <p className="text-gray-400 text-sm italic">"{selectedShot.action}"</p>
               </div>
               <button onClick={() => handleGenerate(selectedShot)} className="p-2 hover:bg-gray-800 rounded-lg text-blue-400 transition-colors" title="Regenerate">
                 <RefreshCw className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               {isGenerating ? (
                 <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-gray-400 animate-pulse">{t.computing}</p>
                 </div>
               ) : (
                 <>
                   <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                     <div className="bg-gray-800/50 px-6 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Wand2 className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">{t.master}</span>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(generatedPrompt)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
                          <Copy className="w-3 h-3" /> {t.copy}
                        </button>
                     </div>
                     <div className="p-8 text-lg font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedPrompt}</div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-900/30 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-4"><ImageIcon className="w-5 h-5 text-amber-500" /><h4 className="font-bold">{t.imgSet}</h4></div>
                        <div className="space-y-3">
                          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-xs text-gray-500">{t.lens}</span><span className="text-xs font-mono text-white">Anamorphic 35mm</span></div>
                          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-xs text-gray-500">{t.aperture}</span><span className="text-xs font-mono text-white">f/2.8</span></div>
                          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-xs text-gray-500">{t.film}</span><span className="text-xs font-mono text-white">Fujifilm Eterna 250D</span></div>
                        </div>
                      </div>
                      <div className="bg-gray-900/30 p-5 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-4"><Video className="w-5 h-5 text-red-500" /><h4 className="font-bold">{t.movSet}</h4></div>
                        <div className="space-y-3">
                          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-xs text-gray-500">{t.move}</span><span className="text-xs font-mono text-white">{selectedShot.cameraMovement}</span></div>
                          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-xs text-gray-500">{t.strength}</span><span className="text-xs font-mono text-white">Medium</span></div>
                          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-xs text-gray-500">{t.fps}</span><span className="text-xs font-mono text-white">24 fps</span></div>
                        </div>
                      </div>
                   </div>

                   <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-4">
                      <Info className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                      <div><h5 className="text-sm font-bold text-blue-300">{t.noteTitle}</h5><p className="text-xs text-blue-400/80 leading-relaxed">{t.noteBody}</p></div>
                   </div>
                 </>
               )}
            </div>
          </>
        ) : <div className="h-full flex flex-col items-center justify-center text-gray-500"><Sparkles className="w-16 h-16 opacity-10 mb-4" /><p>{t.computing}</p></div>}
      </div>
    </div>
  );
};

export default VisualPromptWorkspace;
