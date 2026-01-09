
import React, { useState } from 'react';
import { Film, Languages, ChevronRight, Camera, Lightbulb, Box, Wind, Music, Plus, Wand2, Trash2, Sparkles } from 'lucide-react';
import { Shot, Language } from '../types';
import * as gemini from '../services/geminiService';

interface StoryboardWorkspaceProps {
  storyboard: Shot[];
  scriptContent: string;
  onUpdate: (shots: Shot[]) => void;
  onNext: () => void;
  lang: Language;
}

const StoryboardWorkspace: React.FC<StoryboardWorkspaceProps> = ({ storyboard, scriptContent, onUpdate, onNext, lang }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleAddShot = () => {
    const lastShot = storyboard[storyboard.length - 1];
    const newShot: Shot = {
      id: crypto.randomUUID(),
      shotNumber: lastShot ? lastShot.shotNumber + 1 : 1,
      shotType: 'MCU',
      duration: '2s',
      sceneName: lastShot?.sceneName || '新场景',
      location: lastShot?.location || '室内',
      characters: [],
      composition: '中央构图',
      action: '新镜头动作描述...',
      dialogue: '',
      lighting: '自然光',
      props: '',
      cameraMovement: '静态',
      atmosphere: '写实',
      soundEffect: '',
      visualPrompt: '',
      videoPrompt: '',
      transitionPrompt: ''
    };
    onUpdate([...storyboard, newShot]);
  };

  const handleRemoveShot = (id: string) => {
    onUpdate(storyboard.filter(s => s.id !== id).map((s, idx) => ({ ...s, shotNumber: idx + 1 })));
  };

  const handleUpdateField = (id: string, field: keyof Shot, value: any) => {
    onUpdate(storyboard.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAIOptimize = async (shot: Shot) => {
    setIsProcessing(shot.id);
    try {
      const optimized = await gemini.optimizeSingleShotAI(shot, scriptContent);
      onUpdate(storyboard.map(s => s.id === shot.id ? { ...s, ...optimized } : s));
    } catch (e) { console.error(e); } finally { setIsProcessing(null); }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/40 px-8">
        <div className="flex items-center gap-3">
          <Film className="text-blue-400 w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest text-gray-200">分镜脚本工作台</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleAddShot} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold border border-gray-700 transition-all"><Plus className="w-4 h-4" />添加分镜</button>
          <button onClick={onNext} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all shadow-lg">下一步：提取资产库 <ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {storyboard.map((shot) => (
          <div key={shot.id} className="group relative flex flex-col lg:flex-row gap-6 bg-gray-900/40 border border-gray-800 p-6 rounded-3xl hover:border-blue-500/30 transition-all shadow-xl">
            {/* 编号控制区 */}
            <div className="w-full lg:w-20 border-b lg:border-b-0 lg:border-r border-gray-800 pb-4 lg:pb-0 lg:pr-6 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-2">
              <span className="text-4xl font-black text-gray-700">#{shot.shotNumber}</span>
              <button onClick={() => handleRemoveShot(shot.id)} className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
            </div>
            
            {/* 主内容编辑区 */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Sparkles className="w-3 h-3"/> 动作描述 (视觉细节)</label>
                    <button onClick={() => handleAIOptimize(shot)} className={`text-[10px] ${isProcessing === shot.id ? 'text-blue-400 animate-pulse' : 'text-blue-500 hover:text-blue-400'} flex items-center gap-1 transition-all`}>
                      <Wand2 className={`w-3 h-3 ${isProcessing === shot.id ? 'animate-spin' : ''}`} /> AI 润色
                    </button>
                  </div>
                  <textarea 
                    className="w-full bg-black/40 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 outline-none focus:border-blue-500/50 min-h-[80px] resize-none leading-relaxed"
                    value={shot.action}
                    onChange={(e) => handleUpdateField(shot.id, 'action', e.target.value)}
                    placeholder="描述角色动作、神态和画面重点..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Music className="w-3 h-3"/> 对白与环境音</label>
                  <textarea 
                    className="w-full bg-black/40 border border-gray-800 rounded-xl p-3 text-sm text-gray-400 italic outline-none focus:border-blue-500/50 min-h-[80px] resize-none leading-relaxed"
                    value={shot.dialogue}
                    onChange={(e) => handleUpdateField(shot.id, 'dialogue', e.target.value)}
                    placeholder="角色台词或画面音效描述..."
                  />
                </div>
              </div>

              {/* 影视规格参数区 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-black/20 p-2 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-600 font-bold uppercase">景别</div>
                    <input className="w-full bg-transparent text-[11px] text-gray-300 outline-none border-none p-0" value={shot.shotType} onChange={(e) => handleUpdateField(shot.id, 'shotType', e.target.value)} />
                  </div>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-600 font-bold uppercase">构图</div>
                    <input className="w-full bg-transparent text-[11px] text-gray-300 outline-none border-none p-0" value={shot.composition} onChange={(e) => handleUpdateField(shot.id, 'composition', e.target.value)} />
                  </div>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-600 font-bold uppercase">灯光</div>
                    <input className="w-full bg-transparent text-[11px] text-gray-300 outline-none border-none p-0" value={shot.lighting} onChange={(e) => handleUpdateField(shot.id, 'lighting', e.target.value)} />
                  </div>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-rose-400" />
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-600 font-bold uppercase">运动</div>
                    <input className="w-full bg-transparent text-[11px] text-gray-300 outline-none border-none p-0" value={shot.cameraMovement} onChange={(e) => handleUpdateField(shot.id, 'cameraMovement', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={handleAddShot} className="w-full py-8 border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2 group">
          <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">在下方插入新镜头</span>
        </button>
      </div>
    </div>
  );
};

export default StoryboardWorkspace;
