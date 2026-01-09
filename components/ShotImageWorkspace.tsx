
import React, { useState, useEffect } from 'react';
import { ImageIcon, Wand2, Copy, ChevronRight, Languages, Eye, RefreshCw, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Shot, Asset, Language } from '../types';
import * as gemini from '../services/geminiService';

interface ShotImageWorkspaceProps {
  storyboard: Shot[];
  assets: Asset[];
  onUpdateStoryboard: (shots: Shot[]) => void;
  lang: Language;
  onNext: () => void;
}

const ShotImageWorkspace: React.FC<ShotImageWorkspaceProps> = ({ storyboard, assets, onUpdateStoryboard, lang, onNext }) => {
  const [selectedId, setSelectedId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [userIdea, setUserIdea] = useState("");

  useEffect(() => {
    if (storyboard.length > 0 && !selectedId) {
      setSelectedId(storyboard[0].id);
    }
  }, [storyboard]);

  const selectedShot = storyboard.find(s => s.id === selectedId) || storyboard[0];

  const handleAddShot = () => {
    const lastShot = storyboard[storyboard.length - 1];
    const newId = crypto.randomUUID();
    const newShot: Shot = {
      id: newId,
      shotNumber: lastShot ? lastShot.shotNumber + 1 : 1,
      shotType: 'MCU',
      duration: '2s',
      sceneName: lastShot?.sceneName || '场景',
      location: lastShot?.location || '默认',
      characters: [],
      composition: '中央构图',
      action: '新镜头动作描述...',
      dialogue: '',
      lighting: '电影光',
      props: '',
      cameraMovement: '推镜头',
      atmosphere: '写实',
      soundEffect: '',
      visualPrompt: '',
      videoPrompt: '',
      transitionPrompt: ''
    };
    onUpdateStoryboard([...storyboard, newShot]);
    setSelectedId(newId);
  };

  const handleRemoveShot = (id: string) => {
    const newList = storyboard.filter(s => s.id !== id).map((s, idx) => ({ ...s, shotNumber: idx + 1 }));
    onUpdateStoryboard(newList);
    if (selectedId === id) setSelectedId(newList[0]?.id || "");
  };

  const handleGeneratePrompt = async () => {
    if (!selectedShot) return;
    setIsProcessing(true);
    try {
      // 融合分镜脚本中的 景别、构图、灯光、运动等参数
      const mergedPrompt = await gemini.generateVisualPrompts(selectedShot, assets, lang);
      onUpdateStoryboard(storyboard.map(s => s.id === selectedShot.id ? { ...s, visualPrompt: mergedPrompt } : s));
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleTranslatePrompt = async () => {
    if (!selectedShot?.visualPrompt || isTranslating) return;
    setIsTranslating(true);
    try {
      const targetLang: Language = /[\u4e00-\u9fa5]/.test(selectedShot.visualPrompt) ? 'en' : 'zh';
      const translated = await gemini.translatePrompt(selectedShot.visualPrompt, targetLang);
      onUpdateStoryboard(storyboard.map(s => s.id === selectedShot.id ? { ...s, visualPrompt: translated } : s));
    } catch (e) { console.error(e); } finally { setIsTranslating(false); }
  };

  const handleOptimize = async () => {
    if (!selectedShot) return;
    setIsProcessing(true);
    try {
      const optimized = await gemini.optimizePromptWithIdea(
        selectedShot.visualPrompt || "", 
        userIdea, 
        `Action: ${selectedShot.action}, Shot: ${selectedShot.shotType}, Lighting: ${selectedShot.lighting}`
      );
      onUpdateStoryboard(storyboard.map(s => s.id === selectedShot.id ? { ...s, visualPrompt: optimized } : s));
      setUserIdea("");
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handlePreview = async () => {
    if (!selectedShot?.visualPrompt) return;
    setIsPreviewing(true);
    try {
      const imageUrl = await gemini.generatePreviewImage(selectedShot.visualPrompt);
      if (imageUrl) setPreviews(prev => ({ ...prev, [selectedShot.id]: imageUrl }));
    } catch (e) { console.error(e); } finally { setIsPreviewing(false); }
  };

  if (!selectedShot) return <div className="h-full flex items-center justify-center text-gray-500">正在加载分镜数据...</div>;

  return (
    <div className="h-full flex bg-gray-950 overflow-hidden">
      {/* 左侧分镜索引 */}
      <div className="w-64 border-r border-gray-800 bg-gray-900/20 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/40">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">镜头列表</span>
          <button onClick={handleAddShot} title="新增镜头" className="p-1.5 hover:bg-gray-800 rounded-lg text-blue-500 transition-all"><Plus className="w-3.5 h-3.5"/></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {storyboard.map(shot => (
            <div key={shot.id} className="relative group">
              <button onClick={() => setSelectedId(shot.id)} className={`w-full p-4 text-left border-b border-gray-800/50 hover:bg-gray-800 transition-all ${selectedId === shot.id ? 'bg-amber-600/10 border-l-4 border-l-amber-500 shadow-inner' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-500">镜头 #{shot.shotNumber}</span>
                  <span className="text-[10px] bg-gray-800 px-1 rounded text-amber-500/80 font-mono">{shot.shotType}</span>
                </div>
                <div className="text-xs text-gray-200 truncate font-medium">{shot.action}</div>
              </button>
              <button onClick={() => handleRemoveShot(shot.id)} className="absolute right-2 top-2 p-1 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3"/></button>
            </div>
          ))}
          <button onClick={handleAddShot} className="w-full p-4 text-center text-gray-600 hover:text-blue-500 text-xs font-bold border-b border-gray-800/50 transition-all">
            + 插入新分镜
          </button>
        </div>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/40 px-8">
          <div className="flex items-center gap-2 text-amber-500 font-bold"><ImageIcon className="w-5 h-5" /> 分镜出图提示词 (Visual Prompt)</div>
          <button onClick={onNext} className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-bold shadow-lg">下一步：视频动态规格 <ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 提示词编辑 */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all hover:border-amber-500/20">
              <div className="bg-gray-800/80 px-6 py-3 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center gap-2">
                   <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                   <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">电影级绘图提示词</span>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleTranslatePrompt} disabled={isTranslating || !selectedShot.visualPrompt} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 font-bold">
                    <Languages className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} /> {isTranslating ? '翻译中...' : '中英互转'}
                  </button>
                  <button onClick={handleGeneratePrompt} disabled={isProcessing} className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold">
                    <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} /> 智能合成/重置
                  </button>
                </div>
              </div>
              <textarea 
                className="w-full h-64 bg-transparent border-none focus:ring-0 text-amber-100 font-mono text-lg p-8 resize-none leading-relaxed placeholder:text-gray-800"
                placeholder="点击“智能合成”按钮，AI 将根据分镜脚本的所有维度（景别、构图、灯光等）生成专业英文提示词..."
                value={selectedShot.visualPrompt || ""}
                onChange={e => onUpdateStoryboard(storyboard.map(s => s.id === selectedId ? {...s, visualPrompt: e.target.value} : s))}
              />
              <div className="p-4 bg-black/40 border-t border-gray-800 flex gap-3">
                 <div className="flex-1 relative">
                    <input 
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500/50 pr-12 text-white"
                      placeholder="根据当前提示词进行局部修饰 (例如: '改成复古港风滤镜', '增加暴雨环境')..."
                      value={userIdea}
                      onChange={e => setUserIdea(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter') handleOptimize(); }}
                    />
                    <button onClick={handleOptimize} disabled={isProcessing} className="absolute right-1 top-1 bottom-1 px-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-lg">
                       {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    </button>
                 </div>
              </div>
            </div>

            {/* 分镜参数对照卡 */}
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
               <span className="text-[10px] text-gray-500 uppercase font-bold block mb-3 tracking-widest border-b border-gray-800 pb-2">当前分镜脚本规格</span>
               <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-600">景别:</span> <span className="text-amber-500 font-bold">{selectedShot.shotType}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">灯光:</span> <span className="text-gray-300">{selectedShot.lighting}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">构图:</span> <span className="text-gray-300">{selectedShot.composition}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">运动:</span> <span className="text-gray-300">{selectedShot.cameraMovement}</span></div>
                  <div className="col-span-2 border-t border-gray-800/50 pt-2 mt-1">
                     <span className="text-gray-600 block mb-1">核心动作描述:</span>
                     <p className="text-gray-400 italic leading-relaxed">"{selectedShot.action}"</p>
                  </div>
               </div>
            </div>
          </div>

          {/* 渲染预览 */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Eye className="w-3 h-3" /> 视觉参考预览</span>
                <button onClick={handlePreview} disabled={isPreviewing || !selectedShot.visualPrompt} className="text-[10px] bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all flex items-center gap-1 shadow-inner disabled:opacity-30">
                   {isPreviewing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} 渲染当前提示词画面
                </button>
             </div>
             <div className="aspect-video bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden relative shadow-2xl group">
                {previews[selectedShot.id] ? (
                  <img src={previews[selectedShot.id]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 gap-3">
                    <ImageIcon className="w-16 h-16 opacity-5" />
                    <p className="italic text-xs opacity-40 uppercase tracking-widest font-black">AI Frame Rendering</p>
                  </div>
                )}
                {isPreviewing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-amber-500 font-bold gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs uppercase tracking-[0.3em] animate-pulse">正在生成电影级画面预览...</span>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShotImageWorkspace;
