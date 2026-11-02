FROM registry.sberdevices.ru/rndml/devops/dockerfiles/nginx-alpine:1.29.5

WORKDIR /usr/share/nginx/html

COPY ./dist/ /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
