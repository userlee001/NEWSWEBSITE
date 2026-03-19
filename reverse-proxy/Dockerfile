FROM nginx:1.29.6-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /etc/nginx/ssl

COPY ./ssl/fullchain.pem /etc/nginx/ssl/fullchain.pem
COPY ./ssl/reports_baby.key /etc/nginx/ssl/reports_baby.key

COPY ./dist /usr/share/nginx/html

COPY ./writer-frontend /usr/share/nginx/html

EXPOSE 80 443