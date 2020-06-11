import logging
from collections import OrderedDict

from gql import gql
from gql.transport.exceptions import TransportQueryError

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
        exception_sender: ExceptionSender,
    ):
        super().__init__()
        self.probe = probe
        self.package = package
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
      id
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

        try:
            result = await self.client.execute(query)
            desired_set = result['thisProbe']['traceSet']['desiredSet']
            await self.update_state(desired_set)
        except:
            pass

    async def main(self):
        """
        listens for changes to the desired_set
        """

        # Request subscription
        subscription = gql(
            '''
subscription probeNotification($traceSetId: String!){
  probeNotification(traceSetId: $traceSetId) {
    message
    traceSet {
      id
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

        await self._send_initial()
        LOGGER.debug('waiting for traces')

        try:
            async for result in self.client.subscribe(
                    subscription,
                    variable_values={'traceSetId': self.trace_set_id}):
                desired_set = result['probeNotification']['traceSet'][
                    'desiredSet']
                LOGGER.debug(
                    'notification', extra={'desired_set': desired_set}
                )
                await self.update_state(desired_set)
        except TransportQueryError as err:
            LOGGER.error('notification returned error', extra={'error': err})
