from fastapi import Request
import time
import logging

logger = logging.getLogger(__name__)


async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing"""
    start_time = time.time()
    
    # Log request method and path
    logger.info(f"Request: {request.method} {request.url.path}")

    # Log whether Authorization header is present (do not log token value)
    auth_header = request.headers.get('authorization')
    if auth_header:
        # Log scheme to verify it's "Bearer <token>"
        parts = auth_header.split(' ', 1)
        if len(parts) == 2:
            logger.info(f"Authorization header: present, scheme: {parts[0]}, token length: {len(parts[1])}")
        else:
            logger.info(f"Authorization header: present but malformed: {auth_header[:50]}")
    else:
        logger.info("Authorization header: missing")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"Completed: {request.method} {request.url.path} "
        f"Status: {response.status_code} "
        f"Duration: {process_time:.3f}s"
    )
    
    return response
