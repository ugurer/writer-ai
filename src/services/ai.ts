import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';
import { API_KEY } from '@env';
import { Character, PlotPoint, WorldElement, AIResponse, StyleTarget } from '../types';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY bulunamadı! Lütfen .env dosyasını kontrol edin.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export type AIResponse = {
  text: string;
  tokens: number;
};

// JSON yanıtlarını güvenli bir şekilde parse etmek için yardımcı fonksiyon
export const safeJsonParse = (text: string) => {
  try {
    // Önce doğrudan JSON parse'ı deneyelim
    try {
      return JSON.parse(text);
    } catch {
      // Doğrudan parse başarısız olursa, JSON bloğunu bulmaya çalışalım
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON verisi bulunamadı');
      }

      const jsonStr = jsonMatch[0];
      // JSON string'ini temizleyelim
      const cleanJsonStr = jsonStr
        .replace(/\n/g, '\\n') // Yeni satırları escape edelim
        .replace(/\r/g, '\\r') // Satır başlarını escape edelim
        .replace(/\t/g, '\\t') // Tab karakterlerini escape edelim
        .replace(/\\/g, '\\\\') // Ters eğik çizgileri escape edelim
        .replace(/"/g, '\\"'); // Çift tırnakları escape edelim

      return JSON.parse(cleanJsonStr);
    }
  } catch (error) {
    console.error('JSON parse hatası:', error);
    // Varsayılan bir yanıt döndürelim
    return {
      text: 'JSON parse hatası oluştu. Lütfen tekrar deneyin.',
      error: (error as Error).message
    };
  }
};

export const generateText = async (prompt: string): Promise<AIResponse> => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('API anahtarı bulunamadı');
    }

    console.log('AI isteği gönderiliyor:', prompt);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.9,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI yanıtı alındı:', text);
    return {
      text,
      tokens: text.length / 4,
    };
  } catch (error) {
    console.error('AI isteği sırasında hata:', error);
    throw new Error('AI yanıtı alınamadı: ' + (error as Error).message);
  }
};

// Karakter detayları için özel fonksiyon
export const generateCharacterDetails = async (name: string, role: string): Promise<{
  appearance: string;
  personality: string[];
  background: string;
  goals: string[];
  conflicts: string[];
  voice: string;
}> => {
  const prompt = `"${name}" isimli bir ${role} için detaylı bir profil oluştur.
  
  Şu başlıkları içermeli:
  - Fiziksel görünüm
  - Kişilik özellikleri (en az 5)
  - Geçmiş hikayesi
  - Hedefler ve motivasyonlar (en az 3)
  - İç ve dış çatışmalar (en az 2)
  - Konuşma tarzı ve ses karakteri

  Yanıtı tam olarak şu JSON formatında ver:
  {
    "appearance": "...",
    "personality": ["...", "..."],
    "background": "...",
    "goals": ["...", "..."],
    "conflicts": ["...", "..."],
    "voice": "..."
  }`;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Olay örgüsü noktası için özel fonksiyon
export const generatePlotPoint = async (title: string, context: string): Promise<{
  description: string;
  impact: string;
  characters: string[];
}> => {
  const prompt = `"${title}" başlıklı bir olay örgüsü noktası oluştur.
  Bağlam: ${context}
  
  Yanıtı tam olarak şu JSON formatında ver:
  {
    "description": "...",
    "impact": "...",
    "characters": ["...", "..."]
  }`;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Dünya öğesi için özel fonksiyon
export const generateWorldElement = async (name: string, type: string): Promise<{
  description: string;
  details: Record<string, string | string[]>;
}> => {
  const prompt = `"${name}" isimli bir ${type} için detaylı bir açıklama oluştur.
  
  Yanıtı tam olarak şu JSON formatında ver:
  {
    "description": "...",
    "details": {
      "key1": "...",
      "key2": ["...", "..."],
      "key3": "..."
    }
  }`;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Metin analizi için özel fonksiyon
export const analyzeText = async (text: string, type: string): Promise<{
  score: number;
  feedback: string[];
  suggestions: string[];
}> => {
  const prompt = `Aşağıdaki metni ${type} açısından analiz et:

  ${text}
  
  Yanıtı tam olarak şu JSON formatında ver:
  {
    "score": 0-100 arası puan,
    "feedback": ["...", "..."],
    "suggestions": ["...", "..."]
  }`;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Diyalog geliştirme için özel fonksiyon
export const generateDialogue = async (
  character1: string,
  character2: string,
  context: string
): Promise<{
  dialogue: string;
  notes: string[];
}> => {
  const prompt = `${character1} ve ${character2} arasında geçen bir diyalog yaz.
  Bağlam: ${context}
  
  Yanıtı tam olarak şu JSON formatında ver:
  {
    "dialogue": "...",
    "notes": ["...", "..."]
  }`;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Yazı geliştirme için özel fonksiyon
export const improveWriting = async (text: string, aspect: string): Promise<{
  improved: string;
  changes: string[];
  suggestions: string[];
}> => {
  const prompt = `Sen deneyimli bir yazar ve editörsün. Aşağıdaki metni ${aspect} açısından geliştirmeni istiyorum.
  Metin akıcı, sürükleyici ve okuyucuyu içine çeken bir tarzda olmalı.
  
  İşte metin:
  ${text}

  Lütfen şu noktalara dikkat et:
  1. Hikaye anlatımını güçlendir
  2. Betimlemeleri zenginleştir
  3. Karakterlerin duygularını ve düşüncelerini daha derinlikli yansıt
  4. Diyalogları daha doğal ve etkileyici hale getir
  5. Metin içindeki geçişleri yumuşat
  6. Okuyucunun ilgisini canlı tut
  7. Gereksiz tekrarları ve uzatmaları kaldır

  Yanıtını tam olarak aşağıdaki JSON formatında ver ve başka hiçbir şey ekleme:
  {
    "improved": "geliştirilmiş metin buraya",
    "changes": [
      "Yapılan önemli değişiklik 1",
      "Yapılan önemli değişiklik 2",
      "Yapılan önemli değişiklik 3"
    ],
    "suggestions": [
      "Gelecek revizyonlar için öneri 1",
      "Gelecek revizyonlar için öneri 2",
      "Gelecek revizyonlar için öneri 3"
    ]
  }`;

  const response = await generateText(prompt);
  
  try {
    // Önce doğrudan JSON parse'ı deneyelim
    const parsedResponse = JSON.parse(response.text);
    
    // Yanıtı doğrula
    if (!parsedResponse.improved || !parsedResponse.changes || !parsedResponse.suggestions) {
      throw new Error('Geçersiz AI yanıtı formatı');
    }
    
    return {
      improved: parsedResponse.improved,
      changes: Array.isArray(parsedResponse.changes) ? parsedResponse.changes : [parsedResponse.changes],
      suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : [parsedResponse.suggestions]
    };
  } catch (error) {
    // Başarısız olursa, JSON bloğunu bulmaya çalışalım
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON verisi bulunamadı:', error);
      return {
        improved: text,
        changes: ['Metin geliştirilemedi: JSON parse hatası'],
        suggestions: ['Lütfen daha kısa bir metin deneyin veya metni bölümlere ayırın']
      };
    }

    const jsonStr = jsonMatch[0]
      .replace(/\\n/g, ' ')  // Yeni satırları boşluklarla değiştirelim
      .replace(/\\"/g, '"')  // Escape edilmiş çift tırnakları düzeltelim
      .replace(/\\/g, '\\\\') // Kalan ters eğik çizgileri escape edelim
      .replace(/\r/g, '') // Satır başı karakterlerini kaldıralım
      .replace(/\t/g, ' ') // Tab karakterlerini boşluklarla değiştirelim
      .replace(/\s+/g, ' '); // Birden fazla boşluğu tek boşluğa indirelim

    try {
      const parsedResponse = JSON.parse(jsonStr);
      return {
        improved: parsedResponse.improved || text,
        changes: Array.isArray(parsedResponse.changes) ? parsedResponse.changes : [parsedResponse.changes || 'Değişiklikler belirtilmedi'],
        suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : [parsedResponse.suggestions || 'Öneriler belirtilmedi']
      };
    } catch (innerError) {
      console.error('JSON parse hatası:', innerError);
      return {
        improved: text,
        changes: ['Metin geliştirilemedi: JSON parse hatası'],
        suggestions: ['Lütfen daha kısa bir metin deneyin veya metni bölümlere ayırın']
      };
    }
  }
};

// Bölüm taslağı için özel fonksiyon
export const generateChapterOutline = async (
  title: string,
  previousChapter: string
): Promise<{
  outline: string[];
  keyPoints: string[];
  suggestions: string[];
}> => {
  const prompt = `"${title}" başlıklı bölüm için bir taslak oluştur.
  Önceki bölüm: ${previousChapter}
  
  Yanıtı tam olarak şu JSON formatında ver:
  {
    "outline": ["...", "..."],
    "keyPoints": ["...", "..."],
    "suggestions": ["...", "..."]
  }`;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

export const generateCharacter = async (name: string, genre: string): Promise<AIResponse> => {
  const prompt = `
    "${name}" isimli bir karakter yarat.
    Tür: ${genre}
    
    Lütfen aşağıdaki formatta yanıt ver:
    {
      "name": "${name}",
      "description": "Fiziksel ve kişilik özellikleri",
      "background": "Geçmiş hikayesi",
      "goals": "Hedefleri ve motivasyonları",
      "traits": ["Özellik 1", "Özellik 2", "Özellik 3"]
    }
  `;
  return generateText(prompt);
};

export const analyzeRelationship = async (
  character1: string,
  character2: string,
  context: string
): Promise<AIResponse> => {
  const prompt = `
    ${character1} ve ${character2} arasındaki ilişkiyi analiz et.
    Bağlam: ${context}
    
    Lütfen aşağıdaki formatta yanıt ver:
    {
      "type": "friend|enemy|family|romantic|other",
      "description": "İlişkinin detaylı açıklaması",
      "dynamics": "İlişki dinamikleri",
      "potential": "Gelişim potansiyeli",
      "conflicts": ["Olası çatışma 1", "Olası çatışma 2"]
    }
  `;
  return generateText(prompt);
};

export const suggestImprovements = async (text: string): Promise<AIResponse> => {
  const prompt = `Aşağıdaki metin için geliştirme önerileri sun. Gramer, stil ve içerik açısından değerlendir:

${text}`;
  return generateText(prompt);
};

// Yeni tip tanımlamaları
type Context = {
  characters?: Character[];
  plotPoints?: PlotPoint[];
  worldElements?: WorldElement[];
  currentChapter?: string;
  tone?: string;
};

type InteractionResult = {
  dialogue: string;
  reactions: {
    [characterId: string]: string;
  };
  consequences: string[];
};

type PlotSuggestion = {
  title: string;
  description: string;
  involvedCharacters: string[];
  emotionalImpact: string;
  tension: number;
};

type WorldExpansion = {
  aspect: string;
  details: string | string[];
  relatedElements?: string[];
  potentialConflicts?: string[];
};

type StyleAnalysis = {
  currentStyle: {
    tone: string;
    pacing: string;
    detail: string;
  };
  suggestions: Array<{
    type: string;
    original: string;
    improved: string;
    explanation: string;
  }>;
};

// Bağlam-farkında içerik üretimi
export const generateWithContext = async (prompt: string, context: Context): Promise<AIResponse> => {
  const contextPrompt = `
    Mevcut Karakterler: ${context.characters?.map(c => `${c.name} (${c.role})`).join(', ')}
    Olay Örgüsü: ${context.plotPoints?.map(p => p.title).join(' -> ')}
    Dünya Öğeleri: ${context.worldElements?.map(w => w.name).join(', ')}
    Bölüm: ${context.currentChapter}
    Ton: ${context.tone}

    Bu bağlamda: ${prompt}
  `;

  return generateText(contextPrompt);
};

// Karakter etkileşimleri için özel fonksiyon
export const generateCharacterInteraction = async (
  character1: Character,
  character2: Character,
  situation: string
): Promise<InteractionResult> => {
  const prompt = `
    Karakter 1: ${character1.name}
    Özellikleri: ${character1.personality.join(', ')}
    Hedefleri: ${character1.goals.join(', ')}

    Karakter 2: ${character2.name}
    Özellikleri: ${character2.personality.join(', ')}
    Hedefleri: ${character2.goals.join(', ')}

    Durum: ${situation}

    Yanıtı şu formatta ver:
    {
      "dialogue": "...",
      "reactions": {
        "${character1.id}": "...",
        "${character2.id}": "..."
      },
      "consequences": ["...", "..."]
    }
  `;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Olay örgüsü önerileri için
export const suggestPlotDevelopments = async (
  currentPlot: PlotPoint[],
  characters: Character[],
  targetEmotion?: string
): Promise<{ suggestions: PlotSuggestion[] }> => {
  const prompt = `
    Mevcut Olay Örgüsü:
    ${currentPlot.map(p => `- ${p.title}: ${p.description}`).join('\n')}

    Karakterler:
    ${characters.map(c => `- ${c.name} (${c.role})`).join('\n')}

    ${targetEmotion ? `Hedef Duygu: ${targetEmotion}` : ''}

    Olay örgüsünü geliştirecek 3 öneri sun. JSON formatında yanıt ver:
    {
      "suggestions": [
        {
          "title": "...",
          "description": "...",
          "involvedCharacters": ["..."],
          "emotionalImpact": "...",
          "tension": 0-100
        }
      ]
    }
  `;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Dünya geliştirme önerileri
export const expandWorldBuilding = async (
  element: WorldElement,
  depth: 'detail' | 'connection' | 'conflict'
): Promise<{ expansions: WorldExpansion[] }> => {
  const prompt = `
    Öğe: ${element.name}
    Tür: ${element.type}
    Mevcut Detaylar: ${JSON.stringify(element.details)}

    ${depth === 'detail' ? 'Bu öğeyi daha detaylı hale getir.' :
      depth === 'connection' ? 'Bu öğenin diğer öğelerle olası bağlantılarını keşfet.' :
      'Bu öğeyle ilgili olası çatışmaları belirle.'}

    Yanıtı şu formatta ver:
    {
      "expansions": [
        {
          "aspect": "...",
          "details": "..." veya ["...", "..."],
          "relatedElements": ["..."],
          "potentialConflicts": ["..."]
        }
      ]
    }
  `;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
};

// Stil ve ton analizi/önerileri
export const analyzeAndSuggestStyle = async (
  text: string,
  targetStyle?: {
    tone?: string;
    pacing?: string;
    detail?: 'minimal' | 'balanced' | 'rich';
  }
): Promise<StyleAnalysis> => {
  const prompt = `
    Metin: ${text}

    ${targetStyle ? `
    Hedef Stil:
    - Ton: ${targetStyle.tone}
    - Tempo: ${targetStyle.pacing}
    - Detay: ${targetStyle.detail}
    ` : ''}

    Mevcut stili analiz et ve iyileştirme önerileri sun. JSON formatında yanıt ver:
    {
      "currentStyle": {
        "tone": "...",
        "pacing": "...",
        "detail": "..."
      },
      "suggestions": [
        {
          "type": "...",
          "original": "...",
          "improved": "...",
          "explanation": "..."
        }
      ]
    }
  `;

  const response = await generateText(prompt);
  return safeJsonParse(response.text);
}; 