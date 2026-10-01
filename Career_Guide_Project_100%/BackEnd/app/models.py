from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    TIMESTAMP,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    role = Column(
        Enum("student", "counselor", "admin"),
        nullable=False,
        default="student",
    )

    created_at = Column(TIMESTAMP, server_default=func.now())

    # Soft-delete fields
    is_deleted = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True,
    )
    deleted_at = Column(DateTime, nullable=True)

    student_profile = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    counselor_profile = relationship(
        "Counselor",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    student_conversations = relationship(
        "Conversation",
        foreign_keys="Conversation.student_id",
        back_populates="student",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    counselor_conversations = relationship(
        "Conversation",
        foreign_keys="Conversation.counselor_id",
        back_populates="counselor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    sent_messages = relationship(
        "Message",
        back_populates="sender",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    assessment_attempts = relationship(
        "AssessmentAttempt",
        back_populates="student",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    recommendations = relationship(
        "Recommendation",
        back_populates="student",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    student_sessions = relationship(
        "SessionBooking",
        foreign_keys="SessionBooking.student_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    counselor_sessions = relationship(
        "SessionBooking",
        foreign_keys="SessionBooking.counselor_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    hosted_webinars = relationship(
        "Webinar",
        foreign_keys="Webinar.counselor_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    webinar_registrations = relationship(
        "WebinarRegistration",
        foreign_keys="WebinarRegistration.student_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    feedback_entries = relationship(
        "Feedback",
        foreign_keys="Feedback.user_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    education_level = Column(String(100))
    interests = Column(Text)
    career_goals = Column(Text)

    user = relationship("User", back_populates="student_profile")


class Counselor(Base):
    __tablename__ = "counselors"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    specialization = Column(String(150))
    bio = Column(Text)
    availability = Column(String(255))

    approval_status = Column(
        Enum("pending", "approved", "rejected"),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    applied_at = Column(TIMESTAMP, server_default=func.now())
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="counselor_profile")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100))

    author_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at = Column(TIMESTAMP, server_default=func.now())

    # Soft-delete fields
    is_deleted = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True,
    )
    deleted_at = Column(DateTime, nullable=True)


class CareerCategory(Base):
    __tablename__ = "career_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class SessionBooking(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    counselor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    session_date = Column(DateTime, nullable=False)

    status = Column(
        Enum("pending", "confirmed", "completed", "cancelled"),
        default="pending",
    )

    created_at = Column(TIMESTAMP, server_default=func.now())


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    education_level = Column(String(100), nullable=True)
    interests = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    favorite_subjects = Column(Text, nullable=True)
    work_style = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("User", back_populates="assessment_attempts")

    recommendations = relationship(
        "Recommendation",
        back_populates="assessment_attempt",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    assessment_attempt_id = Column(
        Integer,
        ForeignKey("assessment_attempts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    item_type = Column(
        Enum("article", "counselor", "career"),
        nullable=False,
        default="career",
    )

    item_id = Column(Integer, nullable=True)
    score = Column(Float, nullable=False)
    career_title = Column(String(150), nullable=True)
    reason = Column(Text, nullable=True)
    is_selected = Column(Boolean, nullable=False, default=False)
    generated_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("User", back_populates="recommendations")

    assessment_attempt = relationship(
        "AssessmentAttempt",
        back_populates="recommendations",
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    counselor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(TIMESTAMP, server_default=func.now())

    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
    )

    student = relationship(
        "User",
        foreign_keys=[student_id],
        back_populates="student_conversations",
    )

    counselor = relationship(
        "User",
        foreign_keys=[counselor_id],
        back_populates="counselor_conversations",
    )

    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")


class Webinar(Base):
    __tablename__ = "webinars"

    id = Column(Integer, primary_key=True, index=True)

    counselor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    category_id = Column(
        Integer,
        ForeignKey("career_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    meeting_link = Column(String(1000), nullable=False)

    max_attendees = Column(Integer, nullable=True)
    is_cancelled = Column(Boolean, nullable=False, default=False)

    created_at = Column(TIMESTAMP, server_default=func.now())

    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
    )

    counselor = relationship(
        "User",
        foreign_keys=[counselor_id],
        back_populates="hosted_webinars",
    )

    category = relationship("CareerCategory")

    registrations = relationship(
        "WebinarRegistration",
        back_populates="webinar",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class WebinarRegistration(Base):
    __tablename__ = "webinar_registrations"

    id = Column(Integer, primary_key=True, index=True)

    webinar_id = Column(
        Integer,
        ForeignKey("webinars.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    registered_at = Column(TIMESTAMP, server_default=func.now())

    webinar = relationship("Webinar", back_populates="registrations")

    student = relationship(
        "User",
        foreign_keys=[student_id],
        back_populates="webinar_registrations",
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    feedback_type = Column(
        Enum("feedback", "suggestion", "complaint"),
        nullable=False,
        default="feedback",
    )

    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    status = Column(
        Enum("new", "reviewed", "resolved"),
        nullable=False,
        default="new",
    )

    created_at = Column(TIMESTAMP, server_default=func.now())
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="feedback_entries",
    )


class CareerRoadmap(Base):
    __tablename__ = "career_roadmaps"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recommendation_id = Column(
        Integer,
        ForeignKey("recommendations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    career_title = Column(String(150), nullable=False)

    roadmap_json = Column(
        JSON,
        nullable=False,
    )

    created_at = Column(TIMESTAMP, server_default=func.now())

    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
    )