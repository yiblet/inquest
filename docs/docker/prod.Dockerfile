FROM node:13.12-buster-slim AS builder
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

FROM builder AS runner
COPY . .
RUN yarn build

FROM nginx:1.19 AS deploy
COPY --from=runner /app/build /usr/share/nginx/html

LABEL name={NAME}
LABEL version={VERSION}
