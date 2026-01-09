
import React, { useState } from 'react';
import { Video, Wand2, Copy, Film, Languages, RefreshCw, Volume2, MoveHorizontal } from 'lucide-react';
import { Shot, Language } from '../types';
import * as gemini from '../services/geminiService';

interface VideoProductionWorkspaceProps {
  storyboard: Shot[];
  onUpdateStoryboard: (shots: Shot[]) => void;
  lang: Language;
}

const VideoProductionWorkspace: React.FC<VideoProductionWorkspaceProps> = ({ storyboard, onUpdateStoryboard, lang }) => {
  const [selectedId, setSelectedId] = useState(storyboard[0]?.id || "");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const selectedShot = storyboard.find(s => s.id === (selectedId || storyboard[0]?.id)) || storyboard[0];

  const handleTranslate = async (field: 'videoPrompt' | 'transitionPrompt') => {
    const text = selectedShot?.[field];
    if (!text) return;
    setIsProcessing(field);
    try {
      const targetLang: Language = /[\u4e00-\u9fa5]/.test(text) ? 'en' : 'zh';
      const translated = await gemini.translatePrompt(text, targetLang);
      onUpdateStoryboard(storyboard.map(s => s.id === selectedShot.id ? { ...s, [field]: translated } : s));
    } catch (e) { console.error(e); } finally { setIsProcessing(null); }
  };

  const handlePlayTTS = async () => {
    if (!selectedShot?.dialogue) return;
    setIsProcessing('audio');
    try {
      const base64Audio = await gemini.generateSpeech(selectedShot.dialogue);
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const audioBuffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsProcessing(null);
        source.start();
      } else {
        setIsProcessing(null);
      }
    } catch (e) { console.error(e); setIsProcessing(null); }
  };

  if (!selectedShot) {
    return <div className="h-full flex items-center justify-center text-gray-500 italic">暂无分镜数据。</div>;
  }

  return (
    <div className="h-full flex overflow-hidden bg-gray-950">
      <div className="w-64 border-r border-gray-800 bg-gray-900/20 overflow-y-auto">
        <div className="p-4 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">分镜索引</div>
        {storyboard.map(shot => (
          <button key={shot.id} onClick={() => setSelectedId(shot.id)} className={`w-full p-4 text-left border-b border-gray-800/50 hover:bg-gray-800 transition-all ${selectedShot.id === shot.id ? 'bg-rose-600/10 border-l-4 border-l-rose-500' : ''}`}>
            <div className="text-[10px] font-bold text-gray-500">Shot {shot.shotNumber}</div>
            <div className="text-xs text-gray-200 truncate">{shot.cameraMovement}</div>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
             <Video className="text-rose-500 w-6 h-6" /><h2 className="text-xl font-bold tracking-tight">镜头动态规格</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 核心动态提示词 */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-gray-800/80 px-6 py-3 flex justify-between items-center border-b border-gray-800">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Video Motion Prompt</span>
                <button onClick={() => handleTranslate('videoPrompt')} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                  {isProcessing === 'videoPrompt' ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Languages className="w-2.5 h-2.5" />} 翻译
                </button>
              </div>
              <textarea 
                className="w-full h-40 bg-transparent border-none focus:ring-0 text-rose-100 font-mono text-sm p-6 resize-none outline-none leading-relaxed"
                value={selectedShot.videoPrompt || ""}
                onChange={e => onUpdateStoryboard(storyboard.map(s => s.id === selectedShot.id ? {...s, videoPrompt: e.target.value} : s))}
                placeholder="描述本镜头的运动路径..."
              />
            </div>

            {/* 衔接过渡提示词 */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-gray-800/80 px-6 py-3 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Transition (自然过渡提示词)</span>
                </div>
                <button onClick={() => handleTranslate('transitionPrompt')} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                  {isProcessing === 'transitionPrompt' ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Languages className="w-2.5 h-2.5" />} 翻译
                </button>
              </div>
              <textarea 
                className="w-full h-40 bg-transparent border-none focus:ring-0 text-blue-100 font-mono text-sm p-6 resize-none outline-none leading-relaxed"
                value={selectedShot.transitionPrompt || ""}
                onChange={e => onUpdateStoryboard(storyboard.map(s => s.id === selectedShot.id ? {...s, transitionPrompt: e.target.value} : s))}
                placeholder="描述如何从上一镜自然衔接到本镜..."
              />
            </div>
          </div>

          <div className="bg-rose-600/5 border border-rose-500/20 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1 block">本镜台词 (用于配音与对口型参考)</span>
              <p className="text-lg italic text-rose-100 font-serif leading-relaxed">
                {selectedShot.dialogue || "（本镜头无对白）"}
              </p>
            </div>
            {selectedShot.dialogue && (
              <button 
                onClick={handlePlayTTS}
                className="ml-6 p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                disabled={isProcessing === 'audio'}
              >
                {isProcessing === 'audio' ? <RefreshCw className="animate-spin w-6 h-6"/> : <Volume2 className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProductionWorkspace;
