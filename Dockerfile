FROM registry.gitlab.com/lincolnaleixo/dockering:n12puppeteer
ARG project=vacinaja
WORKDIR $project
COPY package.json .
COPY yarn.lock .
COPY app.js .
RUN yarn --production && yarn cache clean --force

ENTRYPOINT ["node","app.js"]