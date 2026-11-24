from typing import Tuple, List, Dict, Any


GRADE_SCALE = [
    {"grade": "A+", "min_percentage": 90.0, "grade_point": 10.0, "status": "PASS", "description": "Outstanding"},
    {"grade": "A",  "min_percentage": 80.0, "grade_point": 9.0,  "status": "PASS", "description": "Excellent"},
    {"grade": "B+", "min_percentage": 70.0, "grade_point": 8.0,  "status": "PASS", "description": "Very Good"},
    {"grade": "B",  "min_percentage": 60.0, "grade_point": 7.0,  "status": "PASS", "description": "Good"},
    {"grade": "C",  "min_percentage": 50.0, "grade_point": 6.0,  "status": "PASS", "description": "Average"},
    {"grade": "D",  "min_percentage": 40.0, "grade_point": 5.0,  "status": "PASS", "description": "Pass"},
    {"grade": "F",  "min_percentage": 0.0,  "grade_point": 0.0,  "status": "FAIL", "description": "Fail"},
]


def calculate_grade(marks_obtained: float, max_marks: float) -> Tuple[str, float, str]:
    """
    Returns (grade, grade_point, result_status)
    e.g. (85.0, 100.0) -> ("A", 9.0, "PASS")
    """
    if max_marks <= 0:
        return "F", 0.0, "FAIL"

    percentage = (marks_obtained / max_marks) * 100.0

    for rule in GRADE_SCALE:
        if percentage >= rule["min_percentage"]:
            return rule["grade"], rule["grade_point"], rule["status"]

    return "F", 0.0, "FAIL"


def calculate_sgpa(subjects: List[Dict[str, Any]]) -> float:
    """
    Calculates SGPA using formula:
    SGPA = sum(credits * grade_point) / sum(credits)
    """
    total_credit_points = 0.0
    total_credits = 0.0

    for s in subjects:
        credits = float(s.get("credits", 0.0))
        grade_point = float(s.get("grade_point", 0.0))
        if credits > 0:
            total_credit_points += (credits * grade_point)
            total_credits += credits

    if total_credits == 0.0:
        return 0.0

    return round(total_credit_points / total_credits, 2)
