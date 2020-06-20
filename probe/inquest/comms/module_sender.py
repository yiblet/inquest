import logging
from typing import List, Optional, Union

from gql import gql
from inquest.comms.client_consumer import ClientConsumer
from inquest.comms.utils import wrap_log
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
        glob: Union[str, List[str]],
        exclude: Optional[List[str]] = None,
    ):
        super().__init__()
        self.sender = FileSender(url)
        self.root_dir = get_root_dir()
        self.glob = glob
        self.exclude = exclude
        self.query = gql(
            """
mutation NewFileContentMutation($input: FileContentInput!) {
  newFileContent(fileInput: $input) {
    name
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
        await wrap_log(
            LOGGER, self.client.execute(self.query, variable_values=params)
        )

    async def main(self):
        """
        sends the modules out
        """
        LOGGER.info("sending modules")
        module_tree = ModuleTree(self.root_dir, self.glob, self.exclude)
        modules = {
            module.name: module
            for module in module_tree.modules()
            if module.name  # filters out modules with no known file
        }

        modified_modules = await self.sender.check_hashes(
            self.trace_set_id,
            [
                (module.name, module.absolute_name)
                for module in modules.values()
            ],
        )

        async for module_name, file_id in self.sender.send_files(
                trace_set_id=self.trace_set_id,
                filenames=list((name, modules[name].absolute_name)
                               for name in modified_modules),
        ):
            LOGGER.debug("sending module", extra={"module_name": module_name})
            await self._send_module(modules[module_name], file_id)

    LOGGER.info("modules finished being sent")
