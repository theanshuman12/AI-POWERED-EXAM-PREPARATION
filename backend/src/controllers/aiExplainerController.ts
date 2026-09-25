import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('GoogleGenAI client initialization note:', e);
    }
  }
  return aiClient;
}

export const explainConcept = async (req: AuthenticatedRequest, res: Response) => {
  const { topicName, subjectName, topicId, subjectId, difficulty, questionContext } = req.body;

  if (!topicName) {
    res.status(400).json({ message: 'topicName is required.' });
    return;
  }

  const canonicalSubjectName = subjectName || 'General';
  const client = getAIClient();

  // If Gemini API is configured, generate dynamic academic explanation
  if (client) {
    try {
      const prompt = `You are a distinguished university academic mentor.
Topic: ${topicName} (Subject: ${canonicalSubjectName}, Level: ${difficulty || 'Undergraduate'}).
${topicId ? `Canonical topicId: ${topicId}.` : ''}${subjectId ? `Canonical subjectId: ${subjectId}.` : ''}
${questionContext ? `Student is reviewing this question: "${questionContext}"` : ''}

Please provide:
1. Core Definition and Intuition (2-3 concise paragraphs)
2. Crucial Rules / Axioms / Formulas to remember for exams
3. Common Exam Traps & Pitfalls (frequent misconceptions)
4. A clear, concrete practical example
5. High-yield 1-minute Revision Summary

Keep it crystal-clear, pedagogical, and exam-focused. Format in clean markdown.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const explanation = response.text || 'Explanation generated successfully.';
      res.json({
        topicName,
        explanation,
        source: 'Gemini AI Tutor'
      });
      return;
    } catch (err: any) {
      console.warn('Gemini API call failed, using high-yield curriculum explanation:', err);
    }
  }

  // Fallback textbook-quality structured explanation if Gemini key is missing or offline
  const fallbackExplanation = `### Academic Concept Primer: ${topicName}

#### 1. Core Intuition & Theory
In ${canonicalSubjectName}, **${topicName}** represents a fundamental building block. Understanding its governing principles allows you to eliminate incorrect multiple-choice distractors quickly.

#### 2. Key Exam Principles
- **Axiomatic Consistency**: Always verify boundary conditions and prerequisites before solving.
- **Complexity Profile**: Be mindful of time vs. space complexity trade-offs commonly tested in competitive exams.
- **Edge Cases**: Pay special attention to null/empty inputs, cycles, and boundary limits.

#### 3. Common Exam Traps
- Misinterpreting the question condition (e.g., confusing "lossless join" with "dependency preserving" or confusing worst-case with average-case).
- Failing to verify candidate keys or loop invariant conditions.

#### 4. Revision Recommendation
Practice 5-10 targeted multiple-choice questions on this topic to cement the theory into automatic recall.`;

  res.json({
    topicName,
    explanation: fallbackExplanation,
    source: 'Curriculum Knowledge Base'
  });
};

export const getQuestionHint = async (req: AuthenticatedRequest, res: Response) => {
  const { question, options } = req.body;

  if (!question) {
    res.status(400).json({ message: 'question is required.' });
    return;
  }

  const client = getAIClient();

  if (client) {
    try {
      const prompt = `Provide a gentle pedagogical hint for a student struggling with this exam question:
Question: "${question}"
Options: ${JSON.stringify(options || [])}

Rules:
- DO NOT reveal the direct answer.
- Guide the student's thought process toward the core rule or definition.
- Keep the hint under 3 sentences.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ hint: response.text });
      return;
    } catch (err) {
      console.warn('Gemini hint error:', err);
    }
  }

  res.json({
    hint: 'Hint: Focus on the formal mathematical definition or condition required by the theorem. Eliminate options that violate the base constraints.'
  });
};
