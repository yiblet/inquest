import logging
from collections import OrderedDict

from gql import gql

from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import log_result
from inquest.hotpatch import TraceException
from inquest.probe import FunctionResolutionException, Probe, TraceSetException

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

    async def update_state(self, desired_set):
        try:
            self.probe.new_desired_state(desired_set)
        except Exception as errors:
            if isinstance(errors, TraceSetException):
                errors: TraceSetException = errors
                for (module, function), error in errors.data.items():
                    if isinstance(error, TraceException):
                        await self._send_exception(error)
                        LOGGER.warning("failed to add trace %s" % error)
                    else:
                        LOGGER.error(
                            'error in %s:%s %s',
                            module,
                            function,
                            error,
                        )
            elif isinstance(errors, FunctionResolutionException):
                errors: FunctionResolutionException = errors
                exc = TraceException(errors.trace_id, errors.exception)
                await self._send_exception(exc)
                LOGGER.warning("failed to resolve function %s" % exc)
            else:
                LOGGER.error(
                    'unexpected in %s',
                    errors,
                )

    async def _send_initial(self):
        query = gql(
            '''\
query InitialProbeInfo {
  thisProbe {
    traceSet {
      key
      desiredSet {
        id
        function {
          name
          parentClass {
            name
          }
          file {
            name
          }
        }
        statement
      }
    }
  }
}
    '''
        )

        result = await self.client.execute(query)
        result = result.to_dict()
        if 'data' in result:
            desired_set = result['data']['thisProbe']['traceSet']['desiredSet']
            await self.update_state(desired_set)

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
          parentClass {
            name
          }
          file {
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

        await self._send_initial()

        async for result in self.client.subscribe(subscription):
            result: OrderedDict = result.to_dict()
            log_result(LOGGER, result)
            if 'data' in result:
                desired_set = result['data']['probeNotification']['traceSet'][
                    'desiredSet']
                await self.update_state(desired_set)
