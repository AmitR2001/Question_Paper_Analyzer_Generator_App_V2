import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_logic import generate_dynamic_metrics
import json

# test dynamic metrics generation for diff ai models and difficulties
def test_metrics():
    print("Testing Dynamic Metrics Generation\n")
    
    # test cases with different combos
    test_cases = [
        ("openrouter", "easy", "8"),
        ("gemini", "moderate", "6"),
        ("groq", "tough", "4"),
        ("openrouter", "tough", "7"),
        ("gemini", "easy", "9"),
    ]
    
    for ai_service, difficulty, score in test_cases:
        print(f"AI: {ai_service.upper()}, Difficulty: {difficulty.upper()}, Score: {score}")
        metrics = generate_dynamic_metrics(difficulty, score, ai_service)
        
        # print key metrics
        print(f"  Success Rate: {metrics['success_rate']}")
        print(f"  Difficulty Index: {metrics['difficulty_index']}")
        print(f"  Discrimination Index: {metrics['discrimination_index']}")
        print(f"  Average Time: {metrics['average_time']}s")
        print(f"  AI Model: {metrics['ai_model_used']}")
        print(f"  Student Responses: {len(metrics['student_responses'])} students")
        print("-" * 50)

if __name__ == "__main__":
    test_metrics()
