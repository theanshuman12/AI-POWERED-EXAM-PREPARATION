"""
AI-POWERED PERFORMANCE ANALYZER (Rule-based & Explainable Mathematical Model)
===========================================================================
NO NEURAL NETWORKS, NO CNN/RNN/LSTM, NO BACKPROPAGATION.
Strictly explainable, transparent, and mathematically rigorous.

Formulas:
- Overall Accuracy = correct_attempts / total_attempts
- Recent Accuracy = recent_correct (last 5) / recent_total (last 5)
- Time Performance:
    Optimal response time is estimated at ~35 seconds per standard MCQ.
    Time ratio = optimal_time / actual_avg_time
    Normalized Time Score = clamp(0.2, 1.0, 1.0 - abs(actual_avg_time - 35)/70)
- Performance Score = (0.50 * Overall Accuracy) + (0.30 * Recent Accuracy) + (0.20 * Time Performance)
- Topic Classification:
    Performance Score < 0.40  => WEAK
    0.40 <= Score <= 0.70     => MODERATE
    Score > 0.70              => STRONG
"""

from typing import List, Dict, Any


class PerformanceAnalyzer:
    def __init__(self, optimal_time_seconds: float = 35.0):
        self.optimal_time = optimal_time_seconds

    def calculate_time_performance(self, avg_response_time: float) -> float:
        """
        Normalizes response time between 0.0 and 1.0.
        If a student answers too fast (e.g. < 5s, guessing) or too slow (> 90s, struggling),
        their time efficiency is penalized smoothly.
        """
        if avg_response_time <= 0:
            return 0.5

        # Deviation from optimal 35s
        deviation = abs(avg_response_time - self.optimal_time)
        # Scaled penalization: at 0 deviation -> 1.0, at 70s deviation -> 0.2
        score = max(0.2, min(1.0, 1.0 - (deviation / 70.0)))
        return round(score, 3)

    def analyze_student_performance(self, question_attempts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes raw question attempt records and groups by topic.
        Returns analyzed metrics for every attempted topic.
        """
        if not question_attempts:
            return []

        # Group attempts by topic
        grouped_topics: Dict[str, List[Dict[str, Any]]] = {}
        for attempt in question_attempts:
            topic_key = attempt.get("topicId") or attempt.get("topic") or "General"
            if topic_key not in grouped_topics:
                grouped_topics[topic_key] = []
            grouped_topics[topic_key].append(attempt)

        results = []

        for topic_key, attempts in grouped_topics.items():
            # Sort attempts by timestamp ascending (or preserve order)
            total_attempts = len(attempts)
            correct_attempts = sum(1 for a in attempts if a.get("correct") is True)
            overall_accuracy = correct_attempts / total_attempts if total_attempts > 0 else 0.0

            # Recent accuracy: consider last 5 attempts
            recent_slice = attempts[-5:] if total_attempts >= 5 else attempts
            recent_correct = sum(1 for a in recent_slice if a.get("correct") is True)
            recent_accuracy = recent_correct / len(recent_slice) if recent_slice else overall_accuracy

            # Average response time
            total_time = sum(float(a.get("responseTime", 30)) for a in attempts)
            avg_response_time = total_time / total_attempts if total_attempts > 0 else 35.0

            time_performance = self.calculate_time_performance(avg_response_time)

            # Mathematical Explainable Performance Score
            # Performance Score = 0.50 * Overall + 0.30 * Recent + 0.20 * Time
            performance_score = (0.50 * overall_accuracy) + (0.30 * recent_accuracy) + (0.20 * time_performance)
            performance_score = round(max(0.0, min(1.0, performance_score)), 3)

            # Topic Classification:
            # < 0.40 => Weak, 0.40 - 0.70 => Moderate, > 0.70 => Strong
            if performance_score < 0.40:
                level = "Weak"
            elif performance_score <= 0.70:
                level = "Moderate"
            else:
                level = "Strong"

            topic_name = attempts[0].get("topicName") or attempts[0].get("topic") or topic_key
            subject_name = attempts[0].get("subjectName") or "General CS"

            results.append({
                "topicId": topic_key,
                "topic": topic_name,
                "subjectName": subject_name,
                "totalAttempts": total_attempts,
                "correctAttempts": correct_attempts,
                "overallAccuracy": round(overall_accuracy, 3),
                "recentAccuracy": round(recent_accuracy, 3),
                "avgResponseTime": round(avg_response_time, 1),
                "timePerformance": time_performance,
                "performanceScore": performance_score,
                "level": level
            })

        return results
