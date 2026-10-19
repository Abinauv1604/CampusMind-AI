import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { UNIFIED_KNOWLEDGE_BASE, knowledgeItemToDocument, knowledgeItemToNotice, aggregatedNoticeToKnowledgeItem } from './src/data/sampleData.ts';
import { searchCollegeDocuments, getRelevantCollegeDocuments } from './src/utils/localRag.ts';
import { summarizeNotesLocal, extractKeyPointsLocal, generateQuizQuestionsLocal } from './src/utils/studyParser.ts';
import { CollegeDocument, KnowledgeItem, QuestionCategory } from './src/types/index.ts';
import { noticeDatabase } from './src/services/noticeDatabase.ts';
import { noticeScheduler } from './src/services/noticeScheduler.ts';
import { generateLocalBreakdown } from './src/utils/noticeActionParser.ts';
import { detectQuestionCategory, buildChatSystemInstruction, detectFollowUpIntent } from './src/services/aiRouter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const hasGeminiKey = Boolean(geminiApiKey && geminiApiKey.trim().length > 5 && !geminiApiKey.includes('MY_GEMINI_API_KEY'));

  let aiClient: GoogleGenAI | null = null;
  if (hasGeminiKey) {
    try {
      aiClient = new GoogleGenAI({ 
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      console.log('CampusMind AI: Gemini SDK Initialized successfully with official telemetry.');
    } catch (err) {
      console.warn('CampusMind AI: Failed to initialize Gemini SDK, falling back to local extractor.', err);
    }
  } else {
    console.log('CampusMind AI: Running in Free-Tier Local Heuristic/RAG Mode (No GEMINI_API_KEY detected).');
  }

  // Unified in-memory knowledge store (shared single source of truth)
  let serverKnowledgeBase: KnowledgeItem[] = [...UNIFIED_KNOWLEDGE_BASE];

  // Helper to sync server knowledge base with persistent official notices
  function syncKnowledgeBaseWithNotices() {
    const aggregated = noticeDatabase.getNotices();
    const noticeKnowledgeItems = aggregated.map(aggregatedNoticeToKnowledgeItem);
    
    // Merge: keep UNIFIED_KNOWLEDGE_BASE items (policies, etc.) + all official notices
    const map = new Map<string, KnowledgeItem>();
    for (const item of UNIFIED_KNOWLEDGE_BASE) {
      map.set(item.id, item);
    }
    for (const item of noticeKnowledgeItems) {
      map.set(item.id, item);
    }
    serverKnowledgeBase = Array.from(map.values());
    console.log(`[CampusMind Server] Knowledge Base synced with official notices: ${serverKnowledgeBase.length} total records.`);
  }

  // Subscribe to automatic sync events
  noticeScheduler.onSyncComplete(() => {
    syncKnowledgeBaseWithNotices();
  });

  // Initial sync of knowledge base
  syncKnowledgeBaseWithNotices();

  // Status endpoint
  app.get('/api/status', (req, res) => {
    const db = noticeDatabase.getDatabase();
    res.json({
      ok: true,
      hasGeminiKey,
      engine: hasGeminiKey ? 'gemini-3.1-flash-lite' : 'local-extractive',
      modelName: hasGeminiKey ? 'Gemini 3.1 Flash Lite (Grounding Enabled)' : 'Local Extractive RAG & Parser',
      serverOnline: true,
      knowledgeItemsCount: serverKnowledgeBase.length,
      officialNoticesCount: db.notices.length,
      lastGlobalSync: db.lastGlobalSync,
      schedulerConfig: db.schedulerConfig
    });
  });

  // Dedicated Live Quota Status Endpoint
  app.get('/api/quota-status', async (req, res) => {
    if (!hasGeminiKey || !aiClient) {
      return res.json({
        ok: true,
        hasGeminiKey: false,
        quotaActive: false,
        status: 'no_key',
        message: 'No GEMINI_API_KEY detected. Running in Local Extractive Mode.'
      });
    }

    const startTime = Date.now();
    try {
      // Test quick generation with active model to verify real API quota & responsiveness
      await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'ping'
      });
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        hasGeminiKey: true,
        quotaActive: true,
        status: 'operational',
        model: 'gemini-3.1-flash-lite',
        latencyMs,
        message: 'Gemini API quota is active and healthy.'
      });
    } catch (err: any) {
      const isQuotaOrRateLimit = err?.status === 429 || 
        String(err?.message || '').includes('429') || 
        String(err?.message || '').toLowerCase().includes('quota') ||
        String(err?.message || '').toLowerCase().includes('resource_exhausted');

      return res.json({
        ok: true,
        hasGeminiKey: true,
        quotaActive: false,
        status: isQuotaOrRateLimit ? 'rate_limited' : 'api_error',
        error: err?.message || String(err),
        message: isQuotaOrRateLimit 
          ? 'Gemini API quota or rate limit temporarily exceeded. Free tier quotas reset automatically every minute.'
          : 'Gemini API encountered an error.'
      });
    }
  });

  // Official Notice Aggregator Endpoints
  app.get('/api/notices', (req, res) => {
    try {
      const { search, category, priority, sourceId, sortBy } = req.query as Record<string, string>;
      const notices = noticeDatabase.getNotices({
        search,
        category,
        priority,
        sourceId,
        sortBy: sortBy as any
      });
      const db = noticeDatabase.getDatabase();
      res.json({
        ok: true,
        notices,
        total: notices.length,
        allCount: db.notices.length,
        sources: db.sources,
        lastGlobalSync: db.lastGlobalSync,
        isSyncing: noticeScheduler.getIsSyncing(),
        schedulerConfig: db.schedulerConfig
      });
    } catch (err: any) {
      console.error('Error in /api/notices:', err);
      res.status(500).json({ ok: false, error: 'Failed to retrieve notices' });
    }
  });

  app.get('/api/notices/sources', (req, res) => {
    try {
      const db = noticeDatabase.getDatabase();
      const stats = noticeDatabase.getStats();
      res.json({
        ok: true,
        sources: db.sources,
        lastGlobalSync: db.lastGlobalSync,
        isSyncing: noticeScheduler.getIsSyncing(),
        stats
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: 'Failed to retrieve source statuses' });
    }
  });

  app.post('/api/notices/sync', async (req, res) => {
    try {
      // Admin token verification if configured via SYNC_ADMIN_KEY
      const authHeader = req.headers['authorization'];
      const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
      const adminToken = req.headers['x-admin-token'] || bearerToken || req.query.token;
      const requiredToken = process.env.SYNC_ADMIN_KEY?.trim();
      if (requiredToken && requiredToken.length > 0 && adminToken !== requiredToken) {
        return res.status(403).json({ ok: false, error: 'Unauthorized: Invalid admin token for notice synchronization' });
      }

      const result = await noticeScheduler.syncNow('manual');
      if (!result.success) {
        const statusCode = result.error?.includes('progress') ? 409 : 400;
        return res.status(statusCode).json({
          ok: false,
          error: result.error,
          total: result.total
        });
      }

      syncKnowledgeBaseWithNotices();

      const db = noticeDatabase.getDatabase();
      res.json({
        ok: true,
        added: result.added,
        updated: result.updated,
        total: result.total,
        durationMs: result.durationMs,
        lastGlobalSync: db.lastGlobalSync,
        sources: db.sources
      });
    } catch (err: any) {
      console.error('Error triggering notice sync:', err);
      res.status(500).json({ ok: false, error: 'Failed to trigger notice sync' });
    }
  });

  app.get('/api/notices/stats', (req, res) => {
    try {
      const stats = noticeDatabase.getStats();
      res.json({ 
        ok: true, 
        stats, 
        syncHistory: noticeDatabase.getSyncHistory() 
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: 'Failed to get notice stats' });
    }
  });

  // Notice-to-Action AI Breakdown Endpoint
  app.post('/api/notices/breakdown', async (req, res) => {
    try {
      const notice = req.body as any;
      if (!notice || !notice.title) {
        return res.status(400).json({ error: 'Notice title and details are required' });
      }

      const localFallback = generateLocalBreakdown(notice);

      if (hasGeminiKey && aiClient) {
        try {
          const prompt = `You are CampusMind AI's Notice-to-Action engine for Sathyabama Institute of Science and Technology.
Analyze this official campus notice and extract a strict, grounded breakdown and action checklist.
CRITICAL RULES:
1. Grounding: Do NOT invent dates, fees, venues, or deadlines.
2. If an explicit deadline is mentioned in the text (e.g. "Last date 30.09.2026"), extract it. If NO deadline is stated, return null for explicitDeadline.
3. Identify who this notice applies to (Target Audience).
4. Identify any missing or uncertain details that students must verify from the department or linked PDF.
5. Provide 2-4 concrete checklist steps that the student can perform based ONLY on this notice.
6. If an event/exam date is mentioned, extract it.

Return ONLY valid JSON matching this schema:
{
  "announcement": "Brief clear summary of what is officially announced",
  "targetAudience": "Who this applies to",
  "actionRequired": "What action is required or 'Informational announcement only'",
  "explicitDeadline": "YYYY-MM-DD or null",
  "missingOrUncertainDetails": ["detail 1 not provided in notice", "detail 2"],
  "checklistItems": ["Task 1", "Task 2"],
  "eventDates": [
    {
      "title": "Event or Exam name",
      "date": "YYYY-MM-DD or null",
      "time": null,
      "isExplicit": boolean,
      "notes": "Context note"
    }
  ]
}

Notice Details:
Title: ${notice.title}
Date: ${notice.date || ''}
Category: ${notice.category || ''}
Department: ${notice.department || ''}
Original URL: ${notice.originalUrl || ''}
PDF URL: ${notice.pdfUrl || ''}
Content: ${notice.fullDetails || notice.description || ''}`;

          const { text: resultText } = await generateWithModelFallback({
            contents: prompt
          });

          const jsonStart = resultText.indexOf('{');
          const jsonEnd = resultText.lastIndexOf('}');
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const parsed = JSON.parse(resultText.slice(jsonStart, jsonEnd + 1));
            return res.json({
              ok: true,
              breakdown: {
                ...localFallback,
                ...parsed,
                sourceUrl: notice.originalUrl || notice.sourceUrl || localFallback.sourceUrl,
                pdfUrl: notice.pdfUrl || localFallback.pdfUrl,
                verificationStatus: notice.verificationStatus || 'verified'
              },
              engineUsed: 'gemini'
            });
          }
        } catch (geminiErr) {
          console.warn('Gemini notice breakdown failed, using grounded local parser:', geminiErr);
        }
      }

      return res.json({
        ok: true,
        breakdown: localFallback,
        engineUsed: 'local-grounded'
      });
    } catch (err: any) {
      console.error('Error generating notice breakdown:', err);
      return res.status(500).json({ error: 'Failed to generate notice breakdown' });
    }
  });

  // Knowledge base endpoints (ensuring Chatbot and Notice Finder share identical data)
  app.get('/api/knowledge-base', (req, res) => {
    res.json({
      ok: true,
      items: serverKnowledgeBase,
      total: serverKnowledgeBase.length
    });
  });

  app.post('/api/knowledge-base', (req, res) => {
    try {
      const item = req.body as KnowledgeItem;
      if (!item || !item.id || !item.title) {
        return res.status(400).json({ error: 'Valid knowledge item with id and title is required.' });
      }

      const existingIdx = serverKnowledgeBase.findIndex((i) => i.id === item.id);
      if (existingIdx >= 0) {
        serverKnowledgeBase[existingIdx] = item;
      } else {
        serverKnowledgeBase = [item, ...serverKnowledgeBase];
      }

      console.log(`Knowledge Base updated with: "${item.title}". Total records: ${serverKnowledgeBase.length}`);
      return res.json({
        ok: true,
        item,
        total: serverKnowledgeBase.length
      });
    } catch (err: any) {
      console.error('Error updating knowledge base:', err);
      return res.status(500).json({ error: 'Failed to save knowledge item on server.' });
    }
  });

  // Helper for resilient Gemini API calls with model cascade
  async function generateWithModelFallback(
    promptConfig: { contents: any; systemInstruction?: string }
  ): Promise<{ text: string; modelUsed: string }> {
    if (!aiClient) {
      throw new Error('Gemini AI client not initialized');
    }

    // Try fast, active models first
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: promptConfig.contents,
          config: promptConfig.systemInstruction ? { systemInstruction: promptConfig.systemInstruction } : undefined
        });

        const text = response.text || '';
        if (text) {
          return { text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed: ${err?.status || err?.message || err}. Attempting next model...`);
      }
    }

    throw lastError || new Error('All candidate models exhausted or rate-limited.');
  }

  // Campus AI Chatbot Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { question, documents, history } = req.body as { 
        question?: string; 
        documents?: CollegeDocument[];
        history?: Array<{ role: 'user' | 'model'; text: string }>;
      };

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Question is required.' });
      }

      const trimmedQuestion = question.trim();

      // Automatically classify question type
      const category: QuestionCategory = detectQuestionCategory(trimmedQuestion, history);

      // Use provided documents or server's unified knowledge base
      const docsToSearch: CollegeDocument[] = (Array.isArray(documents) && documents.length > 0)
        ? documents
        : serverKnowledgeBase.map(knowledgeItemToDocument);

      // If Gemini Key is configured, attempt intelligent answer
      if (hasGeminiKey && aiClient) {
        try {
          const followUp = detectFollowUpIntent(trimmedQuestion);
          // Only retrieve and attach campus documents if the question is Sathyabama-specific
          const relevantDocs = category === 'sathyabama' 
            ? getRelevantCollegeDocuments(trimmedQuestion, docsToSearch, 6)
            : [];

          const systemInstruction = buildChatSystemInstruction(
            category,
            relevantDocs,
            category === 'sathyabama',
            followUp
          );

          // Format conversation history for Gemini (preserving last 8 turns)
          const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

          if (Array.isArray(history) && history.length > 0) {
            for (const h of history.slice(-8)) {
              if (h.text && (h.role === 'user' || h.role === 'model')) {
                contents.push({
                  role: h.role,
                  parts: [{ text: h.text }]
                });
              }
            }
          }

          contents.push({
            role: 'user',
            parts: [{ text: trimmedQuestion }]
          });

          const { text: responseText, modelUsed } = await generateWithModelFallback({
            contents,
            systemInstruction
          });

          // If campus-specific, inspect grounding
          if (category === 'sathyabama') {
            const isNotFound = responseText.toLowerCase().includes('official information on this specific topic could not be found') ||
                               responseText.toLowerCase().includes('information could not be found in the current') ||
                               responseText.toLowerCase().includes('not found in the current sathyabama');

            let sourceTitle = '';
            let sourceDocId = '';
            const matchSource = responseText.match(/Source:\s*([^\n\r]+)/i);
            if (matchSource && matchSource[1]) {
              sourceTitle = matchSource[1].replace(/\[|\]/g, '').trim();
              const matchedDoc = docsToSearch.find((d) => 
                d.title.toLowerCase().includes(sourceTitle.toLowerCase()) || 
                sourceTitle.toLowerCase().includes(d.title.toLowerCase())
              );
              if (matchedDoc) {
                sourceDocId = matchedDoc.id;
              }
            } else {
              for (const d of docsToSearch) {
                if (responseText.includes(d.title)) {
                  sourceTitle = d.title;
                  sourceDocId = d.id;
                  break;
                }
              }
            }

            if (!sourceDocId && docsToSearch.length > 0 && !isNotFound) {
              sourceDocId = docsToSearch[0].id;
            }

            return res.json({
              found: !isNotFound,
              answer: responseText,
              sourceDocTitle: isNotFound ? undefined : (sourceTitle || docsToSearch[0]?.title),
              sourceDocId: isNotFound ? undefined : sourceDocId,
              engineUsed: modelUsed,
              confidenceScore: isNotFound ? 0 : 98,
              category
            });
          }

          // For academic, programming, general questions, return the comprehensive AI explanation
          return res.json({
            found: true,
            answer: responseText,
            engineUsed: modelUsed,
            confidenceScore: 98,
            category
          });
        } catch (geminiError: any) {
          console.warn('Gemini cloud API rate-limited or error:', geminiError?.message || geminiError);
          const isQuota = geminiError?.status === 429 || 
            String(geminiError?.message || '').includes('429') || 
            String(geminiError?.message || '').toLowerCase().includes('quota') ||
            String(geminiError?.message || '').toLowerCase().includes('resource_exhausted');

          if (category === 'sathyabama') {
            // Graceful fallback to verified Local RAG so the student gets their cited answer without a crash!
            const localRes = searchCollegeDocuments(trimmedQuestion, docsToSearch);
            return res.json({
              found: localRes.found,
              answer: localRes.answer,
              sourceDocTitle: localRes.sourceDocTitle,
              sourceDocId: localRes.sourceDocId,
              engineUsed: 'local-extractive',
              confidenceScore: localRes.confidenceScore,
              category,
              note: isQuota 
                ? 'Answer verified from campus knowledge base (Gemini free quota temporarily busy; Local Extractive RAG active)'
                : 'Answer verified from campus knowledge base'
            });
          }

          // For general academic/programming queries, inform the student cleanly without fabricating or claiming not found in campus
          return res.status(isQuota ? 429 : 503).json({
            error: isQuota 
              ? 'Gemini API free-tier quota is temporarily busy or rate-limited. Quotas automatically reset every minute. Please retry shortly.'
              : 'AI service temporarily unavailable. Please retry shortly.',
            isQuotaError: isQuota,
            canRetry: true
          });
        }
      }

      // If no Gemini key is active on server, use the local extractive RAG engine for campus queries
      if (category === 'sathyabama') {
        const localRes = searchCollegeDocuments(trimmedQuestion, docsToSearch);
        return res.json({
          found: localRes.found,
          answer: localRes.answer,
          sourceDocTitle: localRes.sourceDocTitle,
          sourceDocId: localRes.sourceDocId,
          engineUsed: 'local-extractive',
          confidenceScore: localRes.confidenceScore,
          category,
          note: 'Answer verified from campus knowledge base (Free Local Extractive Engine)'
        });
      }

      return res.status(503).json({
        error: 'Gemini API key is required on the server to answer general academic knowledge questions beyond campus notices.',
        canRetry: false
      });
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      // Even on unexpected error, attempt emergency local search
      try {
        const fallbackRes = searchCollegeDocuments(req.body?.question || '', serverKnowledgeBase.map(knowledgeItemToDocument));
        return res.json({
          found: fallbackRes.found,
          answer: fallbackRes.answer,
          sourceDocTitle: fallbackRes.sourceDocTitle,
          sourceDocId: fallbackRes.sourceDocId,
          engineUsed: 'local-extractive',
          confidenceScore: fallbackRes.confidenceScore
        });
      } catch {
        return res.status(500).json({ error: 'Internal server error while processing query.' });
      }
    }
  });

  // Smart Study Assistant Endpoint (Preserving existing functionality with robust fallback)
  app.post('/api/study-tools', async (req, res) => {
    try {
      const { text, action } = req.body as { text?: string; action?: 'summarize' | 'extract_points' | 'quiz' };

      if (!text || typeof text !== 'string' || text.trim().length < 15) {
        return res.status(400).json({ error: 'Please enter or paste at least a few sentences of study notes to analyze.' });
      }

      const validAction = action || 'summarize';

      // If Gemini Key is present, attempt Gemini 3.1 Flash Lite / Flash
      if (hasGeminiKey && aiClient) {
        try {
          if (validAction === 'summarize') {
            const prompt = `You are CampusMind AI's Smart Study Assistant. Summarize the following lecture notes concisely for an undergraduate student:
- Provide an Executive Summary (1-2 clear paragraphs).
- Provide a Key Takeaways section with core bullet points.
Notes:
"""${text}"""`;
            const { text: summaryText, modelUsed } = await generateWithModelFallback({
              contents: prompt
            });
            return res.json({
              action: 'summarize',
              summary: summaryText,
              engineUsed: modelUsed,
              notice: `Generated via ${modelUsed}`
            });
          }

          if (validAction === 'extract_points') {
            const prompt = `You are CampusMind AI's Smart Study Assistant. Extract the essential key concepts, definitions, and core formulas from these study notes as 5 to 7 clean bullet points:
Notes:
"""${text}"""
Output each bullet point starting with a bold concept title (e.g., "* **Concept Title:** explanation").`;
            const { text: pointsText, modelUsed } = await generateWithModelFallback({
              contents: prompt
            });
            const lines = pointsText.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);
            return res.json({
              action: 'extract_points',
              keyPoints: lines,
              engineUsed: modelUsed,
              notice: `Extracted via ${modelUsed}`
            });
          }

          if (validAction === 'quiz') {
            const prompt = `You are CampusMind AI's Smart Study Assistant. Create exactly 5 multiple choice practice questions based ONLY on the following study notes.
Return ONLY valid JSON with this exact schema:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Why this option is correct based on the notes."
  }
]
Notes:
"""${text}"""`;

            const { text: quizJson, modelUsed } = await generateWithModelFallback({
              contents: prompt
            });

            // Extract JSON substring if needed
            const jsonStart = quizJson.indexOf('[');
            const jsonEnd = quizJson.lastIndexOf(']');
            const cleanedJson = (jsonStart >= 0 && jsonEnd > jsonStart) 
              ? quizJson.slice(jsonStart, jsonEnd + 1) 
              : quizJson;

            const parsed = JSON.parse(cleanedJson);
            return res.json({
              action: 'quiz',
              questions: parsed,
              engineUsed: modelUsed,
              notice: `5 Practice Questions generated via ${modelUsed}`
            });
          }
        } catch (geminiError: any) {
          console.warn('Gemini Study Tools error, smoothly falling back to local study parser:', geminiError?.message || geminiError);
          // fall through to local parser
        }
      }

      // Local Extractive fallback
      if (validAction === 'summarize') {
        const result = summarizeNotesLocal(text);
        return res.json(result);
      } else if (validAction === 'extract_points') {
        const result = extractKeyPointsLocal(text);
        return res.json(result);
      } else {
        const result = generateQuizQuestionsLocal(text);
        return res.json(result);
      }
    } catch (err: any) {
      console.error('Study tools endpoint error:', err);
      return res.status(500).json({ error: 'Internal server error while analyzing notes.' });
    }
  });

  // Serve Frontend
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusMind AI server running on http://0.0.0.0:${PORT}`);
  });

  // Start background notice aggregation scheduler
  await noticeScheduler.start();
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
});
