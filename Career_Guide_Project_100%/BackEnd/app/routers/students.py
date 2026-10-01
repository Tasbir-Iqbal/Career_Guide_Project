from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import require_role
from app.database import get_db


router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


@router.get(
    "/me",
    response_model=schemas.StudentProfileResponse
)
def get_my_profile(
    current_user: models.User = Depends(
        require_role("student")
    ),
    db: Session = Depends(get_db)
):
    profile = (
        db.query(models.StudentProfile)
        .filter(
            models.StudentProfile.user_id == current_user.id
        )
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile was not found."
        )

    return profile


@router.put(
    "/me",
    response_model=schemas.StudentProfileResponse
)
def update_my_profile(
    payload: schemas.StudentProfileUpdate,
    current_user: models.User = Depends(
        require_role("student")
    ),
    db: Session = Depends(get_db)
):
    profile = (
        db.query(models.StudentProfile)
        .filter(
            models.StudentProfile.user_id == current_user.id
        )
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile was not found."
        )

    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


@router.post(
    "/sessions",
    response_model=schemas.SessionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_session_booking(
    payload: schemas.SessionCreate,
    current_user: models.User = Depends(
        require_role("student")
    ),
    db: Session = Depends(get_db)
):
    now = (
        datetime.now(payload.session_date.tzinfo)
        if payload.session_date.tzinfo
        else datetime.now()
    )

    if payload.session_date <= now:
        raise HTTPException(
            status_code=400,
            detail="Session date and time must be in the future."
        )

    counselor = (
        db.query(models.User)
        .filter(
            models.User.id == payload.counselor_id,
            models.User.role == "counselor"
        )
        .first()
    )

    if counselor is None:
        raise HTTPException(
            status_code=404,
            detail="Counselor was not found."
        )

    existing_booking = (
        db.query(models.SessionBooking)
        .filter(
            models.SessionBooking.counselor_id == payload.counselor_id,
            models.SessionBooking.session_date == payload.session_date,
            models.SessionBooking.status.in_(["pending", "confirmed"])
        )
        .first()
    )

    if existing_booking is not None:
        raise HTTPException(
            status_code=409,
            detail="This counselor already has a booking at that date and time."
        )

    booking = models.SessionBooking(
        student_id=current_user.id,
        counselor_id=payload.counselor_id,
        session_date=payload.session_date,
        status="pending"
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


@router.get(
    "/sessions",
    response_model=list[schemas.SessionResponse]
)
def get_my_session_bookings(
    current_user: models.User = Depends(
        require_role("student")
    ),
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(models.SessionBooking)
        .filter(
            models.SessionBooking.student_id == current_user.id
        )
        .order_by(models.SessionBooking.session_date.asc())
        .all()
    )

    return bookings


@router.patch(
    "/sessions/{booking_id}/cancel",
    response_model=schemas.SessionResponse
)
def cancel_my_session_booking(
    booking_id: int,
    current_user: models.User = Depends(
        require_role("student")
    ),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(models.SessionBooking)
        .filter(
            models.SessionBooking.id == booking_id,
            models.SessionBooking.student_id == current_user.id
        )
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Session booking was not found."
        )

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="This session has already been cancelled."
        )

    if booking.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Completed sessions cannot be cancelled."
        )

    booking.status = "cancelled"

    db.commit()
    db.refresh(booking)

    return booking