
import React, { useState } from 'react';
import { UserCircle2, Map, Package, ChevronRight, Wand2, Languages, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Language, Asset } from '../types';
import * as gemini from '../services/geminiService';

interface AssetWorkspaceProps {
  assets: Asset[];
  onUpdateAssets: (assets: Asset[]) => void;
  onNext: () => void;
  lang: Language;
}

const AssetWorkspace: React.FC<AssetWorkspaceProps> = ({ assets, onUpdateAssets, onNext, lang }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleAddAsset = (type: 'character' | 'scene' | 'prop') => {
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name: type === 'character' ? '新角色' : type === 'scene' ? '新场景' : '新道具',
      type,
      description: '',
      prompt: ''
    };
    onUpdateAssets([...assets, newAsset]);
  };

  const handleDeleteAsset = (id: string) => onUpdateAssets(assets.filter(a => a.id !== id));

  const handleAIAction = async (id: string, action: 'optimize' | 'translate') => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    setIsProcessing(id);
    try {
      if (action === 'optimize') {
        const enhanced = await gemini.enhanceAssetPrompt(asset);
        onUpdateAssets(assets.map(a => a.id === id ? { ...a, prompt: enhanced } : a));
      } else {
        const targetLang: Language = /[\u4e00-\u9fa5]/.test(asset.prompt) ? 'en' : 'zh';
        const translated = await gemini.translatePrompt(asset.prompt, targetLang);
        onUpdateAssets(assets.map(a => a.id === id ? { ...a, prompt: translated } : a));
      }
    } catch (e) { console.error(e); } finally { setIsProcessing(null); }
  };

  const getIcon = (type: string) => {
    if (type === 'character') return <UserCircle2 className="w-4 h-4 text-purple-400" />;
    if (type === 'scene') return <Map className="w-4 h-4 text-emerald-400" />;
    return <Package className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/40 px-8">
        <div className="flex gap-4">
          <button onClick={() => handleAddAsset('character')} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-600 hover:text-white transition-all"><Plus className="w-3 h-3"/>添加角色</button>
          <button onClick={() => handleAddAsset('scene')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"><Plus className="w-3 h-3"/>添加场景</button>
          <button onClick={() => handleAddAsset('prop')} className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-600 hover:text-white transition-all"><Plus className="w-3 h-3"/>添加道具</button>
        </div>
        <button onClick={onNext} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-all shadow-lg">确认资产并进入出图 <ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {assets.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30">
              <Package className="w-16 h-16 mx-auto mb-4" />
              <p>暂无资产，请从上方按钮添加或从剧本同步</p>
            </div>
          )}
          {assets.map(asset => (
            <div key={asset.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 group hover:border-blue-500/30 transition-all shadow-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1">
                  {getIcon(asset.type)}
                  <input 
                    className="bg-transparent border-none text-sm font-bold text-gray-200 focus:ring-0 p-0 w-full"
                    value={asset.name}
                    onChange={e => onUpdateAssets(assets.map(a => a.id === asset.id ? {...a, name: e.target.value} : a))}
                  />
                </div>
                <button onClick={() => handleDeleteAsset(asset.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>

              <div className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                    {asset.type === 'character' ? '角色三视图 & 服装' : asset.type === 'scene' ? '场景四视图 & 灯光' : '道具三视图 & 材质'}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={() => handleAIAction(asset.id, 'optimize')} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300">
                      {isProcessing === asset.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin"/> : <Wand2 className="w-2.5 h-2.5" />} AI 优化
                    </button>
                    <button onClick={() => handleAIAction(asset.id, 'translate')} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white">
                      <Languages className="w-2.5 h-2.5" /> 翻译
                    </button>
                  </div>
                </div>
                <textarea 
                  className="w-full h-48 bg-black/40 border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-400 resize-none outline-none focus:border-blue-500/50 leading-relaxed"
                  placeholder={`输入关于${asset.name}的细节描述...`}
                  value={asset.prompt}
                  onChange={e => onUpdateAssets(assets.map(a => a.id === asset.id ? {...a, prompt: e.target.value} : a))}
                />
              </div>
              <p className="text-[10px] text-gray-600 italic leading-snug line-clamp-2">{asset.description || "无详细描述"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetWorkspace;
