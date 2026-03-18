FROM nginx:1.29.6-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY ./dist /usr/share/nginx/html

COPY ./writer-frontend /usr/share/nginx/html