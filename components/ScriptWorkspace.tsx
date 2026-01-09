
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit3, Send, ChevronRight, BookOpen, Clock, MessageCircle, Sparkles, Copy, Save } from 'lucide-react';
import { Script, Language } from '../types';
import * as gemini from '../services/geminiService';

interface ScriptWorkspaceProps {
  script: Script;
  onDraftChange: (id: string) => void;
  onNewDraft: () => void;
  onContentUpdate: (content: string) => void;
  onNext: () => void;
  lang: Language;
}

const ScriptWorkspace: React.FC<ScriptWorkspaceProps> = ({ script, onDraftChange, onNewDraft, onContentUpdate, onNext, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentDraft = script.drafts.find(d => d.id === script.currentDraftId) || script.drafts[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleChat = async () => {
    if (!chatInput.trim() || isLoading) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const historyForAI = chatHistory.map(c => ({ 
        role: c.role, 
        parts: [{ text: c.text }] 
      }));
      
      const result = await gemini.generateScript(userMsg, historyForAI, lang);
      setChatHistory(prev => [...prev, { role: 'model', text: result }]);
      
      // 如果结果包含剧本特征（如场景描述），则自动更新当前草稿
      if (result.includes("场") || result.includes("EXT.") || result.includes("INT.") || result.length > 200) {
        onContentUpdate(result);
      }
    } catch (e) { 
      console.error(e); 
      setChatHistory(prev => [...prev, { role: 'model', text: "抱歉，出了一点小问题，请重试。" }]);
    } finally { 
      setIsLoading(false); 
    }
  };

  const t = {
    zh: { drafts: "剧本版本库", new: "开个新剧本", next: "同步生成分镜", edit: "手动修改", chat: "给 AI 下指令 (或回答 AI 的提问)", placeholder: "例如：'帮我把结局改成悲剧' 或 '第一场戏增加一个角色'", syncHint: "AI 生成的剧本会自动更新至此处" },
    en: { drafts: "Draft Library", new: "New Script", next: "Sync Storyboard", edit: "Edit", chat: "AI Instructions / Answers", placeholder: "e.g., 'Make the ending more tragic'", syncHint: "AI generated content will sync here" }
  }[lang];

  return (
    <div className="h-full flex overflow-hidden">
      {/* 左侧：草稿版本管理 */}
      <div className="w-64 border-r border-gray-800 flex flex-col bg-gray-900/30">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.drafts}</span>
          <button onClick={onNewDraft} className="flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all">
            <Plus className="w-3 h-3" /> {t.new}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {script.drafts.map(draft => (
            <button 
              key={draft.id} 
              onClick={() => onDraftChange(draft.id)}
              className={`w-full p-4 text-left border-b border-gray-800/50 hover:bg-gray-800/50 transition-all ${script.currentDraftId === draft.id ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="font-semibold text-sm text-gray-200 truncate">{draft.title}</div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                <Clock className="w-2.5 h-2.5" />{new Date(draft.createdAt).toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 中间：对话沟通区 */}
      <div className="w-96 border-r border-gray-800 flex flex-col bg-gray-900/10">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">AI 创意助理</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <Sparkles className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs">描述你的创意，AI 将为你生成剧本</p>
            </div>
          )}
          {chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                chat.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-lg' 
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none shadow-md'
              }`}>
                {chat.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 p-3 rounded-2xl animate-pulse text-[10px] text-gray-500">导演正在构思中...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-gray-900/50 border-t border-gray-800">
          <div className="relative">
            <textarea 
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-xs focus:border-blue-500 outline-none resize-none h-20"
              placeholder={t.placeholder}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
            />
            <button 
              disabled={isLoading} 
              onClick={handleChat}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-700 shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 右侧：剧本编辑预览区 */}
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/40 px-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold tracking-widest uppercase">剧本预览</h2>
            <span className="text-[10px] text-gray-500 italic ml-4">{t.syncHint}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEditing ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
              <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "锁定预览" : t.edit}
            </button>
            <button onClick={onNext} className="flex items-center gap-2 px-6 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold shadow-lg transition-all">
              {t.next} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-12 overflow-y-auto bg-white/5 font-serif leading-loose">
          <div className="max-w-3xl mx-auto">
            {isEditing ? (
              <textarea 
                className="w-full h-[80vh] bg-transparent border-none focus:ring-0 text-gray-200 text-lg font-serif resize-none outline-none leading-loose"
                value={currentDraft.content}
                onChange={(e) => onContentUpdate(e.target.value)}
              />
            ) : (
              <div className="whitespace-pre-wrap text-gray-200 text-lg min-h-[50vh]">
                {currentDraft.content || <p className="text-gray-600 italic text-center py-20">等待剧本生成...</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptWorkspace;
