import logging
import sys

from gql import gql

from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import log_result
from inquest.file_sender import FileSender
from inquest.module_tree import ModuleInfo, ModuleTree, convert_module_info

LOGGER = logging.getLogger(__name__)


class ModuleSender(ClientConsumer):

    def __init__(self, *, url: str, package: str):
        super().__init__()
        self.package = package
        self.sender = FileSender(url)
        self.query = gql(
            """
mutation createModuleMutation($input: ModuleInput!) {
  createModule(module: $input) {
    name
    childClasses {
      name
      methods {
        name
      }
    }
    childFunctions {
      name
    }
  }
}
            """
        )

    async def __aenter__(self):
        await super().__aenter__()
        await self.enter_async_context(self.sender)
        return self

    async def _send_module(self, module: ModuleInfo, file_id: int):
        params = {
            "input": convert_module_info(module, file_id),
        }
        LOGGER.debug("input params %s", params)

        result = await self.client.execute(self.query, variable_values=params)
        result = result.to_dict()
        log_result(LOGGER, result)

    async def main(self):
        LOGGER.info("sending modules")
        module_tree = ModuleTree(sys.modules[self.package].__file__)

        for module in module_tree.modules():
            file_name = module.file
            if not file_name:
                LOGGER.warning(
                    "ModuleTree pulled a module with no known file: %s",
                    module.__name__
                )
                continue
            response = (await self.sender.send_file(module.file))
            file_id: str = (response).get("fileId")
            if file_id is None:
                LOGGER.error("failed to send file to endpoint")
                continue
            await self._send_module(module, file_id)

        LOGGER.info("modules finished being sent")
