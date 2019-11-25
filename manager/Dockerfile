FROM node:13-alpine

RUN apk add --no-cache --update curl
RUN rm -rf /var/cache/apk/*
RUN npm install -g nodemon

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install --only=prod

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=3s --retries=1 CMD curl --connect-timeout 1 --max-time 2 --fail -I localhost:3000/health

ENTRYPOINT [ "nodemon" ]
