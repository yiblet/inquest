FROM node:13.12-buster-slim AS builder
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

FROM builder AS runner
COPY . .

CMD yarn run start

LABEL name={NAME}
LABEL version={VERSION}
