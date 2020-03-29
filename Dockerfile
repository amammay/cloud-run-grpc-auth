FROM node:10 as base
ARG project
WORKDIR /app

FROM base as dev
ARG project
COPY ./package*.json ./K
RUN npm install --production
RUN cp -R node_modules /tmp/node_modules

RUN npm install
#copy source code over
COPY ./ .

FROM dev as builder
ARG project
RUN touch .env
RUN npm run lint
RUN npm run build:${project}

# release has min deps to run the app
FROM base as release
ARG project
ENV target=$project
COPY --from=builder /tmp/node_modules ./node_modules
COPY --from=builder /app/dist/apps/${project} ./dist/apps/${project}
COPY --from=builder /app/package.json ./
COPY --from=builder /app/protos ./protos
COPY --from=builder /app/.env ./

ENV PORT=8080
ENV NODE_ENV=production
CMD npm run start:prod:${target}
