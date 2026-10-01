from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import get_current_user, require_role
from app.database import get_db


router = APIRouter(
    prefix="/webinars",
    tags=["Webinars"],
)


def get_counselor_or_404(
    db: Session,
    counselor_id: int,
) -> models.Counselor:
    counselor = (
        db.query(models.Counselor)
        .filter(models.Counselor.user_id == counselor_id)
        .first()
    )

    if not counselor or counselor.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only approved counselors can manage webinars.",
        )

    return counselor


def get_webinar_or_404(
    db: Session,
    webinar_id: int,
) -> models.Webinar:
    webinar = (
        db.query(models.Webinar)
        .options(
            joinedload(models.Webinar.counselor),
            joinedload(models.Webinar.category),
            joinedload(models.Webinar.registrations),
        )
        .filter(models.Webinar.id == webinar_id)
        .first()
    )

    if not webinar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webinar not found.",
        )

    return webinar


def serialize_webinar(
    webinar: models.Webinar,
    current_user_id: int | None = None,
    include_meeting_link: bool = False,
) -> dict:
    attendee_count = len(webinar.registrations)

    is_registered = False
    if current_user_id is not None:
        is_registered = any(
            registration.student_id == current_user_id
            for registration in webinar.registrations
        )

    result = {
        "id": webinar.id,
        "counselor_id": webinar.counselor_id,
        "counselor_name": webinar.counselor.name,
        "category_id": webinar.category_id,
        "category_name": webinar.category.name if webinar.category else None,
        "title": webinar.title,
        "description": webinar.description,
        "scheduled_at": webinar.scheduled_at,
        "max_attendees": webinar.max_attendees,
        "attendee_count": attendee_count,
        "is_registered": is_registered,
        "is_cancelled": webinar.is_cancelled,
        "created_at": webinar.created_at,
    }

    if include_meeting_link:
        result["meeting_link"] = webinar.meeting_link

    return result


def validate_category(
    db: Session,
    category_id: int | None,
) -> None:
    if category_id is None:
        return

    category = (
        db.query(models.CareerCategory)
        .filter(models.CareerCategory.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career category not found.",
        )


@router.get(
    "",
    response_model=list[schemas.WebinarResponse],
)
def list_webinars(
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user),
):
    webinars = (
        db.query(models.Webinar)
        .options(
            joinedload(models.Webinar.counselor),
            joinedload(models.Webinar.category),
            joinedload(models.Webinar.registrations),
        )
        .filter(models.Webinar.scheduled_at >= datetime.now())
        .order_by(models.Webinar.scheduled_at.asc())
        .all()
    )

    current_user_id = current_user.id if current_user else None

    return [
        serialize_webinar(
            webinar,
            current_user_id=current_user_id,
        )
        for webinar in webinars
    ]


@router.get(
    "/mine",
    response_model=list[schemas.WebinarDetailResponse],
)
def get_my_webinars(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = (
        db.query(models.Webinar)
        .options(
            joinedload(models.Webinar.counselor),
            joinedload(models.Webinar.category),
            joinedload(models.Webinar.registrations),
        )
    )

    include_meeting_link = False

    if current_user.role == "counselor":
        get_counselor_or_404(db, current_user.id)
        webinars = (
            query.filter(models.Webinar.counselor_id == current_user.id)
            .order_by(models.Webinar.scheduled_at.desc())
            .all()
        )
        include_meeting_link = True

    elif current_user.role == "student":
        webinars = (
            query.join(
                models.WebinarRegistration,
                models.WebinarRegistration.webinar_id == models.Webinar.id,
            )
            .filter(models.WebinarRegistration.student_id == current_user.id)
            .order_by(models.Webinar.scheduled_at.asc())
            .all()
        )
        include_meeting_link = True

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is available to students and counselors.",
        )

    return [
        serialize_webinar(
            webinar,
            current_user_id=current_user.id,
            include_meeting_link=include_meeting_link,
        )
        for webinar in webinars
    ]


@router.get(
    "/admin/all",
    response_model=list[schemas.WebinarResponse],
)
def get_all_webinars_for_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    webinars = (
        db.query(models.Webinar)
        .options(
            joinedload(models.Webinar.counselor),
            joinedload(models.Webinar.category),
            joinedload(models.Webinar.registrations),
        )
        .order_by(models.Webinar.scheduled_at.desc())
        .all()
    )

    return [serialize_webinar(webinar) for webinar in webinars]


@router.post(
    "",
    response_model=schemas.WebinarDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_webinar(
    payload: schemas.WebinarCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("counselor")),
):
    get_counselor_or_404(db, current_user.id)
    validate_category(db, payload.category_id)

    if payload.scheduled_at <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webinar time must be in the future.",
        )

    webinar = models.Webinar(
        counselor_id=current_user.id,
        category_id=payload.category_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        scheduled_at=payload.scheduled_at,
        meeting_link=payload.meeting_link.strip(),
        max_attendees=payload.max_attendees,
    )

    db.add(webinar)
    db.commit()
    db.refresh(webinar)

    webinar = get_webinar_or_404(db, webinar.id)

    return serialize_webinar(
        webinar,
        current_user_id=current_user.id,
        include_meeting_link=True,
    )


@router.get(
    "/{webinar_id}",
    response_model=schemas.WebinarDetailResponse,
)
def get_webinar_detail(
    webinar_id: int,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user),
):
    webinar = get_webinar_or_404(db, webinar_id)

    include_meeting_link = False

    if current_user:
        is_owner = (
            current_user.role == "counselor"
            and webinar.counselor_id == current_user.id
        )
        is_registered = any(
            registration.student_id == current_user.id
            for registration in webinar.registrations
        )

        include_meeting_link = is_owner or is_registered

    return serialize_webinar(
        webinar,
        current_user_id=current_user.id if current_user else None,
        include_meeting_link=include_meeting_link,
    )


@router.patch(
    "/{webinar_id}",
    response_model=schemas.WebinarDetailResponse,
)
def update_webinar(
    webinar_id: int,
    payload: schemas.WebinarUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("counselor")),
):
    get_counselor_or_404(db, current_user.id)
    webinar = get_webinar_or_404(db, webinar_id)

    if webinar.counselor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own webinars.",
        )

    if webinar.is_cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled webinars cannot be updated.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        validate_category(db, update_data["category_id"])

    if "scheduled_at" in update_data:
        if update_data["scheduled_at"] <= datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webinar time must be in the future.",
            )

    if "max_attendees" in update_data:
        new_limit = update_data["max_attendees"]

        if (
            new_limit is not None
            and new_limit < len(webinar.registrations)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "The attendee limit cannot be lower than the "
                    "current number of registered students."
                ),
            )

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(webinar, field, value)

    db.commit()
    db.refresh(webinar)

    webinar = get_webinar_or_404(db, webinar.id)

    return serialize_webinar(
        webinar,
        current_user_id=current_user.id,
        include_meeting_link=True,
    )


@router.post(
    "/{webinar_id}/register",
    response_model=schemas.WebinarRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_for_webinar(
    webinar_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("student")),
):
    webinar = get_webinar_or_404(db, webinar_id)

    if webinar.is_cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This webinar has been cancelled.",
        )

    if webinar.scheduled_at <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot register for a webinar that has already started.",
        )

    existing_registration = (
        db.query(models.WebinarRegistration)
        .filter(
            models.WebinarRegistration.webinar_id == webinar_id,
            models.WebinarRegistration.student_id == current_user.id,
        )
        .first()
    )

    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already registered for this webinar.",
        )

    if (
        webinar.max_attendees is not None
        and len(webinar.registrations) >= webinar.max_attendees
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This webinar is full.",
        )

    registration = models.WebinarRegistration(
        webinar_id=webinar_id,
        student_id=current_user.id,
    )

    db.add(registration)
    db.commit()
    db.refresh(registration)

    return registration


@router.get(
    "/{webinar_id}/attendees",
    response_model=list[schemas.WebinarAttendeeResponse],
)
def get_webinar_attendees(
    webinar_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("counselor")),
):
    get_counselor_or_404(db, current_user.id)
    webinar = get_webinar_or_404(db, webinar_id)

    if webinar.counselor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view attendees for your own webinars.",
        )

    registrations = (
        db.query(models.WebinarRegistration)
        .options(joinedload(models.WebinarRegistration.student))
        .filter(models.WebinarRegistration.webinar_id == webinar_id)
        .order_by(models.WebinarRegistration.registered_at.asc())
        .all()
    )

    return [
        {
            "id": registration.id,
            "student_id": registration.student_id,
            "student_name": registration.student.name,
            "student_email": registration.student.email,
            "registered_at": registration.registered_at,
        }
        for registration in registrations
    ]


@router.post(
    "/{webinar_id}/cancel",
    response_model=schemas.WebinarCancelResponse,
)
def cancel_webinar(
    webinar_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    webinar = get_webinar_or_404(db, webinar_id)

    is_owner = (
        current_user.role == "counselor"
        and webinar.counselor_id == current_user.id
    )
    is_admin = current_user.role == "admin"

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot cancel this webinar.",
        )

    if webinar.is_cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This webinar is already cancelled.",
        )

    webinar.is_cancelled = True
    db.commit()

    return {
        "message": "Webinar cancelled successfully.",
        "webinar_id": webinar.id,
        "is_cancelled": True,
    }