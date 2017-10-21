FROM node:6.11.4-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
# For npm@5 or later, copy package-lock.json as well
# COPY package.json package-lock.json ./

RUN yarn install

# Bundle app source
COPY . .

EXPOSE 8200
CMD [ "yarn", "start" ]
