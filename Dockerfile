FROM node:carbon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY ./app /usr/src/app/app
COPY ./frontend /usr/src/app/frontend
COPY ./app.js /usr/src/app/
COPY ./config.* /usr/src/app/
COPY ./package.* /usr/src/app/

# Use defaults or ENV file
RUN mv config.js.template config.js

RUN npm install -g webpack

RUN npm install

EXPOSE 3000

CMD [ "npm", "start" ]
