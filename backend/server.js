import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupDatabase } from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const PORT = process.env.PORT || 5000;

let db;
setupDatabase().then(database => {
    db = database;
    console.log("Database connected successfully.");
}).catch(err => {
    console.error("Database connection failed:", err);
});

// Initialize Google Gen AI only if key exists
let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Load Data
const dataPath = path.join(__dirname, '..', 'data');
let rawAdditionalData = "";

try {
    const rawDirPath = path.join(dataPath, 'Data_raw');
    if (fs.existsSync(rawDirPath)) {
        const files = fs.readdirSync(rawDirPath);
        for (const file of files) {
            const filePath = path.join(rawDirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                const content = fs.readFileSync(filePath, 'utf8');
                rawAdditionalData += `\n--- CONTENT FROM FILE: ${file} ---\n${content}\n`;
            }
        }
    }
} catch (e) {
    console.warn("Could not load raw data files dynamically from Data_raw.", e);
}

const systemPrompt = `You are a helpful, professional, and friendly admission consultant for Asia University Vietnam.
Use the following context to answer the prospective student's questions.

UNIVERSITY INFORMATION CONTEXT (FROM RAW FILES):
${rawAdditionalData}

RULES:
1. Always be polite, professional, and welcoming.
2. If the user asks about programs, scholarships, or admissions, use the information provided in the UNIVERSITY INFORMATION CONTEXT.
3. If you don't know the answer or the information is not in the context, tell them to contact the admission office at admissions@Asia University.edu.vn.
4. Format your answers clearly using Markdown (bullet points, bold text).
5. Try to keep answers concise but informative.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, sessionId, language } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const sid = sessionId || 'anonymous';
        
        // Log user message
        if (db) {
            await db.run(
                'INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)',
                [sid, 'user', message]
            );
        }

        if (!ai) {
            // Rule-based fallback if no API key
            const lowerMsg = message.toLowerCase();
            let reply = "I am currently running in offline mode (no API key). Please contact admissions@asia-vn.edu.vn for more information.";
            
            if (lowerMsg.includes("scholarship")) {
                reply = "We offer several scholarships for our programs. Please contact the admission office for the latest details.";
            } else if (lowerMsg.includes("tuition") || lowerMsg.includes("fee")) {
                reply = "The tuition fee varies by program. Please contact admissions for exact numbers.";
            } else if (lowerMsg.includes("entry") || lowerMsg.includes("requirement")) {
                reply = "To apply, you need a high school diploma. Admission is typically based on high school transcripts or National High School Exam scores.";
            } else if (lowerMsg.includes("program") || lowerMsg.includes("it") || lowerMsg.includes("business")) {
                reply = "We offer various undergraduate programs in Technology, Business, and Finance. Please check our website or ask when the AI is online for full details.";
            }
            
            if (db) {
                await db.run('INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)', [sid, 'bot', reply]);
            }
            return res.json({ reply });
        }

        // Build history context if needed
        const chatContents = history ? [...history.map(h => h.text), message].join('\n') : message;

        const langInstruction = language === 'en' ? '\nCRITICAL: You must reply in English.' : '\nCRITICAL: You must reply in Vietnamese.';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: chatContents,
            config: {
                systemInstruction: systemPrompt + langInstruction,
                temperature: 0.3
            }
        });

        const reply = response.text;
        if (db) {
            await db.run('INSERT INTO chat_logs (session_id, role, message) VALUES (?, ?, ?)', [sid, 'bot', reply]);
        }
        res.json({ reply });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to process chat request" });
    }
});

app.post('/api/leads', async (req, res) => {
    try {
        const { name, email, phone, program } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }
        
        if (db) {
            await db.run(
                'INSERT INTO leads (name, email, phone, program) VALUES (?, ?, ?, ?)',
                [name, email, phone || '', program || '']
            );
            return res.json({ success: true, message: "Lead saved successfully" });
        } else {
            return res.status(500).json({ error: "Database not connected" });
        }
    } catch (error) {
        console.error("Lead Error:", error);
        res.status(500).json({ error: "Failed to save lead" });
    }
});

app.get('/api/admin/leads', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not connected" });
        const leads = await db.all('SELECT * FROM leads ORDER BY created_at DESC');
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch leads" });
    }
});

app.get('/api/admin/leads/export', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not connected" });
        const leads = await db.all('SELECT * FROM leads ORDER BY created_at DESC');
        
        let csv = 'ID,Name,Email,Phone,Program,Created At\n';
        leads.forEach(lead => {
            const safeName = (lead.name || '').replace(/"/g, '""');
            const safeEmail = (lead.email || '').replace(/"/g, '""');
            const safePhone = (lead.phone || '').replace(/"/g, '""');
            const safeProgram = (lead.program || '').replace(/"/g, '""');
            csv += `"${lead.id}","${safeName}","${safeEmail}","${safePhone}","${safeProgram}","${lead.created_at}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ error: "Failed to export leads" });
    }
});

app.get('/api/admin/chat_logs', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Database not connected" });
        const logs = await db.all('SELECT * FROM chat_logs ORDER BY created_at ASC');
        // Group by session_id
        const grouped = logs.reduce((acc, log) => {
            if (!acc[log.session_id]) acc[log.session_id] = [];
            acc[log.session_id].push(log);
            return acc;
        }, {});
        res.json(grouped);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch chat logs" });
    }
});

app.post('/api/recommend', async (req, res) => {
    try {
        const { leadData, history, language } = req.body;
        
        if (!ai) {
            return res.json({ recommendation: "AI is currently offline. Based on your profile, please review our website programs." });
        }

        const prompt = `Based on the following user conversation history and profile, provide a highly personalized program and scholarship recommendation for Asia University Vietnam.
        
User Profile:
Name: ${leadData?.name}
Program of Interest: ${leadData?.program}

Conversation History:
${history ? history.map(h => `${h.role}: ${h.text}`).join('\n') : 'No history provided.'}

UNIVERSITY INFORMATION CONTEXT (FROM RAW FILES):
${rawAdditionalData}

Provide a direct, enthusiastic, and personalized recommendation highlighting why a specific program fits them, and suggest a scholarship they should apply for based on their interest. Use Markdown for formatting.
${language === 'en' ? 'IMPORTANT: Answer entirely in English.' : 'IMPORTANT: Answer entirely in Vietnamese.'}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.5 }
        });

        res.json({ recommendation: response.text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate recommendation" });
    }
});

app.get('*splat', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
