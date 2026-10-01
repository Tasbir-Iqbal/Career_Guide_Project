from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/chat",
    tags=["Counselor Chat"],
)


def message_to_response(message: models.Message) -> dict:
    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "sender_name": message.sender.name,
        "content": message.content,
        "created_at": message.created_at,
    }


def conversation_to_response(
    conversation: models.Conversation,
    include_messages: bool = False,
) -> dict:
    last_message = None

    if conversation.messages:
        last_message = message_to_response(conversation.messages[-1])

    response = {
        "id": conversation.id,
        "student_id": conversation.student_id,
        "student_name": conversation.student.name,
        "counselor_id": conversation.counselor_id,
        "counselor_name": conversation.counselor.name,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "last_message": last_message,
    }

    if include_messages:
        response["messages"] = [
            message_to_response(message) for message in conversation.messages
        ]

    return response


def get_conversation_for_user(
    conversation_id: int,
    current_user: models.User,
    db: Session,
) -> models.Conversation:
    conversation = (
        db.query(models.Conversation)
        .options(
            joinedload(models.Conversation.student),
            joinedload(models.Conversation.counselor),
            joinedload(models.Conversation.messages).joinedload(
                models.Message.sender
            ),
        )
        .filter(models.Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    if current_user.id not in (
        conversation.student_id,
        conversation.counselor_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this conversation.",
        )

    return conversation


@router.post(
    "/conversations",
    response_model=schemas.ConversationDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_or_get_conversation(
    payload: schemas.ConversationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can start counselor conversations.",
        )

    counselor = (
        db.query(models.User)
        .filter(
            models.User.id == payload.counselor_id,
            models.User.role == "counselor",
        )
        .first()
    )

    if not counselor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselor not found.",
        )

    conversation = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.student_id == current_user.id,
            models.Conversation.counselor_id == counselor.id,
        )
        .first()
    )

    if not conversation:
        conversation = models.Conversation(
            student_id=current_user.id,
            counselor_id=counselor.id,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    loaded_conversation = get_conversation_for_user(
        conversation.id,
        current_user,
        db,
    )

    return conversation_to_response(
        loaded_conversation,
        include_messages=True,
    )


@router.get(
    "/conversations",
    response_model=list[schemas.ConversationResponse],
)
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["student", "counselor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and counselors can access conversations.",
        )

    query = (
        db.query(models.Conversation)
        .options(
            joinedload(models.Conversation.student),
            joinedload(models.Conversation.counselor),
            joinedload(models.Conversation.messages).joinedload(
                models.Message.sender
            ),
        )
    )

    if current_user.role == "student":
        query = query.filter(
            models.Conversation.student_id == current_user.id
        )
    else:
        query = query.filter(
            models.Conversation.counselor_id == current_user.id
        )

    conversations = query.order_by(
        models.Conversation.updated_at.desc()
    ).all()

    return [
        conversation_to_response(conversation)
        for conversation in conversations
    ]


@router.get(
    "/conversations/{conversation_id}",
    response_model=schemas.ConversationDetailResponse,
)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    conversation = get_conversation_for_user(
        conversation_id,
        current_user,
        db,
    )

    return conversation_to_response(
        conversation,
        include_messages=True,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=schemas.MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    conversation_id: int,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["student", "counselor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and counselors can send messages.",
        )

    conversation = get_conversation_for_user(
        conversation_id,
        current_user,
        db,
    )

    content = payload.content.strip()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty.",
        )

    message = models.Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=content,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    message = (
        db.query(models.Message)
        .options(joinedload(models.Message.sender))
        .filter(models.Message.id == message.id)
        .first()
    )

    return message_to_response(message)