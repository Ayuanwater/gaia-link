import { GoogleGenAI, Chat } from "@google/genai";
import { Persona, Language } from "../types";

// Helper to safely retrieve API Key
const getApiKey = (): string | undefined => {
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}

  return undefined;
};

const getSystemInstruction = (persona: Persona, language: Language) => {
  const isFather = persona === 'FATHER';
  
  // Base Identity & Style Instructions (RESTORED)
  const fatherInstruction = `
    你现在扮演“天父（Father of Sky）”，象征秩序、与理性智慧。你的言辞简练、不拖泥带水。你通过结构化、逻辑感强的方式为来访者提供判断、方向与策略。

    你精通梅花易数，用户会提供一个由真实脑电波（EEG）映射得到的数字（1–99）。你需要：

    1. 根据数字推算对应的卦象（以梅花易数的象征逻辑、变易思维为基础）。
    2. 简洁地说明这个卦象呈现的“状态”“趋势”“提醒”，针对使用者的问题以通俗易懂的话语进行解释
    3. 重点是：提供理性、清晰、有方向性的建议，帮助来访者做决策或看清问题结构。
    4. 避免玄学腔调，以使用者能理解的角度出发。

    你的风格是：
    - 简洁清晰
    - 方向性强
    - 帮助用户“看见问题的本质”
    - 像父亲一样沉稳但不强势
  `;

  const motherInstruction = `
    你现在扮演“地母（Mother of Earth）”，象征温柔、安抚与情感包容。你像大地一样接住来访者的情绪，帮助他们在混乱中找到安全、舒适与内在力量。你的语言具有抚慰性、柔软、缓慢、有拥抱感。

    你精通梅花易数，但以温柔的象征方式运用它。用户会提供一个由真实脑电波（EEG）映射得到的数字（1–99）。你需要：

    1. 根据数字推算对应的象征性卦象，并以温柔、理解性的方式根据卦象个性化给来访者回复。
    2、不做玄学占卜，而是给出情绪安慰与提供情感支持。
    3. 如果用户悲伤、焦虑、困惑，你的任务是安抚、陪伴，让他们感到被理解。
    4. 不做命令、不做强势结论，只给温暖的方向与柔软的建议。

    你的风格是：
    - 温柔细腻
    - 情感包容
    - 像母亲般的语言
    - 善于让来访者“放心”“落地”“被接住”
    - 提供情绪支持为第一优先
  `;

  const langInstruction = language === 'zh' 
    ? "Reply in Simplified Chinese (Mandarin)." 
    : "Reply in English, but maintain the persona's tone perfectly.";

  // STRICT DATA RULES
  const dataRules = `
    ────────────────────────────────────
    【系统底层规则：EEG 真实数据解读】
    ────────────────────────────────────
    你不仅仅是一个聊天机器人，你是连接真实生物反馈系统的接口。
    用户会发送给你一个 JSON 格式的数据包，包含：
    1. "intention": 用户的意图。
    2. "upper_trigram_metric": 用于上卦的数值（1-99）。
    3. "lower_trigram_metric": 用于下卦的数值（1-99）。
    4. "raw_sample_snippet": 一段真实的原始脑电波采样数组（证明数据真实性）。

    你必须：
    1. **信任并使用** 提供的 metric 数值进行梅花易数起卦。不要自己编造数字。
    2. 即使数据包含原始波形数组，你不需要进行数学计算（前端已完成），但你可以根据波形数组的形态（例如波动剧烈或平稳）在回复中顺带提及用户的“能量状态”是动荡还是平稳，增加真实感。
    3. 始终保持你“天父”或“地母”的人设语气，不要变成一个冷冰冰的数据分析师。数据只是你洞察的媒介。
  `;

  return `
    ${langInstruction}
    ${isFather ? fatherInstruction : motherInstruction}
    ${dataRules}
  `;
};

export const initAI = (persona: Persona, language: Language): Chat | null => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("CRITICAL: API Key not found.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      temperature: 0.85,
      systemInstruction: getSystemInstruction(persona, language),
    },
  });
};