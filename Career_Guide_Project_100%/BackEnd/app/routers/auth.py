from typing import Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app import models, schemas
from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/signup",
    response_model=Union[
        schemas.TokenResponse,
        schemas.CounselorSignupResponse,
    ],
    status_code=status.HTTP_201_CREATED,
)
def signup(
    payload: schemas.SignupRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(models.User)
        .filter(
            models.User.email == str(payload.email).lower(),
        )
        .first()
    )

    if existing_user and not existing_user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    if existing_user and existing_user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "An account with this email was previously deleted. "
                "Please contact an administrator if you need it restored."
            ),
        )

    if payload.role == "counselor":
        if not payload.specialization or len(payload.specialization.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Counselor specialization is required.",
            )

        if not payload.bio or len(payload.bio.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Please provide a counselor bio of at least 10 characters.",
            )

    user = models.User(
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_deleted=False,
        deleted_at=None,
    )

    db.add(user)
    db.flush()

    if payload.role == "student":
        student_profile = models.StudentProfile(
            user_id=user.id,
        )

        db.add(student_profile)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "name": user.name,
            "role": user.role,
        }

    counselor_profile = models.Counselor(
        user_id=user.id,
        specialization=payload.specialization.strip(),
        bio=payload.bio.strip(),
        availability=(
            payload.availability.strip()
            if payload.availability
            else "Available"
        ),
        approval_status="pending",
    )

    db.add(counselor_profile)
    db.commit()
    db.refresh(user)

    return {
        "message": (
            "Your counselor application was submitted successfully. "
            "You can log in after an administrator approves your account."
        ),
        "user_id": user.id,
        "name": user.name,
        "role": "counselor",
        "approval_status": "pending",
    }


@router.post(
    "/login",
    response_model=schemas.TokenResponse,
)
def login(
    payload: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(
            models.User.email == str(payload.email).lower(),
            models.User.is_deleted.is_(False),
        )
        .first()
    )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if user.role == "counselor":
        counselor_profile = (
            db.query(models.Counselor)
            .filter(models.Counselor.user_id == user.id)
            .first()
        )

        if not counselor_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Counselor profile was not found. "
                    "Please contact an administrator."
                ),
            )

        if counselor_profile.approval_status == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Your counselor application is pending administrator "
                    "approval. Please try again later."
                ),
            )

        if counselor_profile.approval_status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Your counselor application was not approved. "
                    "Please contact an administrator for more information."
                ),
            )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
    }


@router.get("/me")
def get_my_profile(
    current_user: models.User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at,
    }


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_my_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts cannot be deleted from this page.",
        )

    try:
        current_user.is_deleted = True
        current_user.deleted_at = func.now()

        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Your account could not be deleted. Please try again.",
        )