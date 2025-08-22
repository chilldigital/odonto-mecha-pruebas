# Imagen mínima
FROM nginx:alpine

# Limpio el default y subo mi conf
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Archivos estáticos
COPY public/ /usr/share/nginx/html/

# Healthcheck simple
HEALTHCHECK CMD wget -qO- http://127.0.0.1/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
