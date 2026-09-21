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
  /**
   * Invokes Python performance analyzer via CLI process or falls back to identical in-process logic
   */
  public static async analyzeStudent(studentId: string): Promise<PerformanceAnalysisResponse> {
    const rawAttempts = db.getStudentQuestionAttempts(studentId);
    const topics = db.getTopics();
    const subjects = db.getSubjects();

    // Map attempts with enriched topic & subject metadata
    const enrichedPerformance = rawAttempts.map(attempt => {
      const topic = topics.find(t => t.id === attempt.topicId);
      const subject = topic ? subjects.find(s => s.id === topic.subjectId) : null;
      return {
        questionId: attempt.questionId,
        topicId: attempt.topicId,
        topic: topic?.name || attempt.topicId,
        topicName: topic?.name || attempt.topicId,
        subjectName: subject?.name || 'Computer Science',
        selectedAnswer: attempt.selectedAnswer,
        correct: attempt.correct,
        responseTime: attempt.responseTime,
        difficulty: attempt.difficulty,
        createdAt: attempt.createdAt
      };
    });

    // Try calling the Python service via subprocess
    try {
      const pythonResult = await this.runPythonAnalyzer(studentId, enrichedPerformance);
      if (pythonResult && (pythonResult as any).status !== 'error' && pythonResult.recommendations) {
        // Save recommendations to database
        db.saveRecommendations(pythonResult.recommendations);
        await db.flush();
        return pythonResult;
      }
    } catch (err) {
      console.warn('Python AI subprocess note (falling back to synchronized native calculation):', err);
    }

    // Fallback: Synchronized identical mathematical model
    return this.calculateExplainableMetrics(studentId, enrichedPerformance);
  }

  private static runPythonAnalyzer(studentId: string, performance: any[]): Promise<PerformanceAnalysisResponse> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.resolve(process.cwd(), 'ai-service', 'app.py');
      const pyProcess = spawn('python3', [scriptPath, '--cli']);

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', data => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', data => {
        stderrData += data.toString();
      });

      pyProcess.once('error', err => {
        reject(new Error(`Python process could not start: ${err.message}`));
      });

      pyProcess.on('close', code => {
        if (code === 0 && stdoutData.trim()) {
          try {
            const parsed = JSON.parse(stdoutData.trim());
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${e}`));
          }
        } else {
          reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
        }
      });

      pyProcess.stdin.write(JSON.stringify({ studentId, performance }));
      pyProcess.stdin.end();
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
      const tid = a.topicId || 'general';
      if (!topicGroups.has(tid)) {
        topicGroups.set(tid, []);
      }
      topicGroups.get(tid)!.push(a);
    }

    const weakTopics: TopicPerformance[] = [];
    const moderateTopics: TopicPerformance[] = [];
    const strongTopics: TopicPerformance[] = [];
    const recommendations: Recommendation[] = [];

    topicGroups.forEach((groupAttempts, topicId) => {
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
    db.saveRecommendations(recommendations);
    await db.flush();

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
