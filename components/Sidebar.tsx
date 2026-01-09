
import React from 'react';
import { WorkflowStep, Language } from '../types';
import { Clapperboard, Film, UserCircle2, Sparkles, LayoutDashboard, Video, Image as ImageIcon } from 'lucide-react';

interface SidebarProps {
  currentStep: WorkflowStep;
  onStepChange: (step: WorkflowStep) => void;
  lang: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStep, onStepChange, lang }) => {
  const t = {
    zh: { script: '剧本创作', storyboard: '分镜脚本', assets: '角色资产', img: '分镜出图', vid: '视频制作', render: '渲染状态' },
    en: { script: 'Script', storyboard: 'Storyboard', assets: 'Assets', img: 'Image Concept', vid: 'Video Prod', render: 'Render State' }
  }[lang];

  const steps = [
    { id: WorkflowStep.SCRIPT, label: t.script, icon: Clapperboard, color: 'text-emerald-400' },
    { id: WorkflowStep.STORYBOARD, label: t.storyboard, icon: Film, color: 'text-blue-400' },
    { id: WorkflowStep.ASSETS, label: t.assets, icon: UserCircle2, color: 'text-purple-400' },
    { id: WorkflowStep.IMAGE_PROMPTS, label: t.img, icon: ImageIcon, color: 'text-amber-400' },
    { id: WorkflowStep.VIDEO_PROMPTS, label: t.vid, icon: Video, color: 'text-rose-400' },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg"><LayoutDashboard className="text-white w-6 h-6" /></div>
        <div><h2 className="font-bold text-lg leading-tight">CineAI</h2><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Studio v1.0</p></div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          return (
            <button key={step.id} onClick={() => onStepChange(step.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive ? 'bg-gray-800 text-white shadow-inner' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}>
              <Icon className={`w-5 h-5 ${isActive ? step.color : 'text-gray-500'}`} /><span className="font-medium text-sm">{step.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
            </button>
          );
        })}
      </nav>
      <div className="p-6 border-t border-gray-800"><div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-800/60"><p className="text-xs text-gray-400 mb-2 font-medium">{t.render}</p><div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 w-1/3 h-full" /></div></div></div>
    </aside>
  );
};

export default Sidebar;
