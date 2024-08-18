###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:18 As development
RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY --chown=node:node package.json pnpm-lock.yaml /key ./

RUN pnpm fetch --prod

COPY --chown=node:node . .
RUN pnpm install

RUN pnpm prisma generate

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18 As build
RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY --chown=node:node package.json pnpm-lock.yaml ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN pnpm prisma generate

RUN pnpm build

ENV NODE_ENV production

RUN pnpm install --prod

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]
