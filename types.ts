
export enum WorkflowStep {
  SCRIPT = 'SCRIPT',
  STORYBOARD = 'STORYBOARD',
  ASSETS = 'ASSETS',
  IMAGE_PROMPTS = 'IMAGE_PROMPTS',
  VIDEO_PROMPTS = 'VIDEO_PROMPTS'
}

export type Language = 'zh' | 'en';

export interface Asset {
  id: string;
  name: string;
  type: 'character' | 'scene' | 'prop';
  description: string;
  prompt: string; 
}

export interface Shot {
  id: string;
  shotNumber: number;
  shotType: string;      // 景别 (ECU, CU, MCU, MS, WS, etc.)
  duration: string;
  sceneName: string;
  location: string;
  characters: string[];
  composition: string;   // 构图 (Rule of thirds, Leading lines, etc.)
  action: string;        // 动作描述
  dialogue: string;
  lighting: string;      // 灯光 (Golden hour, High-key, Rembrandt, etc.)
  props: string;         // 道具
  cameraMovement: string;// 镜头运动 (Pan, Tilt, Zoom, Dolly, etc.)
  atmosphere: string;    // 环境氛围
  soundEffect: string;   // 音效/环境音
  visualPrompt: string;
  videoPrompt: string;
  transitionPrompt: string;
  isStale?: boolean;
}

export interface ScriptDraft {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Script {
  currentDraftId: string;
  drafts: ScriptDraft[];
}
