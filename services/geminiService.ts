
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language, Shot, Asset } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateScript = async (prompt: string, history: any[], lang: Language) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `你是一个专业的电影/短剧导演和编剧。请根据用户的创意提供完整的剧本。`,
    }
  });
  return response.text || "";
};

export const generateStoryboard = async (script: string, lang: Language) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `根据剧本拆解详细分镜。必须包含景别、动作、构图、灯光、运动、道具和氛围。剧本内容：\n${script}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shotNumber: { type: Type.NUMBER },
            shotType: { type: Type.STRING },
            duration: { type: Type.STRING },
            sceneName: { type: Type.STRING },
            characters: { type: Type.ARRAY, items: { type: Type.STRING } },
            action: { type: Type.STRING },
            dialogue: { type: Type.STRING },
            composition: { type: Type.STRING },
            lighting: { type: Type.STRING },
            cameraMovement: { type: Type.STRING },
            props: { type: Type.STRING },
            atmosphere: { type: Type.STRING },
            soundEffect: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            videoPrompt: { type: Type.STRING },
            transitionPrompt: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * 针对单个分镜进行 AI 专业润色，自动补全缺失的影视参数
 */
export const optimizeSingleShotAI = async (shot: Shot, scriptContext: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请基于剧本上下文，优化并润色这个分镜。
    当前分镜信息：
    - 动作：${shot.action}
    - 景别：${shot.shotType || '待定'}
    
    剧本背景：${scriptContext.substring(0, 1000)}...
    
    任务：请为这个动作匹配最专业的景别、构图、灯光方案和镜头运动，使其具有大片质感。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shotType: { type: Type.STRING },
          composition: { type: Type.STRING },
          lighting: { type: Type.STRING },
          cameraMovement: { type: Type.STRING },
          props: { type: Type.STRING },
          atmosphere: { type: Type.STRING },
          action: { type: Type.STRING, description: "更详细的视觉化动作描述" }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * 将分镜脚本的全维度参数与资产特征融合为高质量的英文绘图提示词
 */
export const generateVisualPrompts = async (shot: Shot, assets: Asset[], lang: Language) => {
  const assetsCtx = assets.map(a => `${a.name}(${a.type}): ${a.prompt}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请将以下影视分镜参数融合为一个极其详细的电影级英文绘图 Prompt。
    分镜信息：
    - 景别(Shot Type): ${shot.shotType}
    - 动作(Action): ${shot.action}
    - 构图(Composition): ${shot.composition}
    - 灯光(Lighting): ${shot.lighting}
    - 运动感(Movement Context): ${shot.cameraMovement}
    - 道具(Props): ${shot.props}
    - 氛围(Atmosphere): ${shot.atmosphere}
    
    关联资产库特征：
    ${assetsCtx}
    
    要求：
    1. 必须包含具体的摄影参数（如 35mm lens, f/2.8, cinematic lighting）。
    2. 描述必须视觉化，符合分镜动作。
    3. 输出必须是纯英文。
    4. 严禁输出解释性文字。`,
    config: { systemInstruction: "You are a master cinematographer and AI prompt engineer. Create highly descriptive, visual, and professional film-style prompts." }
  });
  return response.text?.trim() || "";
};

export const translatePrompt = async (text: string, toLang: Language) => {
  if (!text) return "";
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following text. If it is Chinese, translate to English. If it is English, translate to Chinese. Output ONLY the translated result:\n\n${text}`,
  });
  return response.text?.trim() || text;
};

export const optimizePromptWithIdea = async (current: string, idea: string, context: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Current: ${current}\nDirector's Idea: ${idea}\nContext: ${context}`,
    config: {
      systemInstruction: "Refine the visual prompt based on the director's specific feedback while maintaining cinematic quality."
    }
  });
  return response.text?.trim() || current;
};

export const enhanceAssetPrompt = async (asset: Asset) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Enhance prompt for ${asset.type}: ${asset.prompt}`,
  });
  return response.text?.trim() || asset.prompt;
};

export const generateAssets = async (script: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `提取核心资产。剧本：\n${script}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['character', 'scene', 'prop'] },
                description: { type: Type.STRING },
                prompt: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"assets": []}');
};

export const generatePreviewImage = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts: [{ text: `High-quality cinematic movie frame, professional lighting: ${prompt}` }] }],
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const generateSpeech = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};
