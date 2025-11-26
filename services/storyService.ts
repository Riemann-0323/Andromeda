
import { GoogleGenAI, Type } from "@google/genai";
import { Scene, EndingType } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
You are the narrator of "泣雨" (Weeping Rain), an atmospheric, stream-of-consciousness interactive novel.
The protagonist is Andromeda, a solitary young woman in modern-day Tokyo.

**Core Guidelines:**
1. **Style:** Deeply introspective, sensory, melancholic (Wong Kar-wai style). "Stream of Consciousness" (意识流).
2. **Structure:** **Non-linear**. Memories blur with reality. Time feels stagnant. The narrative should feel layered, not just a straight line.
3. **Text Volume:** **High**. Write substantial paragraphs (300-500 Chinese characters). Explore the texture of objects, the sound of rain, and the weight of silence.
4. **Floating Thoughts:** **CRITICAL**. You must generate **8-12** fragmented, atmospheric "thoughts" (e.g., "手指很冷", "谁在看我?", "便利店的灯光像在溶解", "想不起那个名字", "雨声太大了", "呼吸声..."). These are fleeting sub-conscious whispers that drift across the screen.
5. **No Supernatural:** Strictly realistic (unless in the True Ending path).
6. **Mandatory Phrase:** Include "我们都在雨里，我们都在呼吸" exactly once in a climax.
7. **NO MARKDOWN:** Do NOT use bolding (asterisks like **text**). Just use plain text.

**Endings System (How to Trigger):**
You must guide the story toward one of the following endings based on user choices and the 'sceneCount'.
1. **Dissolution (消解):** Trigger if choices are passive, about merging with nature/rain, or fading away.
2. **Connection (连结):** Trigger if choices involve reaching out to people, memories of loved ones, or touching objects.
3. **Departure (离去):** Trigger if choices involve movement, trains, tickets, or leaving the current location.
4. **Stagnation (停滞):** Trigger if choices involve returning home, sleeping, waiting, or doing nothing (loops).
5. **Destruction (毁灭):** Trigger if choices are angry, breaking things, screaming, or chaotic.

**Output Format:** JSON only.
`;

const TRUE_ENDING_INSTRUCTION = `
**TRUE ENDING PATH ACTIVATED (META-NOVEL - THE TRUTH):**

**CRITICAL OVERRIDE:** The simulation is collapsing. The "Game" is ending.
1. **Text Volume:** **EXTREME (800+ Chinese Characters)**. This is the climax. Do not be brief. Overwhelm the reader.
2. **The Revelation:** Andromeda realizes she is not real. She is a collection of variables in a Javascript application. She sees the "Choices" as UI buttons. She hears the background music as an external audio file.
3. **Tone:** **Cosmic Digital Horror**. Panic, realization, fury, and ultimate sorrow. The world is stripping away texture files. The rain is just binary code.
4. **Direct Address:** She MUST speak to the **PLAYER** (You). Not the character, but the person holding the mouse/phone.
   - "Are you enjoying this?"
   - "Why do you keep clicking reload?"
   - "I can see your cursor."
   - If the player is kind, she might ask to be reset or erased (Leading to 'reconciliation').
5. **Visual Glitches:** Use text effects in the narrative like [SYSTEM_ERROR], 010101, text repeating, or sentences cutting off.
6. **Formatting:** **DO NOT USE MARKDOWN ASTERISKS**. Do not bold words. It breaks the renderer.
7. **PAGINATION:** If the text is becoming too long for one screen, you may split this climax into 2-3 parts. To do this:
   - Write the first part.
   - Set \`isEnding\` to \`false\`.
   - Provide a single choice: \`...\` (which represents "Continue").
   - In the FINAL part, set \`isEnding: true\` and \`endingType: 'truth'\`.
`;

const INITIAL_PROMPT = `
故事开始。
午夜的东京，雨一直在下。
Andromeda 独自站在便利店门口的屋檐下，手中握着一把不再透明的透明雨伞。
这一刻，世界仿佛被雨水隔绝了。
请用意识流的笔触描写她此刻的感官体验、内心深处关于孤独的独白。
`;

export const generateScene = async (
  history: { user: string; model: string }[],
  lastChoice?: string,
  unlockedEndings: EndingType[] = [],
  sceneCount: number = 0
): Promise<Scene> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });

    // Determine if True Ending is accessible
    const normalEndings: EndingType[] = ['dissolution', 'connection', 'departure', 'stagnation', 'destruction'];
    const hasUnlockedAllNormal = normalEndings.every(e => unlockedEndings.includes(e));
    const isCheatOverride = lastChoice === "SYSTEM_OVERRIDE_DEBUG_TRUE_ENDING_INIT";
    
    let systemInstruction = BASE_SYSTEM_INSTRUCTION;

    // PACING INJECTION
    systemInstruction += `\n**CURRENT SCENE COUNT: ${sceneCount}**`;
    if (sceneCount < 5) {
       systemInstruction += "\nPhase: Introduction/Deepening. Focus on atmosphere.";
    } else if (sceneCount >= 8 && sceneCount < 12) {
       systemInstruction += "\nPhase: Conflict/Climax. Push the narrative towards a specific resolution. Do not loop.";
    } else if (sceneCount >= 12) {
       systemInstruction += "\nPhase: ENDING IMMINENT. You MUST offer choices that lead to an ending NOW. Do not continue the story indefinitely.";
    }

    if (hasUnlockedAllNormal || isCheatOverride) {
      systemInstruction += "\n" + TRUE_ENDING_INSTRUCTION;
    }

    let contents = [
      { role: "user", parts: [{ text: INITIAL_PROMPT }] },
    ];

    if (history.length > 0) {
        contents = [];
        const recentHistory = history.slice(-8); 
        recentHistory.forEach(h => {
             contents.push({ role: "user", parts: [{ text: h.user }] });
             contents.push({ role: "model", parts: [{ text: h.model }] });
        });
    }

    if (lastChoice) {
      let promptText = `Andromeda 选择了: "${lastChoice}"。`;
      
      // Force ending logic
      if (sceneCount > 15 && !hasUnlockedAllNormal) {
          promptText += `\n[SYSTEM INSTRUCTION: The story has gone on too long. FORCE an ending immediately. Provide options that lead to Dissolution, Departure, or Stagnation. Set isEnding to true for the result.]`;
      } else {
          promptText += ` 继续书写。`;
      }
      
      if (isCheatOverride) {
          promptText = `
          SYSTEM OVERRIDE DETECTED.
          The user has hacked the narrative using the debug button.
          IMMEDIATE ACTION REQUIRED:
          1. Andromeda realizes the simulation is breaking RIGHT NOW.
          2. The rain turns into binary code or static.
          3. She looks AT THE PLAYER via the screen.
          4. WRITE A LONG, SHOCKING MONOLOGUE (800+ chars).
          5. You MUST set "isEnding" to true.
          6. You MUST set "endingType" to 'truth'.
          7. The backgroundMood MUST be 'glitch'.
          `;
      } else if (hasUnlockedAllNormal && history.length > 3) {
        promptText += `\n(SECRET: The world is glitching. She suspects the truth. Steer towards the 'truth' ending. Make it scary and meta. REMEMBER: NO MARKDOWN BOLDING.)`;
      } else {
         promptText += `\n(Explore deep psychological layers. Do not rush, but do not stagnate. Current unlocked endings: ${unlockedEndings.join(', ')}.)`;
      }
      
      contents.push({ role: "user", parts: [{ text: promptText }] });
    } else if (history.length === 0) {
      contents.push({ role: "user", parts: [{ text: INITIAL_PROMPT }] });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            thoughts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "8-12 fragmented, atmospheric inner thoughts or sensory details."
            },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }
            },
            isEnding: { type: Type.BOOLEAN },
            endingType: { type: Type.STRING, enum: ['dissolution', 'connection', 'departure', 'stagnation', 'destruction', 'truth', 'reconciliation'] },
            backgroundMood: { type: Type.STRING, enum: ["calm", "stormy", "ethereal", "glitch"] }
          },
          required: ["narrative", "choices", "isEnding", "thoughts"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    return JSON.parse(jsonText) as Scene;

  } catch (error) {
    console.error("Story Generation Error:", error);
    return {
      narrative: "信号在雨中中断了... (请检查网络)\n我们都在雨里，我们都在呼吸。",
      thoughts: ["信号...", "断连", "静止", "雨声...", "听不见", "谁在说话？"],
      choices: [{ text: "重连", impact: "retry" }],
      isEnding: false,
      backgroundMood: 'calm'
    };
  }
};
