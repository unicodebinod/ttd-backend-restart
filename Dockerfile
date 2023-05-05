FROM node:14

WORKDIR /app

RUN npm install nodemon -g

COPY . .

RUN npm install

CMD ["npx", "nodemon", "app.js"]