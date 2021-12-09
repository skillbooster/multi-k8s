FROM node:alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
# start - because nodemon was used only for
# dev purposes
CMD ["npm", "run", "start"]