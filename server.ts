import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize GoogleGenAI SDK on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface GenerateQuizRequest {
  notes?: string;
  numQuestions?: number;
}

app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { notes, numQuestions = 3 } = req.body as GenerateQuizRequest;

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({
        error: 'Please enter study notes to generate a practice quiz.',
      });
    }

    const trimmedNotes = notes.trim();
    const count = Math.min(Math.max(Math.floor(Number(numQuestions) || 3), 1), 5);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured.',
      });
    }

    const prompt = `Based strictly on the following university study notes, generate exactly ${count} high-quality, conceptual practice multiple-choice question(s).
Each question must test comprehension, application, or key definitions from the notes.
Each question MUST have exactly 4 answer options (indices 0, 1, 2, 3 representing A, B, C, D).
Specify the correctOptionIndex (0-3) and a comprehensive academic explanation explaining why the correct answer is right and why the other options are wrong or less accurate.

Study Notes:
"""
${trimmedNotes}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a university professor preparing practice exam questions. Formulate insightful questions testing key concepts from the student’s provided notes. Ensure every question has exactly 4 distinct, plausible choices, an accurate correctOptionIndex, and a clear pedagogical explanation.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'A concise subject/topic title for this quiz based on the notes',
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.INTEGER,
                    description: 'Sequential question number starting from 1',
                  },
                  question: {
                    type: Type.STRING,
                    description: 'The question text',
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Array of exactly 4 choices (A, B, C, D)',
                  },
                  correctOptionIndex: {
                    type: Type.INTEGER,
                    description: 'Index of the correct choice: 0 for A, 1 for B, 2 for C, 3 for D',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Detailed explanation of the correct answer and relevant concept from the notes',
                  },
                },
                required: ['id', 'question', 'options', 'correctOptionIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('No response returned from the Gemini model.');
    }

    const parsedData = JSON.parse(textOutput);

    // Sanitize and ensure each question has valid 4 options and clamped correct index
    const sanitizedQuestions = (parsedData.questions || []).slice(0, count).map((q: any, idx: number) => {
      let options: string[] = Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : [];
      if (options.length < 4) {
        while (options.length < 4) {
          options.push(`Option ${String.fromCharCode(65 + options.length)}`);
        }
      } else if (options.length > 4) {
        options = options.slice(0, 4);
      }

      let correctIndex = Number(q.correctOptionIndex);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        correctIndex = 0;
      }

      return {
        id: idx + 1,
        question: q.question || `Question ${idx + 1}`,
        options,
        correctOptionIndex: correctIndex,
        explanation: q.explanation || 'No detailed explanation provided.',
      };
    });

    return res.json({
      title: parsedData.title || 'Practice Quiz',
      questions: sanitizedQuestions,
    });
  } catch (err: any) {
    console.error('Error generating quiz:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate quiz. Please try again with valid notes.',
    });
  }
});

async function start() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScholarQuiz server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
