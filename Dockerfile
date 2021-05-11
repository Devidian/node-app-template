# ============== build stage ==================
FROM node:14 as builder

WORKDIR /app

COPY "./" "/app/"

RUN yarn
RUN yarn build

# ============== runtime stage ================
FROM node:14-alpine as runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder "/app/dist/" "/app/dist"
COPY --from=builder "/app/assets/" "/app/assets"
COPY --from=builder "/app/package.json" "/app/package.json"

RUN yarn --production

CMD ["yarn","start:prod"]