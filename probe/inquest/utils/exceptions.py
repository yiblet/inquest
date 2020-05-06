from typing import Dict, Optional


class ProbeException(Exception):

    def __init__(self, *, message: str, trace_id: Optional[str] = None):
        super().__init__(message, trace_id)
        self.trace_id = trace_id
        self.message = message


class MultiTraceException(Exception):

    def __init__(self, errors: Dict[str, Exception]):
        self.errors = errors
        super().__init__(errors)
