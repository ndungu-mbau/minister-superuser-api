FROM node:alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN apk add --no-cache make gcc g++ python && \
  yarn && \
  apk del make gcc g++ python

COPY . .

RUN yarn build

CMD [ "node", "bin" ]
