import logging
from typing import List, Optional, Union

from gql import gql
from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import log_result
from inquest.file_module_resolver import get_root_dir
from inquest.file_sender import FileSender
from inquest.module_tree import FileInfo, ModuleTree

LOGGER = logging.getLogger(__name__)


class ModuleSender(ClientConsumer):
    initialization = True

    def __init__(
        self,
        *,
        url: str,
        package: str,
        root: str,
        glob: Union[str, List[str]],
        exclude: Optional[List[str]] = None,
    ):
        super().__init__()
        self.package = package
        self.sender = FileSender(url)
        self.root_dir = get_root_dir(self.package, root)
        self.glob = glob
        self.exclude = exclude
        self.query = gql(
            """
mutation NewFileContentMutation($input: FileContentInput!) {
  newFileContent(fileInput: $input) {
    name
    classes {
      name
      methods {
        name
      }
    }
    functions {
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

    async def _send_module(self, module: FileInfo, file_id: str):
        params = {
            "input": {
                "fileId": file_id,
                **module.encode()
            },
        }
        LOGGER.debug("input params %s", params)

        result = await self.client.execute(self.query, variable_values=params)
        result = result.to_dict()
        log_result(LOGGER, result)

    async def main(self):
        LOGGER.info("sending modules")
        module_tree = ModuleTree(self.root_dir, self.glob, self.exclude)

        for module in module_tree.modules():
            file_name = module.name
            if not file_name:
                LOGGER.warning(
                    "ModuleTree pulled a module with no known file: %s",
                    module.__name__
                )
                continue
            response = await self.sender.send_file(
                relative_name=module.name,
                filename=module.absolute_name,
                trace_set_id=self.trace_set_id,
            )

            file_id: str = (response).get("fileId")
            LOGGER.debug('sending file %s', module.name)
            if file_id is None:
                LOGGER.error("failed to send file to endpoint")
                continue
            await self._send_module(module, file_id)

        LOGGER.info("modules finished being sent")
