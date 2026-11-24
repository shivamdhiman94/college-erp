from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BadRequestException
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.notice import Notice, NoticeRead, NoticeType, NoticePriority, NoticeStatus, NoticeTargetType
from app.schemas.notice import (
    NoticeCreate,
    NoticeUpdate,
    NoticeResponse,
    NoticeStatsResponse,
)
from app.core.events import dispatch_event, EventMessage, EventType, EventScope

router = APIRouter()


@router.get("", response_model=List[NoticeResponse], summary="List targeted notices")
def list_notices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    notice_type: Optional[NoticeType] = None,
    priority: Optional[NoticePriority] = None,
    status_filter: Optional[NoticeStatus] = None,
    search: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Notice)
    now = datetime.utcnow()

    # RBAC & Audience Targeting Filter
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return []

        # Only published & unexpired notices
        query = query.filter(
            Notice.status == NoticeStatus.PUBLISHED,
            Notice.publish_at <= now,
            or_(Notice.expires_at == None, Notice.expires_at >= now)
        )

        # Audience scope matching
        scope_conditions = [
            Notice.target_type == NoticeTargetType.ALL,
            Notice.target_type == NoticeTargetType.STUDENTS,
        ]
        if student.department_id:
            scope_conditions.append(and_(Notice.target_type == NoticeTargetType.DEPARTMENT, Notice.department_id == student.department_id))
        if student.course_id:
            scope_conditions.append(and_(Notice.target_type == NoticeTargetType.COURSE, Notice.course_id == student.course_id))
        if student.current_semester_id:
            scope_conditions.append(and_(Notice.target_type == NoticeTargetType.SEMESTER, Notice.semester_id == student.current_semester_id))
        if student.current_section_id:
            scope_conditions.append(and_(Notice.target_type == NoticeTargetType.SECTION, Notice.section_id == student.current_section_id))

        query = query.filter(or_(*scope_conditions))

    elif current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        dept_id = faculty.department_id if faculty else None

        scope_conditions = [
            Notice.target_type.in_([NoticeTargetType.ALL, NoticeTargetType.FACULTY]),
            Notice.author_id == current_user.id,
        ]
        if dept_id:
            scope_conditions.append(and_(Notice.target_type == NoticeTargetType.DEPARTMENT, Notice.department_id == dept_id))

        query = query.filter(or_(*scope_conditions))
        if status_filter:
            query = query.filter(Notice.status == status_filter)

    elif current_user.role == UserRole.ADMIN:
        if status_filter:
            query = query.filter(Notice.status == status_filter)

    # General Filters
    if notice_type:
        query = query.filter(Notice.notice_type == notice_type)
    if priority:
        query = query.filter(Notice.priority == priority)
    if is_pinned is not None:
        query = query.filter(Notice.is_pinned == is_pinned)
    if search:
        query = query.filter(
            or_(
                Notice.title.ilike(f"%{search}%"),
                Notice.summary.ilike(f"%{search}%"),
                Notice.content.ilike(f"%{search}%")
            )
        )

    # Order: Pinned first, then by priority (URGENT > HIGH > NORMAL > LOW), then by publish date desc
    notices = (
        query
        .order_by(Notice.is_pinned.desc(), Notice.publish_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Compute Read Status for current user
    read_notice_ids = set(
        r[0] for r in db.query(NoticeRead.notice_id).filter(NoticeRead.user_id == current_user.id).all()
    )

    result = []
    for n in notices:
        res_item = NoticeResponse.model_validate(n)
        res_item.is_read = n.id in read_notice_ids
        result.append(res_item)

    return result


@router.post("", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED, summary="Create notice (Admin or Faculty)")
def create_notice(
    payload: NoticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    now = datetime.utcnow()
    publish_at = payload.publish_at or now

    if payload.expires_at and payload.expires_at <= publish_at:
        raise BadRequestException("Expiration date must be later than publication date.")

    notice = Notice(
        title=payload.title.strip(),
        summary=payload.summary.strip() if payload.summary else None,
        content=payload.content.strip(),
        notice_type=payload.notice_type,
        priority=payload.priority,
        status=payload.status,
        target_type=payload.target_type,
        author_id=current_user.id,
        academic_session_id=payload.academic_session_id,
        department_id=payload.department_id,
        course_id=payload.course_id,
        semester_id=payload.semester_id,
        section_id=payload.section_id,
        publish_at=publish_at,
        expires_at=payload.expires_at,
        is_pinned=payload.is_pinned if current_user.role == UserRole.ADMIN else False,
        attachment_url=payload.attachment_url,
        attachment_name=payload.attachment_name,
        attachment_size=payload.attachment_size,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # Centralized Real-Time Event Dispatching
    if notice.status == NoticeStatus.PUBLISHED:
        target_roles = None
        target_scope = EventScope.BROADCAST
        if notice.target_type == NoticeTargetType.STUDENTS:
            target_scope = EventScope.ROLES
            target_roles = [UserRole.STUDENT, UserRole.ADMIN]
        elif notice.target_type == NoticeTargetType.FACULTY:
            target_scope = EventScope.ROLES
            target_roles = [UserRole.FACULTY, UserRole.ADMIN]

        dispatch_event(
            EventMessage(
                event_type=EventType.NOTICE_CREATED,
                payload={
                    "notice_id": notice.id,
                    "title": notice.title,
                    "summary": notice.summary,
                    "priority": notice.priority.value if notice.priority else "NORMAL",
                    "notice_type": notice.notice_type.value if notice.notice_type else "GENERAL",
                    "is_pinned": notice.is_pinned,
                },
                target_scope=target_scope,
                target_roles=target_roles,
                actor={"id": current_user.id, "username": current_user.username, "role": current_user.role.value}
            )
        )

    res = NoticeResponse.model_validate(notice)
    res.is_read = False
    return res


@router.get("/unread-count", summary="Get unread notice count for current user")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notices = list_notices(skip=0, limit=100, db=db, current_user=current_user)
    unread = sum(1 for n in notices if not n.is_read)
    return {"unread_count": unread}


@router.get("/statistics", response_model=NoticeStatsResponse, summary="Notice board statistics (Admin only)")
def get_notice_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    all_notices = db.query(Notice).all()
    now = datetime.utcnow()

    return NoticeStatsResponse(
        total_notices=len(all_notices),
        published_count=sum(1 for n in all_notices if n.status == NoticeStatus.PUBLISHED),
        scheduled_count=sum(1 for n in all_notices if n.status == NoticeStatus.SCHEDULED or (n.status == NoticeStatus.PUBLISHED and n.publish_at > now)),
        draft_count=sum(1 for n in all_notices if n.status == NoticeStatus.DRAFT),
        expired_count=sum(1 for n in all_notices if n.expires_at and n.expires_at < now),
        pinned_count=sum(1 for n in all_notices if n.is_pinned),
        urgent_count=sum(1 for n in all_notices if n.priority in [NoticePriority.URGENT, NoticePriority.HIGH]),
    )


@router.get("/{notice_id}", response_model=NoticeResponse, summary="Get notice details")
def get_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise EntityNotFoundException(f"Notice with ID {notice_id} not found.")

    if current_user.role == UserRole.STUDENT and notice.status != NoticeStatus.PUBLISHED:
        raise PermissionDeniedException("This notice is not accessible.")

    # Auto mark as read on detail retrieval
    read_rec = db.query(NoticeRead).filter(NoticeRead.notice_id == notice_id, NoticeRead.user_id == current_user.id).first()
    if not read_rec:
        db.add(NoticeRead(notice_id=notice_id, user_id=current_user.id, read_at=datetime.utcnow()))
        db.commit()

    res = NoticeResponse.model_validate(notice)
    res.is_read = True
    return res


@router.put("/{notice_id}", response_model=NoticeResponse, summary="Update notice (Admin or Author)")
def update_notice(
    notice_id: int,
    payload: NoticeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise EntityNotFoundException(f"Notice with ID {notice_id} not found.")

    if current_user.role == UserRole.FACULTY and notice.author_id != current_user.id:
        raise PermissionDeniedException("You can only edit notices created by yourself.")

    if payload.title is not None:
        notice.title = payload.title.strip()
    if payload.summary is not None:
        notice.summary = payload.summary.strip()
    if payload.content is not None:
        notice.content = payload.content.strip()
    if payload.notice_type is not None:
        notice.notice_type = payload.notice_type
    if payload.priority is not None:
        notice.priority = payload.priority
    if payload.status is not None:
        notice.status = payload.status
    if payload.target_type is not None:
        notice.target_type = payload.target_type
    if payload.academic_session_id is not None:
        notice.academic_session_id = payload.academic_session_id
    if payload.department_id is not None:
        notice.department_id = payload.department_id
    if payload.course_id is not None:
        notice.course_id = payload.course_id
    if payload.semester_id is not None:
        notice.semester_id = payload.semester_id
    if payload.section_id is not None:
        notice.section_id = payload.section_id
    if payload.publish_at is not None:
        notice.publish_at = payload.publish_at
    if payload.expires_at is not None:
        notice.expires_at = payload.expires_at
    if payload.is_pinned is not None and current_user.role == UserRole.ADMIN:
        notice.is_pinned = payload.is_pinned
    if payload.attachment_url is not None:
        notice.attachment_url = payload.attachment_url
    if payload.attachment_name is not None:
        notice.attachment_name = payload.attachment_name

    db.commit()
    db.refresh(notice)
    return notice


@router.post("/{notice_id}/pin", summary="Pin notice (Admin only)")
def pin_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise EntityNotFoundException(f"Notice with ID {notice_id} not found.")

    notice.is_pinned = True
    db.commit()

    dispatch_event(
        EventMessage(
            event_type=EventType.NOTICE_PINNED,
            payload={"notice_id": notice.id, "title": notice.title, "is_pinned": True},
            target_scope=EventScope.BROADCAST,
            actor={"id": current_user.id, "username": current_user.username, "role": current_user.role.value}
        )
    )

    return {"message": f"Notice '{notice.title}' pinned to top."}


@router.post("/{notice_id}/unpin", summary="Unpin notice (Admin only)")
def unpin_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise EntityNotFoundException(f"Notice with ID {notice_id} not found.")

    notice.is_pinned = False
    db.commit()

    dispatch_event(
        EventMessage(
            event_type=EventType.NOTICE_UNPINNED,
            payload={"notice_id": notice.id, "title": notice.title, "is_pinned": False},
            target_scope=EventScope.BROADCAST,
            actor={"id": current_user.id, "username": current_user.username, "role": current_user.role.value}
        )
    )

    return {"message": f"Notice '{notice.title}' unpinned."}


@router.post("/{notice_id}/read", summary="Mark notice as read")
def mark_notice_read(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    existing = db.query(NoticeRead).filter(NoticeRead.notice_id == notice_id, NoticeRead.user_id == current_user.id).first()
    if not existing:
        db.add(NoticeRead(notice_id=notice_id, user_id=current_user.id, read_at=datetime.utcnow()))
        db.commit()
    return {"message": "Notice marked as read."}


@router.post("/mark-all-read", summary="Mark all notices as read")
def mark_all_notices_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notices = list_notices(skip=0, limit=100, db=db, current_user=current_user)
    for n in notices:
        existing = db.query(NoticeRead).filter(NoticeRead.notice_id == n.id, NoticeRead.user_id == current_user.id).first()
        if not existing:
            db.add(NoticeRead(notice_id=n.id, user_id=current_user.id, read_at=datetime.utcnow()))
    db.commit()
    return {"message": "All notices marked as read."}


@router.delete("/{notice_id}", summary="Delete notice (Admin or Author)")
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise EntityNotFoundException(f"Notice with ID {notice_id} not found.")

    if current_user.role == UserRole.FACULTY and notice.author_id != current_user.id:
        raise PermissionDeniedException("You can only delete notices authored by yourself.")

    db.delete(notice)
    db.commit()
    return {"message": f"Notice '{notice.title}' deleted successfully."}
