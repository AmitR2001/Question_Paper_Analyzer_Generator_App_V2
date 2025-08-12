#!/usr/bin/env python3
"""
Test script to verify the updated parsing logic works with the raw analysis format
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_logic import parse_multiple_question_analysis

# Test data from your example
test_analysis = """
**Question: Q1 A**
*   **Difficulty Label**: Moderate
*   **Difficulty Score**: 6
*   **Syllabus Alignment Score**: 9 (Directly aligns with Chapter 6: Database Design Using the E-R Model, and Learning Objective 1: Design ER diagram and relational database.)
*   **Bloom's Taxonomy Level**: Create
*   **Application Depth**: 4 (Requires applying knowledge of ER modeling concepts to design a system for a specific scenario, involving identification of entities, attributes, relationships, and cardinalities.)
*   **Estimated Time to Solve**: 20 minutes
*   **Brief Explanation**: This question requires students to design an ER diagram, which involves applying conceptual knowledge to a new scenario (Blood Bank or Residential Society). It demands creativity and understanding of ER modeling principles, making it more than just recall. The "mentioning all the steps" part adds to the complexity.

**Question: Q1 B**
*   **Difficulty Label**: Moderate
*   **Difficulty Score**: 7
*   **Syllabus Alignment Score**: 9 (Directly aligns with Chapter 7: Relational Database Design, specifically Normal Forms and Functional-Dependency Theory, and Learning Objective 2: Apply normalization on given database.)
*   **Bloom's Taxonomy Level**: Apply
*   **Application Depth**: 3 (Involves applying a specific algorithm or process (closure of attributes to find candidate keys) to a given set of functional dependencies.)
*   **Estimated Time to Solve**: 15 minutes
*   **Brief Explanation**: This question requires the application of functional dependency theory to find candidate keys, which is a core concept in normalization. It's not just identifying, but enlisting all steps, which requires a clear understanding of the procedure. The circular dependency makes it slightly more complex than a straightforward case.
"""

def test_parsing():
    print("Testing parsing logic with raw analysis data...")
    print("=" * 60)
    
    # Parse the test analysis
    metrics = parse_multiple_question_analysis(test_analysis, "test")
    
    print(f"Found {len(metrics)} questions")
    print()
    
    for i, metric in enumerate(metrics):
        print(f"Question {i+1}: {metric.get('question_id', 'Unknown')}")
        print(f"  Difficulty Label: {metric.get('difficulty_label', 'Not found')}")
        print(f"  Difficulty Score: {metric.get('difficulty_score', 'Not found')}")
        print(f"  Syllabus Alignment Score: {metric.get('syllabus_alignment_score', 'Not found')}")
        print(f"  Cognitive Level: {metric.get('cognitive_level', 'Not found')}")
        print(f"  Application Depth: {metric.get('application_depth', 'Not found')}")
        print(f"  Complexity Index (scaled): {metric.get('complexity_index', 'Not found')}")
        print(f"  Estimated Time: {metric.get('estimated_time_to_solve', 'Not found')}")
        print(f"  Explanation: {metric.get('explanation', 'Not found')[:100]}...")
        print("-" * 40)
    
    # Test the specific values for bar charts
    print("\nBar Chart Data:")
    print("=" * 30)
    if metrics:
        for i, metric in enumerate(metrics):
            print(f"Q{i+1}:")
            print(f"  📊 Difficulty Score: {metric.get('difficulty_score', 0)}")
            print(f"  🎯 Syllabus Alignment: {metric.get('syllabus_alignment_score', 0)}")
            print(f"  🎯 Application Depth (Complexity): {metric.get('complexity_index', 0)}")
            print()

if __name__ == "__main__":
    test_parsing()
