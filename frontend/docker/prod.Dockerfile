FROM node:13.12-buster-slim AS builder
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

COPY . .
RUN yarn build

FROM node:13.12-buster-slim AS runner
WORKDIR /app

COPY --from=builder /app/.env /app/.env
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

ENTRYPOINT ["/usr/local/bin/yarn", "start"]

LABEL name={NAME}
LABEL version={VERSION}
