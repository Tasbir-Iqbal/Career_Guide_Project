import os

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()


class GeminiCareerRecommendation(BaseModel):
    career_title: str = Field(
        min_length=2,
        max_length=150,
        description="A realistic career title.",
    )
    match_percentage: int = Field(
        ge=40,
        le=95,
        description="Estimated compatibility with the student profile.",
    )
    reason: str = Field(
        min_length=30,
        max_length=600,
        description="A specific, student-friendly reason for the recommendation.",
    )


class GeminiCareerRecommendations(BaseModel):
    recommendations: list[GeminiCareerRecommendation] = Field(
        min_length=3,
        max_length=3,
    )


class GeminiRoadmapStage(BaseModel):
    stage_number: int = Field(
        ge=1,
        le=6,
        description="The order of this roadmap stage.",
    )
    title: str = Field(
        min_length=3,
        max_length=120,
        description="A short, practical stage title.",
    )
    timeframe: str = Field(
        min_length=3,
        max_length=80,
        description="A realistic timeframe, for example Weeks 1-4.",
    )
    goal: str = Field(
        min_length=20,
        max_length=300,
        description="A concrete learning or career-preparation goal.",
    )
    actions: list[str] = Field(
        min_length=3,
        max_length=5,
        description="Three to five specific actions for this stage.",
    )
    deliverable: str = Field(
        min_length=15,
        max_length=300,
        description="A tangible project, document, or outcome to complete.",
    )
    readiness_check: str = Field(
        min_length=20,
        max_length=300,
        description="A clear test for deciding whether to move to the next stage.",
    )


class GeminiDetailedRoadmap(BaseModel):
    career_title: str = Field(
        min_length=2,
        max_length=150,
        description="The selected career title.",
    )
    career_goal: str = Field(
        min_length=20,
        max_length=300,
        description="The student's realistic entry-level career goal.",
    )
    starting_point: str = Field(
        min_length=30,
        max_length=500,
        description=(
            "A personalized summary of the student's current strengths and gaps."
        ),
    )
    estimated_total_duration: str = Field(
        min_length=3,
        max_length=100,
        description="A realistic total time estimate for the roadmap.",
    )
    first_7_days: list[str] = Field(
        min_length=5,
        max_length=5,
        description="Exactly five simple actions the student can start this week.",
    )
    stages: list[GeminiRoadmapStage] = Field(
        min_length=4,
        max_length=6,
        description=(
            "Four to six practical stages from current level to entry-level readiness."
        ),
    )
    portfolio_projects: list[str] = Field(
        min_length=3,
        max_length=3,
        description=(
            "Exactly three progressively more challenging portfolio projects."
        ),
    )
    free_or_low_cost_resources: list[str] = Field(
        min_length=3,
        max_length=6,
        description="Useful free or low-cost learning resources or resource types.",
    )
    common_mistakes: list[str] = Field(
        min_length=3,
        max_length=3,
        description="Exactly three common beginner mistakes to avoid.",
    )
    next_best_action: str = Field(
        min_length=15,
        max_length=250,
        description="The single most useful action the student can take today.",
    )
    local_requirements_note: str = Field(
        min_length=10,
        max_length=300,
        description=(
            "A note explaining that local entry, education, licensing, or employer "
            "requirements must be verified."
        ),
    )


def generate_career_recommendations(
    *,
    education_level: str,
    interests: str,
    skills: str,
    favorite_subjects: str,
    work_style: str,
) -> list[GeminiCareerRecommendation]:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Add it to backend/.env and restart FastAPI."
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    prompt = f"""
You are CareerGuide's career guidance assistant.

Recommend exactly three realistic career paths for this student. Base your
recommendations only on their provided profile. Keep recommendations practical,
educational, supportive, and honest. Do not guarantee admission, employment,
salary, or any outcome.

Student profile:
- Education level: {education_level}
- Interests: {interests}
- Skills: {skills}
- Favorite subjects: {favorite_subjects}
- Preferred work style: {work_style}

For every recommendation:
- Use a distinct and specific career title.
- Give an integer match percentage from 40 to 95.
- Write a 2–4 sentence reason that connects the student's stated interests,
  skills, subjects, and work style to the career.
- Include at least one concrete skill or next step to explore.
"""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=GeminiCareerRecommendations.model_json_schema(),
            temperature=0.4,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    result = GeminiCareerRecommendations.model_validate_json(response.text)

    unique_titles: set[str] = set()
    recommendations: list[GeminiCareerRecommendation] = []

    for item in result.recommendations:
        normalized_title = item.career_title.strip().lower()

        if normalized_title in unique_titles:
            continue

        unique_titles.add(normalized_title)

        recommendations.append(
            GeminiCareerRecommendation(
                career_title=item.career_title.strip(),
                match_percentage=item.match_percentage,
                reason=item.reason.strip(),
            )
        )

    if len(recommendations) != 3:
        raise RuntimeError(
            "Gemini did not return three distinct career recommendations."
        )

    return recommendations


def generate_detailed_roadmap(
    *,
    career_title: str,
    education_level: str,
    interests: str,
    skills: str,
    favorite_subjects: str,
    work_style: str,
) -> GeminiDetailedRoadmap:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Add it to backend/.env and restart FastAPI."
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    prompt = f"""
You are CareerGuide's expert career mentor.

Create a detailed, practical, personalized career roadmap for ONE selected
career path. The roadmap must be useful to a student who needs clear actions,
projects, and milestones—not generic encouragement.

Student profile:
- Education level: {education_level}
- Interests: {interests}
- Existing skills: {skills}
- Favorite subjects: {favorite_subjects}
- Preferred work style: {work_style}

Selected career path:
- {career_title}

Quality rules:
- Create 4 to 6 stages in order, from the student's current level to realistic
  entry-level readiness.
- Each stage must have a realistic timeframe, a measurable goal, 3 to 5 specific
  actions, one tangible deliverable, and a clear readiness check.
- Avoid vague advice such as "learn relevant skills", "take courses",
  "gain experience", or "build a portfolio" unless you state exactly what the
  student should learn, do, build, or demonstrate.
- Include exactly five manageable actions for the student's first 7 days.
- Include exactly three portfolio projects that increase in difficulty.
- Include 3 to 6 free or low-cost resources or resource types that match this
  career path.
- Include exactly three common beginner mistakes and how to avoid them.
- Set next_best_action to one useful action the student can begin today.
- Be realistic about time, cost, and entry-level expectations.
- Do not promise a job, salary, university admission, certification, visa, or
  professional license.
- Do not invent country-specific requirements. Use the local_requirements_note
  to tell the student to verify local university, licensing, examination, and
  employer requirements where relevant.
- Return only valid JSON matching the provided response schema.
"""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=GeminiDetailedRoadmap.model_json_schema(),
            temperature=0.35,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty roadmap response.")

    return GeminiDetailedRoadmap.model_validate_json(response.text)