import logging
from collections import OrderedDict

from gql import gql
from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.exception_sender import ExceptionSender
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
        exception_sender: ExceptionSender,
    ):
        super().__init__()
        self.probe = probe
        self.package = package
        self.trace_set_key = trace_set_key
        self.exception_sender = exception_sender

    async def update_state(self, desired_set):
        try:
            self.probe.new_desired_state(desired_set)
        except Exception as exc:
            await self.exception_sender.send_exception(exc)

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
        line
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
        line
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
