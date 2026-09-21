FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE=/api
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default matches the docker-compose service name; override BACKEND_URL
# (e.g. https://your-backend.onrender.com) when deploying frontend and
# backend as separate hosted services.
ENV BACKEND_URL=http://backend:8000

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
