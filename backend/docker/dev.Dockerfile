FROM node:13.12-buster AS builder
RUN apt update 
RUN apt install -y python3
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

FROM builder AS tester
WORKDIR /app
COPY . .
RUN make test

FROM tester AS runner
WORKDIR /app

USER 1001
ENTRYPOINT ["/usr/local/bin/yarn", "start"]

LABEL name={NAME}
LABEL version={VERSION}
