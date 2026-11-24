from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.notice import NoticeType, NoticePriority, NoticeStatus, NoticeTargetType
from app.schemas.user import UserResponse
from app.schemas.academic import DepartmentResponse, CourseResponse, SemesterResponse, SectionResponse


class NoticeBase(BaseModel):
    title: str
    summary: Optional[str] = None
    content: str
    notice_type: NoticeType = NoticeType.GENERAL
    priority: NoticePriority = NoticePriority.NORMAL
    status: NoticeStatus = NoticeStatus.PUBLISHED
    target_type: NoticeTargetType = NoticeTargetType.ALL
    academic_session_id: Optional[int] = None
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    semester_id: Optional[int] = None
    section_id: Optional[int] = None
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_pinned: bool = False
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None


class NoticeCreate(NoticeBase):
    pass


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    notice_type: Optional[NoticeType] = None
    priority: Optional[NoticePriority] = None
    status: Optional[NoticeStatus] = None
    target_type: Optional[NoticeTargetType] = None
    academic_session_id: Optional[int] = None
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    semester_id: Optional[int] = None
    section_id: Optional[int] = None
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_pinned: Optional[bool] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None


class NoticeResponse(NoticeBase):
    id: int
    author_id: Optional[int] = None
    author: Optional[UserResponse] = None
    department: Optional[DepartmentResponse] = None
    course: Optional[CourseResponse] = None
    semester: Optional[SemesterResponse] = None
    section: Optional[SectionResponse] = None
    created_at: datetime
    is_read: bool = False

    model_config = ConfigDict(from_attributes=True)


class NoticeStatsResponse(BaseModel):
    total_notices: int
    published_count: int
    scheduled_count: int
    draft_count: int
    expired_count: int
    pinned_count: int
    urgent_count: int
