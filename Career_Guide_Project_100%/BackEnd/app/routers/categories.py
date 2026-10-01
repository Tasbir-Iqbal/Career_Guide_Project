from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import require_role
from app.database import get_db


router = APIRouter(
    prefix="/categories",
    tags=["Career Categories"],
)


@router.get(
    "",
    response_model=list[schemas.CareerCategoryResponse],
)
def get_categories(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.CareerCategory)
        .order_by(models.CareerCategory.name.asc())
        .all()
    )


@router.post(
    "",
    response_model=schemas.CareerCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: schemas.CareerCategoryCreate,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    category_name = payload.name.strip()

    existing_category = (
        db.query(models.CareerCategory)
        .filter(models.CareerCategory.name == category_name)
        .first()
    )

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists.",
        )

    category = models.CareerCategory(
        name=category_name,
        description=payload.description.strip()
        if payload.description
        else None,
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_category(
    category_id: int,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
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

    db.delete(category)
    db.commit()