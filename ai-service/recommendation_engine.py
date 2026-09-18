"""
AI-POWERED RECOMMENDATION ENGINE (Performance & Heuristic Adaptive Engine)
========================================================================
Generates explainable, personalized, adaptive recommendations based on real
student performance metrics.
"""

from typing import List, Dict, Any


class RecommendationEngine:
    def __init__(self):
        pass

    def generate_topic_recommendation(self, analyzed_topic: Dict[str, Any]) -> Dict[str, Any]:
        """
        Receives an individual topic analysis and creates a targeted, actionable recommendation.
        """
        topic_name = analyzed_topic.get("topic", "Topic")
        topic_id = analyzed_topic.get("topicId", "")
        subject_name = analyzed_topic.get("subjectName", "Computer Science")
        level = analyzed_topic.get("level", "Moderate")
        score = analyzed_topic.get("performanceScore", 0.5)
        recent_acc = analyzed_topic.get("recentAccuracy", 0.5)
        avg_time = analyzed_topic.get("avgResponseTime", 35)

        if level == "Weak":
            rec_difficulty = "Easy"
            action = f"Revise {topic_name} core fundamentals and practice 10 beginner-level conceptual questions."
            reason = (
                f"Your performance score in {topic_name} is {round(score * 100, 1)}% (Recent Accuracy: {round(recent_acc * 100, 1)}%). "
                f"Establishing baseline concept clarity is critical before advancing."
            )
            revision_tips = [
                f"Review definitions, rules, and core formulas of {topic_name}.",
                "Avoid rushing: spend ~45 seconds thoroughly reading each question stem.",
                "Review the comprehensive step-by-step explanations on incorrectly answered questions."
            ]
        elif level == "Moderate":
            rec_difficulty = "Medium"
            action = f"Reinforce {topic_name} with intermediate practice sets and analyze common distractors."
            reason = (
                f"You have attained a moderate score of {round(score * 100, 1)}%. "
                f"Focusing on medium-complexity scenarios will convert this into a strong topic."
            )
            revision_tips = [
                f"Examine multi-step reasoning questions in {topic_name}.",
                "Practice eliminating two incorrect options systematically.",
                f"Work on pacing: your average time is {avg_time}s; target consistent under-40s decisions."
            ]
        else: # Strong
            rec_difficulty = "Hard"
            action = f"Maintain mastery in {topic_name} with timed mocks and advanced edge-case questions."
            reason = (
                f"Excellent grasp! Your performance score is {round(score * 100, 1)}% with high accuracy. "
                f"Challenge yourself with high-difficulty and competitive exam-tier problems."
            )
            revision_tips = [
                "Attempt timed mock test sections under 30-minute constraints.",
                "Review theoretical corner-cases and architectural trade-offs.",
                "Move to adjacent topics or full comprehensive multi-subject mock exams."
            ]

        return {
            "topicId": topic_id,
            "topic": topic_name,
            "subjectName": subject_name,
            "performanceScore": score,
            "performanceLevel": level,
            "recommendedDifficulty": rec_difficulty,
            "action": action,
            "reason": reason,
            "revisionTips": revision_tips
        }

    def generate_recommendations(self, analyzed_topics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sorts topics by lowest performance score first so weakest topics appear with highest urgency.
        """
        sorted_topics = sorted(analyzed_topics, key=lambda x: x.get("performanceScore", 0.0))
        recommendations = [self.generate_topic_recommendation(t) for t in sorted_topics]
        return recommendations
