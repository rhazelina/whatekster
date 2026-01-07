FROM node:lts

WORKDIR /app

ENV PROD=true
ENV PRODUCTION=true

COPY . .

RUN npm i

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]