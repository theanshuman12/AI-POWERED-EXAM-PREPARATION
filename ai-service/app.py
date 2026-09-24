"""
FASTAPI AI SERVICE & STANDALONE RUNNER FOR PERFORMANCE ANALYSIS
==============================================================
Provides REST API endpoints for performance analysis and recommendation generation.
Also supports direct stdin/stdout CLI evaluation for integration with parent process.
"""

import sys
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

from performance_analyzer import PerformanceAnalyzer
from recommendation_engine import RecommendationEngine

analyzer = PerformanceAnalyzer()
engine = RecommendationEngine()


def process_analysis_payload(student_id: str, performance_records: list) -> dict:
    analyzed_topics = analyzer.analyze_student_performance(performance_records)

    weak_topics = [t for t in analyzed_topics if t["level"] == "Weak"]
    moderate_topics = [t for t in analyzed_topics if t["level"] == "Moderate"]
    strong_topics = [t for t in analyzed_topics if t["level"] == "Strong"]

    recommendations = engine.generate_recommendations(analyzed_topics)

    total_attempts = len(performance_records)
    total_correct = sum(1 for p in performance_records if p.get("correct") is True)
    overall_accuracy = round(total_correct / total_attempts, 3) if total_attempts > 0 else 0.0

    return {
        "studentId": student_id,
        "overallAccuracy": overall_accuracy,
        "totalQuestionsAttempted": total_attempts,
        "weakTopics": weak_topics,
        "moderateTopics": moderate_topics,
        "strongTopics": strong_topics,
        "recommendations": recommendations,
        "status": "success"
    }


# Try importing FastAPI/Uvicorn if available in the Python runtime
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from typing import List, Optional, Any, Dict

    app = FastAPI(
        title="AI Power Exam Preparation - Recommendation Service",
        description="Explainable Performance Analysis & Adaptive AI Recommendation API",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class PerformanceItem(BaseModel):
        questionId: Optional[str] = None
        topicId: Optional[str] = None
        topic: Optional[str] = None
        topicName: Optional[str] = None
        subjectName: Optional[str] = None
        selectedAnswer: Optional[int] = None
        correct: bool
        responseTime: Optional[float] = 30.0
        difficulty: Optional[str] = "Medium"
        createdAt: Optional[str] = None

    class AnalyzeRequest(BaseModel):
        studentId: str
        performance: List[Dict[str, Any]]

    @app.get("/health")
    def health_check():
        return {
            "status": "AI service running",
            "model": "Explainable Performance & Heuristic Engine (Non-Neural)",
            "version": "1.0.0"
        }

    @app.post("/analyze-performance")
    def analyze_performance_endpoint(request: AnalyzeRequest):
        try:
            return process_analysis_payload(request.studentId, request.performance)
        except Exception as e:
            logger.error(f"Error analyzing performance: {e}")
            raise HTTPException(status_code=500, detail=str(e))

except ImportError:
    app = None


if __name__ == "__main__":
    # If invoked directly via CLI (e.g. from Node.js child_process or terminal)
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        input_data = sys.stdin.read()
        if input_data.strip():
            try:
                payload = json.loads(input_data)
                student_id = payload.get("studentId", "anonymous")
                performance = payload.get("performance", [])
                result = process_analysis_payload(student_id, performance)
                print(json.dumps(result))
            except Exception as e:
                print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(0)
    else:
        # If running as web server with uvicorn
        try:
            import uvicorn
            if app:
                uvicorn.run(app, host="0.0.0.0", port=8000)
            else:
                print("FastAPI not installed, running CLI test mode.")
        except Exception as ex:
            print(f"Uvicorn start note: {ex}")
