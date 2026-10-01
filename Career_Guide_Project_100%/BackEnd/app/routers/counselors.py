from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import require_role
from app.database import get_db


router = APIRouter(
    prefix="/counselors",
    tags=["Counselors"],
)


@router.get(
    "",
    response_model=list[schemas.CounselorResponse],
)
def get_counselors(
    db: Session = Depends(get_db),
):
    counselors = (
        db.query(models.Counselor)
        .join(
            models.User,
            models.User.id == models.Counselor.user_id,
        )
        .filter(
            models.User.is_deleted.is_(False),
            models.Counselor.approval_status == "approved",
        )
        .all()
    )

    return [
        {
            "id": counselor.id,
            "user_id": counselor.user_id,
            "name": counselor.user.name,
            "specialization": counselor.specialization,
            "bio": counselor.bio,
            "availability": counselor.availability,
        }
        for counselor in counselors
    ]


@router.get(
    "/me/sessions",
    response_model=list[schemas.CounselorSessionResponse],
)
def get_my_session_bookings(
    current_user: models.User = Depends(
        require_role("counselor"),
    ),
    db: Session = Depends(get_db),
):
    results = (
        db.query(models.SessionBooking, models.User)
        .join(
            models.User,
            models.User.id == models.SessionBooking.student_id,
        )
        .filter(
            models.SessionBooking.counselor_id == current_user.id,
            models.User.is_deleted.is_(False),
        )
        .order_by(models.SessionBooking.session_date.asc())
        .all()
    )

    return [
        {
            "id": booking.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_email": student.email,
            "counselor_id": booking.counselor_id,
            "session_date": booking.session_date,
            "status": booking.status,
        }
        for booking, student in results
    ]


@router.patch(
    "/me/sessions/{booking_id}",
    response_model=schemas.CounselorSessionResponse,
)
def update_session_booking_status(
    booking_id: int,
    payload: schemas.SessionStatusUpdate,
    current_user: models.User = Depends(
        require_role("counselor"),
    ),
    db: Session = Depends(get_db),
):
    result = (
        db.query(models.SessionBooking, models.User)
        .join(
            models.User,
            models.User.id == models.SessionBooking.student_id,
        )
        .filter(
            models.SessionBooking.id == booking_id,
            models.SessionBooking.counselor_id == current_user.id,
            models.User.is_deleted.is_(False),
        )
        .first()
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session booking was not found.",
        )

    booking, student = result

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A cancelled session cannot be updated.",
        )

    if booking.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A completed session cannot be updated.",
        )

    booking.status = payload.status

    db.commit()
    db.refresh(booking)

    return {
        "id": booking.id,
        "student_id": student.id,
        "student_name": student.name,
        "student_email": student.email,
        "counselor_id": booking.counselor_id,
        "session_date": booking.session_date,
        "status": booking.status,
    }