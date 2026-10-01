from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import get_current_user, require_role
from app.database import get_db


router = APIRouter(
    prefix="/feedback",
    tags=["Feedback & Complaints"],
)


def get_feedback_or_404(
    db: Session,
    feedback_id: int,
) -> models.Feedback:
    feedback = (
        db.query(models.Feedback)
        .options(joinedload(models.Feedback.user))
        .filter(models.Feedback.id == feedback_id)
        .first()
    )

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback submission not found.",
        )

    return feedback


def serialize_feedback(feedback: models.Feedback) -> dict:
    return {
        "id": feedback.id,
        "user_id": feedback.user_id,
        "user_name": feedback.user.name,
        "user_email": feedback.user.email,
        "user_role": feedback.user.role,
        "feedback_type": feedback.feedback_type,
        "subject": feedback.subject,
        "message": feedback.message,
        "status": feedback.status,
        "created_at": feedback.created_at,
        "reviewed_at": feedback.reviewed_at,
    }


@router.post(
    "",
    response_model=schemas.FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_feedback(
    payload: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in {"student", "counselor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and counselors can submit feedback.",
        )

    feedback = models.Feedback(
        user_id=current_user.id,
        feedback_type=payload.feedback_type,
        subject=payload.subject.strip(),
        message=payload.message.strip(),
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    feedback = get_feedback_or_404(db, feedback.id)

    return serialize_feedback(feedback)


@router.get(
    "/mine",
    response_model=list[schemas.FeedbackResponse],
)
def get_my_feedback(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in {"student", "counselor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and counselors can view their feedback.",
        )

    feedback_items = (
        db.query(models.Feedback)
        .options(joinedload(models.Feedback.user))
        .filter(models.Feedback.user_id == current_user.id)
        .order_by(models.Feedback.created_at.desc())
        .all()
    )

    return [serialize_feedback(item) for item in feedback_items]


@router.get(
    "/admin/all",
    response_model=list[schemas.FeedbackResponse],
)
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    feedback_items = (
        db.query(models.Feedback)
        .options(joinedload(models.Feedback.user))
        .order_by(models.Feedback.created_at.desc())
        .all()
    )

    return [serialize_feedback(item) for item in feedback_items]


@router.patch(
    "/{feedback_id}/status",
    response_model=schemas.FeedbackResponse,
)
def update_feedback_status(
    feedback_id: int,
    payload: schemas.FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    feedback = get_feedback_or_404(db, feedback_id)

    feedback.status = payload.status
    feedback.reviewed_at = datetime.now()

    db.commit()
    db.refresh(feedback)

    feedback = get_feedback_or_404(db, feedback.id)

    return serialize_feedback(feedback)