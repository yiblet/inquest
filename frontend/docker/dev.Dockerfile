FROM node:13.12-buster-slim AS builder
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

FROM builder AS tester
WORKDIR /app
COPY . .
COPY .env.development .env
RUN yarn build

FROM tester AS runner
WORKDIR /app

ENV NODE_ENV development
ENTRYPOINT ["/usr/local/bin/yarn", "start"]

LABEL name={NAME}
LABEL version={VERSION}
