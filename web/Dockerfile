FROM node:15

# Add Maintainer Info
LABEL maintainer="joshua"

# Create app directory
WORKDIR /app

# Install app dependencies
# where available (npm@5+)
COPY package.json yarn.lock ./

RUN yarn install
# If you are building your code for production
# --only=production

# Copy app
COPY . .

EXPOSE 8000
CMD [ "yarn", "start" ]
