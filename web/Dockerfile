FROM node:15-alpine AS dependency
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM dependency AS build
COPY . .
RUN npm run build

#FROM node:15-alpine AS prod
FROM build AS prod
#WORKDIR /app
#COPY --from=build /app/.next .
#COPY --from=build /app/package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start"]
