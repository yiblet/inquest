import logging
from collections import OrderedDict

from gql import gql

from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import log_result
from inquest.hotpatch import TraceException
from inquest.probe import Probe

LOGGER = logging.getLogger(__name__)


class TraceSetSubscriber(ClientConsumer):

    def __init__(
        self,
        *,
        probe: Probe,
        package: str,
        trace_set_key: str,
    ):
        super().__init__()
        self.probe = probe
        self.package = package
        self.trace_set_key = trace_set_key

    async def _send_exception(self, exception: TraceException):
        query = gql(
            '''
mutation TraceFailureMutation($message: String!, $traceId: String!) {
  newTraceFailure(message: $message, traceId: $traceId) {
    message
  }
}
                   '''
        )

        LOGGER.debug(
            'sending exception=%s trace_id=%s',
            exception.exception,
            exception.trace_id,
        )
        result = (
            await self.client.execute(
                query,
                variable_values={
                    'message': str(exception.exception),
                    'traceId': exception.trace_id,
                }
            )
        ).to_dict()
        log_result(LOGGER, result)

    async def main(self):
        # Request subscription
        subscription = gql(
            '''
subscription probeNotification {
  probeNotification(traceSetKey: "%s") {
    message
    traceSet {
      key
      desiredSet {
        id
        function {
          name
          module {
            name
          }
        }
        statement
      }
    }
  }
}
        ''' % (self.trace_set_key)
        )

        async for result in self.client.subscribe(subscription):
            result: OrderedDict = result.to_dict()
            log_result(LOGGER, result)
            if 'data' in result:
                desired_set = result['data']['probeNotification']['traceSet'][
                    'desiredSet']
                errors = self.probe.new_desired_state(desired_set)
                if errors is not None:
                    for (module, function), error in errors.items():
                        if isinstance(error, TraceException):
                            await self._send_exception(error)
                        else:
                            LOGGER.error(
                                'error in %s:%s %s',
                                module,
                                function,
                                error,
                            )
