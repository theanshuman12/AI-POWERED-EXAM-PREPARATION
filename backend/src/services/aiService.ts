import { spawn } from 'child_process';
import path from 'path';
import { db } from './databaseService';
import {
  PerformanceAnalysisResponse,
  TopicPerformance,
  Recommendation,
  Difficulty,
  PerformanceLevel
} from '../../types';

export class AIService {
  private static async saveRecommendationsSafely(recommendations: Recommendation[]): Promise<void> {
    try {
      db.saveRecommendations(recommendations);
      await db.flush();
    } catch (err) {
      console.error('MongoDB recommendation persistence failed', JSON.stringify({
        operation: 'save recommendations',
        numberOfRecommendations: recommendations.length,
        recommendationStableIds: recommendations.map(recommendation => recommendation.id),
        recommendationTopics: recommendations.map(recommendation => recommendation.topic),
        errorName: err instanceof Error ? err.name : 'UnknownError',
        errorMessage: err instanceof Error ? err.message : String(err)
      }));
    }
  }

  private static normalizeTopicPerformance(topic: any): any {
    if (!topic) return topic;
    const normalized = { ...topic };
    if (!normalized.topicName && normalized.topic) {
      normalized.topicName = normalized.topic;
    }
    if (!normalized.topic && normalized.topicName) {
      normalized.topic = normalized.topicName;
    }
    if (!normalized.topicId && normalized.id) {
      normalized.topicId = normalized.id;
    }
    if (!normalized.subjectName && normalized.subject) {
      normalized.subjectName = normalized.subject;
    }
    return normalized;
  }

  private static normalizeAnalysisResult(result: Partial<PerformanceAnalysisResponse> & { [key: string]: any }, studentId: string, totalQuestionAttempts: number): PerformanceAnalysisResponse {
    const weakTopics = Array.isArray(result.weakTopics) ? result.weakTopics.map(item => this.normalizeTopicPerformance(item)) : [];
    const moderateTopics = Array.isArray(result.moderateTopics) ? result.moderateTopics.map(item => this.normalizeTopicPerformance(item)) : [];
    const strongTopics = Array.isArray(result.strongTopics) ? result.strongTopics.map(item => this.normalizeTopicPerformance(item)) : [];
    const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];
    const totalTests = typeof result.totalTests === 'number' ? result.totalTests : db.getStudentAttempts(studentId).length;

    return {
      studentId,
      overallAccuracy: typeof result.overallAccuracy === 'number' ? result.overallAccuracy : 0,
      totalTests,
      totalQuestionsAttempted: typeof result.totalQuestionsAttempted === 'number' ? result.totalQuestionsAttempted : totalQuestionAttempts,
      averageResponseTime: typeof result.averageResponseTime === 'number' ? result.averageResponseTime : undefined,
      weakTopics,
      moderateTopics,
      strongTopics,
      recommendations
    };
  }

  private static calculateAverageResponseTime(attempts: any[]): number {
    const responseTimes = attempts
      .map(attempt => Number(attempt.responseTime))
      .filter(responseTime => Number.isFinite(responseTime) && responseTime >= 0);
    return responseTimes.length > 0
      ? Math.round((responseTimes.reduce((sum, responseTime) => sum + responseTime, 0) / responseTimes.length) * 10) / 10
      : 0;
  }

  /**
   * Invokes Python performance analyzer via CLI process or falls back to identical in-process logic
   */
  public static async analyzeStudent(studentId: string): Promise<PerformanceAnalysisResponse> {
    const rawAttempts = db.getStudentQuestionAttempts(studentId);
    const topics = db.getTopics();
    const subjects = db.getSubjects();

    const normalizeTopicKey = (value?: string) => (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const resolveTopicMetadata = (attempt: any) => {
      const canonicalQuestion = attempt.questionId ? db.getQuestionById(attempt.questionId) : undefined;
      const topicId = canonicalQuestion?.topicId || attempt.topicId || 'general';
      const topicMatches = topics.filter(t => normalizeTopicKey(t.id) === normalizeTopicKey(topicId));
      const relatedTopicMatches = topics
        .filter(t => {
          const candidateId = normalizeTopicKey(t.id);
          const requestedId = normalizeTopicKey(topicId);
          const candidateParts = candidateId.split('-');
          const requestedParts = requestedId.split('-');
          const sameTopicFamily = candidateParts.slice(0, 3).join('-') === requestedParts.slice(0, 3).join('-');
          const candidateTopicParts = candidateParts.slice(3);
          const requestedTopicParts = requestedParts.slice(3);
          return sameTopicFamily && candidateTopicParts.every(part => requestedTopicParts.includes(part));
        })
        .sort((left, right) => right.id.length - left.id.length);
      const exactTopic = topics.find(t => t.id === topicId) || topicMatches[0] || relatedTopicMatches[0];
      const fallbackTopic = exactTopic || topics.find(t => normalizeTopicKey(t.name) === normalizeTopicKey(topicId));
      const topicName = fallbackTopic?.name || attempt.topicName || attempt.topic || topicId;
      const subjectId = canonicalQuestion?.subjectId || fallbackTopic?.subjectId || (attempt.subjectId || subjects.find(s => s.name === attempt.subjectName)?.id);
      const subject = subjectId ? subjects.find(s => s.id === subjectId) : null;

      return {
        topicId: exactTopic?.id || topicId,
        topic: topicName,
        topicName,
        subjectId: subject?.id || subjectId || 'general',
        subjectName: subject?.name || attempt.subjectName || 'Computer Science',
        questionId: attempt.questionId,
        selectedAnswer: attempt.selectedAnswer,
        correct: attempt.correct,
        responseTime: attempt.responseTime,
        difficulty: attempt.difficulty,
        createdAt: attempt.createdAt
      };
    };

    // Map attempts with enriched topic & subject metadata
    const enrichedPerformance = rawAttempts.map(attempt => resolveTopicMetadata(attempt));
    const averageResponseTime = this.calculateAverageResponseTime(enrichedPerformance);

    // Try calling the Python service via subprocess. Database failures must not be
    // treated as analyzer failures because a submission is only successful after persistence.
    let pythonResult: PerformanceAnalysisResponse | undefined;
    try {
      pythonResult = await this.runPythonAnalyzer(studentId, enrichedPerformance);
    } catch (err) {
      console.warn('Python AI analyzer unavailable; falling back to synchronized native calculation:', err instanceof Error ? err.message : err);
    }

    if (pythonResult && (pythonResult as any).status !== 'error' && Array.isArray((pythonResult as any).recommendations)) {
      const normalized = this.normalizeAnalysisResult(pythonResult, studentId, rawAttempts.length);
      normalized.averageResponseTime = averageResponseTime;
      await this.saveRecommendationsSafely(normalized.recommendations);
      return normalized;
    }

    // Fallback: Synchronized identical mathematical model
    const nativeAnalysis = await this.calculateExplainableMetrics(studentId, enrichedPerformance);
    nativeAnalysis.averageResponseTime = averageResponseTime;
    return nativeAnalysis;
  }

  private static runPythonAnalyzer(studentId: string, performance: any[]): Promise<PerformanceAnalysisResponse> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.resolve(process.cwd(), 'ai-service', 'app.py');
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      const pyProcess = spawn(pythonCommand, [scriptPath, '--cli']);

      let stdoutData = '';
      let stderrData = '';
      let settled = false;
      let payloadWritten = false;

      const rejectOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      pyProcess.stdout.on('data', data => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', data => {
        stderrData += data.toString();
      });

      pyProcess.once('error', err => {
        rejectOnce(new Error(`Python process could not start with ${pythonCommand}: ${err.message}`));
      });

      pyProcess.stdin.once('error', err => {
        rejectOnce(new Error(`Python analyzer stdin failed: ${err.message}`));
      });

      pyProcess.on('close', code => {
        if (settled) return;
        if (!payloadWritten) {
          rejectOnce(new Error(`Python process exited before receiving the analysis payload with code ${code}.`));
          return;
        }
        if (code === 0 && stdoutData.trim()) {
          try {
            const parsed = JSON.parse(stdoutData.trim());
            resolve(parsed);
            settled = true;
          } catch (e) {
            rejectOnce(new Error(`Failed to parse Python output: ${e}`));
          }
        } else {
          rejectOnce(new Error(`Python process exited with code ${code}: ${stderrData}`));
        }
      });

      if (pyProcess.stdin.destroyed || !pyProcess.stdin.writable) {
        rejectOnce(new Error('Python analyzer stdin is unavailable before sending the analysis payload.'));
        return;
      }

      try {
        pyProcess.stdin.write(JSON.stringify({ studentId, performance }));
        payloadWritten = true;
        pyProcess.stdin.end();
      } catch (err) {
        rejectOnce(new Error(`Python analyzer payload could not be written: ${err instanceof Error ? err.message : err}`));
      }
    });
  }

  /**
   * Reference implementation of the Explainable Performance Scoring formula:
   * Performance Score = 0.50 * Overall Accuracy + 0.30 * Recent Accuracy + 0.20 * Time Performance
   */
  public static async calculateExplainableMetrics(studentId: string, attempts: any[]): Promise<PerformanceAnalysisResponse> {
    const totalAttempts = attempts.length;
    const correctCount = attempts.filter(a => a.correct === true).length;
    const overallAccuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 1000) / 1000 : 0.0;

    // Group attempts by topic
    const topicGroups = new Map<string, any[]>();
    for (const a of attempts) {
      const topicKey = `${a.subjectId || 'general'}:${a.topicId || 'general'}`;
      if (!topicGroups.has(topicKey)) {
        topicGroups.set(topicKey, []);
      }
      topicGroups.get(topicKey)!.push(a);
    }

    const weakTopics: TopicPerformance[] = [];
    const moderateTopics: TopicPerformance[] = [];
    const strongTopics: TopicPerformance[] = [];
    const recommendations: Recommendation[] = [];

    topicGroups.forEach((groupAttempts) => {
      const topicId = groupAttempts[0].topicId || 'general';
      const tCount = groupAttempts.length;
      const tCorrect = groupAttempts.filter(a => a.correct === true).length;
      const tOverallAcc = tCount > 0 ? tCorrect / tCount : 0;

      // Recent accuracy (last 5 attempts)
      const recentSlice = tCount >= 5 ? groupAttempts.slice(-5) : groupAttempts;
      const recentCorrect = recentSlice.filter(a => a.correct === true).length;
      const recentAcc = recentSlice.length > 0 ? recentCorrect / recentSlice.length : tOverallAcc;

      // Time Performance (optimal target ~35s)
      const totalTime = groupAttempts.reduce((sum, a) => sum + (Number(a.responseTime) || 35), 0);
      const avgTime = tCount > 0 ? totalTime / tCount : 35;
      const deviation = Math.abs(avgTime - 35);
      const timePerf = Math.max(0.2, Math.min(1.0, 1.0 - (deviation / 70.0)));

      // Performance Score = 0.50 * Overall + 0.30 * Recent + 0.20 * Time
      const score = 0.50 * tOverallAcc + 0.30 * recentAcc + 0.20 * timePerf;
      const normalizedScore = Math.round(Math.max(0.0, Math.min(1.0, score)) * 1000) / 1000;

      // Classification: < 0.40 -> Weak, 0.40-0.70 -> Moderate, > 0.70 -> Strong
      let level: PerformanceLevel = 'Moderate';
      let recDiff: Difficulty = 'Medium';
      let action = '';
      let reason = '';
      let tips: string[] = [];

      const topicName = groupAttempts[0].topicName || groupAttempts[0].topic || topicId;
      const subjectName = groupAttempts[0].subjectName || 'Computer Science';

      if (normalizedScore < 0.40) {
        level = 'Weak';
        recDiff = 'Easy';
        action = `Revise ${topicName} fundamentals and practice beginner-level questions.`;
        reason = `Your performance score in ${topicName} is ${(normalizedScore * 100).toFixed(1)}% (Recent Accuracy: ${(recentAcc * 100).toFixed(1)}%). Focus on core definitions and easy problems first.`;
        tips = [
          `Review core definitions and key formulas of ${topicName}.`,
          'Take extra time to eliminate obvious distractors before confirming options.',
          'Review the step-by-step reasoning in question explanations.'
        ];
      } else if (normalizedScore <= 0.70) {
        level = 'Moderate';
        recDiff = 'Medium';
        action = `Practice intermediate-level ${topicName} questions and strengthen conceptual speed.`;
        reason = `You have achieved a moderate performance score of ${(normalizedScore * 100).toFixed(1)}%. Consistent practice will elevate this into a strong topic.`;
        tips = [
          `Target medium difficulty problems that combine 2 or more concepts.`,
          `Analyze edge cases and scenario-based questions.`,
          `Aim to reduce response time from ${avgTime.toFixed(1)}s down to 35s.`
        ];
      } else {
        level = 'Strong';
        recDiff = 'Hard';
        action = `Maintain mastery in ${topicName} with timed mock challenges and advanced edge-case questions.`;
        reason = `Your performance in ${topicName} is strong at ${(normalizedScore * 100).toFixed(1)}%. You are well prepared for competitive exam standards.`;
        tips = [
          'Attempt timed mock assessments under realistic exam time pressures.',
          'Review theoretical corner-cases and architectural trade-offs.',
          'Help solidify concepts by testing yourself on multi-subject comprehensive mocks.'
        ];
      }

      const topicPerf: TopicPerformance = {
        topicId,
        topicName,
        subjectName,
        totalAttempts: tCount,
        correctAttempts: tCorrect,
        overallAccuracy: Math.round(tOverallAcc * 1000) / 1000,
        recentAccuracy: Math.round(recentAcc * 1000) / 1000,
        avgResponseTime: Math.round(avgTime * 10) / 10,
        timePerformance: Math.round(timePerf * 1000) / 1000,
        performanceScore: normalizedScore,
        level
      };

      if (level === 'Weak') weakTopics.push(topicPerf);
      else if (level === 'Moderate') moderateTopics.push(topicPerf);
      else strongTopics.push(topicPerf);

      recommendations.push({
        id: 'rec-' + Math.random().toString(36).substring(2, 9),
        studentId,
        topicId,
        topic: topicName,
        subjectName,
        performanceScore: normalizedScore,
        performanceLevel: level,
        recommendedDifficulty: recDiff,
        action,
        reason,
        revisionTips: tips,
        createdAt: new Date().toISOString()
      });
    });

    // Sort recommendations so Weak topics come first
    recommendations.sort((a, b) => a.performanceScore - b.performanceScore);

    // Save recommendations to database
    await this.saveRecommendationsSafely(recommendations);

    const testAttempts = db.getStudentAttempts(studentId);

    return {
      studentId,
      overallAccuracy,
      totalTests: testAttempts.length,
      totalQuestionsAttempted: totalAttempts,
      weakTopics,
      moderateTopics,
      strongTopics,
      recommendations
    };
  }
}
