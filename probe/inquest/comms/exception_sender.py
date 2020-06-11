import logging

from gql import gql
from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import log_result
from inquest.utils.exceptions import MultiTraceException, ProbeException

LOGGER = logging.getLogger(__name__)


class ExceptionSender(ClientConsumer):

    initialization = True

    def __init__(self,):
        super().__init__()
        self.query = gql(
            '''
mutation ProbeFailureMutation($input: NewProbeFailureInput!) {
  newProbeFailure(newProbeFailure: $input) {
    message
  }
}
                   '''
        )

    async def _send_exception(self, exception: ProbeException):
        LOGGER.debug(
            'sending exception="%s" trace_id="%s"',
            exception.message,
            getattr(exception, 'trace_id', None),
        )
        result = (
            await self.client.execute(
                self.query,
                variable_values={
                    'input':
                        {
                            'message': str(exception.message),
                            'traceId': exception.trace_id,
                        }
                }
            )
        )

    async def send_exception(self, exception: Exception):
        if isinstance(exception, MultiTraceException):
            errors: MultiTraceException = exception
            for error in errors.errors.items():
                if not isinstance(error, ProbeException):
                    error = ProbeException(message=str(error))
                await self._send_exception(error)
        elif isinstance(exception, ProbeException):
            await self._send_exception(exception)
        else:
            await self._send_exception(ProbeException(message=str(exception)))

    async def main(self):
        pass
