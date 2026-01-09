
import React, { useState } from 'react';
import { Settings, Save, RefreshCcw, Languages } from 'lucide-react';
import { WorkflowStep, Script, Shot, Asset, Language } from './types';
import * as gemini from './services/geminiService';

import Sidebar from './components/Sidebar';
import ScriptWorkspace from './components/ScriptWorkspace';
import StoryboardWorkspace from './components/StoryboardWorkspace';
import AssetWorkspace from './components/AssetWorkspace';
import ShotImageWorkspace from './components/ShotImageWorkspace';
import VideoProductionWorkspace from './components/VideoProductionWorkspace';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.SCRIPT);
  const [lang, setLang] = useState<Language>('zh');
  const [script, setScript] = useState<Script>({
    currentDraftId: 'default',
    drafts: [{ id: 'default', title: '初始剧本', content: '', createdAt: new Date().toISOString() }]
  });
  const [storyboard, setStoryboard] = useState<Shot[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const currentDraft = script.drafts.find(d => d.id === script.currentDraftId) || script.drafts[0];

  const updateDraftContent = (content: string) => {
    setScript(prev => ({
      ...prev,
      drafts: prev.drafts.map(d => d.id === prev.currentDraftId ? { ...d, content } : d)
    }));
  };

  const syncToStoryboard = async () => {
    if (!currentDraft.content) return;
    setIsSyncing(true);
    try {
      const shots = await gemini.generateStoryboard(currentDraft.content, lang);
      setStoryboard(shots.map((s: any) => ({ ...s, id: crypto.randomUUID() })));
      setCurrentStep(WorkflowStep.STORYBOARD);
    } catch (error) { console.error(error); } finally { setIsSyncing(false); }
  };

  const extractAssets = async () => {
    setIsSyncing(true);
    try {
      const data = await gemini.generateAssets(currentDraft.content);
      setAssets(data.assets.map((a: any) => ({ ...a, id: crypto.randomUUID() })));
      setCurrentStep(WorkflowStep.ASSETS);
    } catch (error) { console.error(error); } finally { setIsSyncing(false); }
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <Sidebar currentStep={currentStep} onStepChange={setCurrentStep} lang={lang} />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-blue-400">CineAI Workbench</h1>
            {isSyncing && <span className="flex items-center gap-2 text-xs text-blue-400 animate-pulse"><RefreshCcw className="w-3 h-3 animate-spin" />处理中...</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><Languages className="w-5 h-5" /></button>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold shadow-lg"><Save className="w-4 h-4" />保存项目</button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {currentStep === WorkflowStep.SCRIPT && (
            <ScriptWorkspace script={script} onDraftChange={id => setScript(p => ({...p, currentDraftId: id}))} onNewDraft={() => {}} onContentUpdate={updateDraftContent} onNext={syncToStoryboard} lang={lang} />
          )}
          {currentStep === WorkflowStep.STORYBOARD && (
            <StoryboardWorkspace storyboard={storyboard} scriptContent={currentDraft.content} onUpdate={setStoryboard} onNext={extractAssets} lang={lang} />
          )}
          {currentStep === WorkflowStep.ASSETS && (
            <AssetWorkspace assets={assets} onUpdateAssets={setAssets} onNext={() => setCurrentStep(WorkflowStep.IMAGE_PROMPTS)} lang={lang} />
          )}
          {currentStep === WorkflowStep.IMAGE_PROMPTS && (
            <ShotImageWorkspace storyboard={storyboard} assets={assets} onUpdateStoryboard={setStoryboard} lang={lang} onNext={() => setCurrentStep(WorkflowStep.VIDEO_PROMPTS)} />
          )}
          {currentStep === WorkflowStep.VIDEO_PROMPTS && (
            <VideoProductionWorkspace storyboard={storyboard} onUpdateStoryboard={setStoryboard} lang={lang} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
