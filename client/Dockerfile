# FROM node:alpine as builder
# FOR envelopes ERROR
FROM node:16-alpine as builder
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx
# PORT FORWARDING to the react app
# it is not nginx exposed to the world as
# a proxy router: React Server/Express Server
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
