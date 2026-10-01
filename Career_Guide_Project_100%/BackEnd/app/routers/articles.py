from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app import models, schemas
from app.auth import require_role
from app.database import get_db


router = APIRouter(
    prefix="/articles",
    tags=["Articles"],
)


@router.get(
    "",
    response_model=list[schemas.ArticleResponse],
)
def get_articles(
    db: Session = Depends(get_db),
):
    articles = (
        db.query(models.Article)
        .filter(models.Article.is_deleted.is_(False))
        .order_by(models.Article.created_at.desc())
        .all()
    )

    return articles


@router.get(
    "/{article_id}",
    response_model=schemas.ArticleResponse,
)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
):
    article = (
        db.query(models.Article)
        .filter(
            models.Article.id == article_id,
            models.Article.is_deleted.is_(False),
        )
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article was not found.",
        )

    return article


@router.post(
    "",
    response_model=schemas.ArticleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_article(
    payload: schemas.ArticleCreate,
    current_user: models.User = Depends(
        require_role("counselor", "admin"),
    ),
    db: Session = Depends(get_db),
):
    article = models.Article(
        title=payload.title,
        content=payload.content,
        category=payload.category,
        author_id=current_user.id,
        is_deleted=False,
        deleted_at=None,
    )

    db.add(article)
    db.commit()
    db.refresh(article)

    return article


@router.delete(
    "/{article_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_article(
    article_id: int,
    current_user: models.User = Depends(
        require_role("counselor", "admin"),
    ),
    db: Session = Depends(get_db),
):
    article = (
        db.query(models.Article)
        .filter(
            models.Article.id == article_id,
            models.Article.is_deleted.is_(False),
        )
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article was not found.",
        )

    if (
        current_user.role != "admin"
        and article.author_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete articles that you created.",
        )

    article.is_deleted = True
    article.deleted_at = func.now()

    db.commit()

    return None