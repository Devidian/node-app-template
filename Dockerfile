# ============== build stage ==================
FROM node:16 as build-stage

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

ENV NODE_ENV=production
RUN yarn build

# ============== runtime stage ================
FROM node:16-alpine as runtime

WORKDIR /app

COPY --from=build-stage "/app/dist/" "/app/dist"
COPY --from=build-stage "/app/assets/" "/app/assets"
COPY --from=build-stage "/app/package.json" "/app/package.json"

RUN yarn install --only=production

CMD ["yarn","start:prod"]