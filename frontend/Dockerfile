FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 15100

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "15100"]