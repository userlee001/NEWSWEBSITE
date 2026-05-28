FROM nginx:1.29.6-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY ./reader-frontend /usr/share/nginx/html/reader-frontend

COPY ./writer-frontend /usr/share/nginx/html/writer-frontend