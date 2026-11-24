from fastapi import HTTPException, status


class BadRequestException(HTTPException):
    def __init__(self, detail: str = "Invalid request payload or parameters"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class EntityNotFoundException(HTTPException):
    def __init__(self, detail: str = "Requested resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class EntityAlreadyExistsException(HTTPException):
    def __init__(self, detail: str = "Resource with this identifier already exists"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ConflictException(HTTPException):
    def __init__(self, detail: str = "Resource conflict encountered"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class PermissionDeniedException(HTTPException):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class InvalidCredentialsException(HTTPException):
    def __init__(self, detail: str = "Invalid username/email or password"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class TokenExpiredOrInvalidException(HTTPException):
    def __init__(self, detail: str = "Token is invalid, expired, or revoked"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
