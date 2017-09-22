FROM node
RUN mkdir -p /srv/
WORKDIR /srv/

COPY package.json /srv/
RUN npm install

COPY . /srv/
RUN npm run build

ENV NODE_ENV=production
CMD [ "node", "/srv/index.js" ]
