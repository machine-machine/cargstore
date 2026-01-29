FROM nginx:alpine

# Copy static files
COPY index.html /usr/share/nginx/html/

# Coolify routes to port 3000 by default, configure nginx to match
RUN sed -i 's/listen\s*80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

EXPOSE 3000
