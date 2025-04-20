# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice
FROM mcr.microsoft.com/azure-functions/node:4-node20

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /home/site/wwwroot

# Copy package.json and install packages before copying the rest of the code to enable caching
COPY ./systemAPI/package.json package.json
RUN npm install

# Copy the rest of the code
COPY ./systemAPI .
RUN npx prisma generate
RUN npm run build
