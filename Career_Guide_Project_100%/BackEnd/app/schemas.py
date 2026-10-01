from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Authentication ----------

class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)

    role: Literal["student", "counselor"] = "student"

    specialization: Optional[str] = Field(default=None, max_length=150)
    bio: Optional[str] = Field(default=None, max_length=3000)
    availability: Optional[str] = Field(default="Available", max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    role: str


class CounselorSignupResponse(BaseModel):
    message: str
    user_id: int
    name: str
    role: Literal["counselor"]
    approval_status: Literal["pending"]


# ---------- Student profiles ----------

class StudentProfileUpdate(BaseModel):
    education_level: Optional[str] = Field(default=None, max_length=100)
    interests: Optional[str] = None
    career_goals: Optional[str] = None


class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    education_level: Optional[str] = None
    interests: Optional[str] = None
    career_goals: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Articles ----------

class ArticleCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=10)
    category: Optional[str] = Field(default=None, max_length=100)


class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    category: Optional[str] = None
    author_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Counseling bookings ----------

class SessionCreate(BaseModel):
    counselor_id: int
    session_date: datetime


class SessionResponse(BaseModel):
    id: int
    student_id: int
    counselor_id: int
    session_date: datetime
    status: str

    class Config:
        from_attributes = True


# ---------- Counselors ----------

class CounselorResponse(BaseModel):
    id: int
    user_id: int
    name: str
    specialization: Optional[str] = None
    bio: Optional[str] = None
    availability: Optional[str] = None
    approval_status: str = "approved"

    class Config:
        from_attributes = True


class SessionStatusUpdate(BaseModel):
    status: Literal["confirmed", "completed", "cancelled"]


class CounselorSessionResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: EmailStr
    counselor_id: int
    session_date: datetime
    status: str

    class Config:
        from_attributes = True


# ---------- Admin ----------

class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminSessionResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: EmailStr
    counselor_id: int
    counselor_name: str
    counselor_email: EmailStr
    session_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_users: int
    total_students: int
    total_counselors: int
    total_admins: int
    total_sessions: int
    pending_sessions: int
    confirmed_sessions: int
    completed_sessions: int
    cancelled_sessions: int


class AdminCounselorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    specialization: Optional[str] = Field(default=None, max_length=150)
    bio: Optional[str] = Field(default=None, max_length=3000)
    availability: Optional[str] = Field(default="Available", max_length=255)


class AdminCounselorApplicationResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: EmailStr
    specialization: Optional[str] = None
    bio: Optional[str] = None
    availability: Optional[str] = None
    approval_status: Literal["pending", "approved", "rejected"]
    applied_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CounselorApprovalUpdate(BaseModel):
    approval_status: Literal["approved", "rejected"]


# ---------- Career assessment and recommendations ----------

class AssessmentGenerateRequest(BaseModel):
    education_level: str = Field(min_length=2, max_length=100)
    interests: str = Field(min_length=2, max_length=1000)
    skills: str = Field(min_length=2, max_length=1000)
    favorite_subjects: str = Field(min_length=2, max_length=1000)
    work_style: str = Field(min_length=2, max_length=100)


class AssessmentAttemptResponse(BaseModel):
    id: int
    student_id: int
    education_level: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    favorite_subjects: Optional[str] = None
    work_style: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    id: int
    assessment_attempt_id: Optional[int] = None
    career_title: str
    match_percentage: int = Field(ge=0, le=100)
    reason: str
    is_selected: bool
    generated_at: datetime

    class Config:
        from_attributes = True


class AssessmentGenerateResponse(BaseModel):
    assessment: AssessmentAttemptResponse
    recommendations: list[RecommendationResponse]


class CareerSelectionRequest(BaseModel):
    recommendation_id: int


class CareerSelectionResponse(BaseModel):
    id: int
    career_title: str
    match_percentage: int = Field(ge=0, le=100)
    reason: str
    is_selected: bool
    assessment_attempt_id: Optional[int] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class LatestAssessmentResponse(BaseModel):
    assessment: Optional[AssessmentAttemptResponse] = None
    recommendations: list[RecommendationResponse] = []


# ---------- Counselor chat ----------

class ConversationCreate(BaseModel):
    counselor_id: int


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    counselor_id: int
    counselor_name: str
    created_at: datetime
    updated_at: datetime
    last_message: Optional[MessageResponse] = None

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []


# ---------- Career categories ----------

class CareerCategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)


class CareerCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Webinars ----------

class WebinarCreate(BaseModel):
    category_id: Optional[int] = None
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=5000)
    scheduled_at: datetime
    meeting_link: str = Field(min_length=8, max_length=1000)
    max_attendees: Optional[int] = Field(default=None, ge=1, le=10000)


class WebinarUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = Field(
        default=None,
        min_length=10,
        max_length=5000,
    )
    scheduled_at: Optional[datetime] = None
    meeting_link: Optional[str] = Field(
        default=None,
        min_length=8,
        max_length=1000,
    )
    max_attendees: Optional[int] = Field(default=None, ge=1, le=10000)


class WebinarResponse(BaseModel):
    id: int
    counselor_id: int
    counselor_name: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    title: str
    description: str
    scheduled_at: datetime
    max_attendees: Optional[int] = None
    attendee_count: int
    is_registered: bool = False
    is_cancelled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WebinarDetailResponse(WebinarResponse):
    meeting_link: Optional[str] = None


class WebinarRegistrationResponse(BaseModel):
    id: int
    webinar_id: int
    student_id: int
    registered_at: datetime

    class Config:
        from_attributes = True


class WebinarAttendeeResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: EmailStr
    registered_at: datetime


class WebinarCancelResponse(BaseModel):
    message: str
    webinar_id: int
    is_cancelled: bool

# ---------- Feedback and complaints ----------

class FeedbackCreate(BaseModel):
    feedback_type: Literal["feedback", "suggestion", "complaint"] = "feedback"
    subject: str = Field(min_length=3, max_length=255)
    message: str = Field(min_length=10, max_length=5000)


class FeedbackStatusUpdate(BaseModel):
    status: Literal["reviewed", "resolved"]


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: EmailStr
    user_role: str
    feedback_type: Literal["feedback", "suggestion", "complaint"]
    subject: str
    message: str
    status: Literal["new", "reviewed", "resolved"]
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True