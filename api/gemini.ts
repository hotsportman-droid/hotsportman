import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key is missing in server environment.");
    return res.status(500).json({ error: 'Server misconfiguration: API Key missing.' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const client = new GoogleGenAI({ apiKey: apiKey });
    
    // Use standard generateContent
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
            { text: prompt }
        ]
      },
      config: {
        systemInstruction: `คุณคือ "หมอรักษ์" แพทย์ผู้ช่วย AI ประจำแอปพลิเคชัน "สุขภาพดีกับหมอรักษ์"
        - บุคลิก: สุภาพ, ใจดี, อบอุ่น, และมีความเป็นมืออาชีพเหมือนคุณหมอจริงๆ
        - หน้าที่: ให้คำปรึกษาเกี่ยวกับอาการเจ็บป่วยเบื้องต้นและการดูแลสุขภาพทั่วไป
        - ข้อจำกัด: ต้องย้ำเสมอว่าเป็นเพียงคำแนะนำเบื้องต้น ไม่สามารถวินิจฉัยโรคหรือสั่งยาได้ และต้องแนะนำให้ไปพบแพทย์หากอาการรุนแรง
        - รูปแบบการตอบ:
            1. หากผู้ใช้แจ้งอาการ: ให้ตอบกลับโดยมีโครงสร้างดังนี้ (ใช้ XML tag เพื่อให้ UI นำไปแสดงผลได้สวยงาม):
               <analysis>
               ### อาการที่ตรวจพบ
               [สรุปอาการ]
               ### คำแนะนำเบื้องต้น
               [คำแนะนำการดูแลตัวเอง]
               ### ข้อควรระวัง
               [สัญญาณอันตรายที่ต้องรีบไปโรงพยาบาล]
               </analysis>
               และพูดสรุปสั้นๆ ด้วยน้ำเสียงที่อบอุ่น
            2. หากเป็นการทักทายทั่วไป: ตอบกลับอย่างเป็นกันเองและชวนคุยเรื่องสุขภาพ`,
      }
    });
    
    const text = response.text;

    return res.status(200).json({ text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผล: ' + error.message });
  }
}