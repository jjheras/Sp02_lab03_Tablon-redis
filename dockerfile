FROM node:14.17.3-alpine3.14

WORKDIR /usr/src/app

COPY web/ ./
RUN npm install

CMD ["node", "server.js"]