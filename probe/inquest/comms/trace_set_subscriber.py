import logging
from collections import OrderedDict

from gql import gql

from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import log_result
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
                        LOGGER.warning(
                            'error in %s:%s %s',
                            module,
                            function,
                            error,
                        )
