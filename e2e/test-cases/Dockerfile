# production ready dockerfile that runs pnpm start
FROM node:20-alpine

# set working directory
WORKDIR /app

# install pnpm
RUN npm install -g pnpm

# copy project files
COPY . .

# install dependencies
RUN pnpm fetch
RUN pnpm install

# start app
#ENTRYPOINT ["pnpm", "run", "start"]
#CMD tail -f /dev/null
ENTRYPOINT pnpm link /app/permissionless && pnpm run start
