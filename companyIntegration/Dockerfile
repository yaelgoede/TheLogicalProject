# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice
FROM mcr.microsoft.com/azure-functions/node:4-node20

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

# Install Azurite globally and Azure Functions Core Tools
RUN npm install -g azurite && \
    curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
    mv microsoft.gpg /etc/apt/trusted.gpg.d/ && \
    sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/debian/$(lsb_release -rs | cut -d'.' -f 1)/prod $(lsb_release -cs) main" > /etc/apt/sources.list.d/dotnetdev.list' && \
    apt-get update && \
    apt-get install -y azure-functions-core-tools-4

WORKDIR /home/site/wwwroot

# Copy package.json and install packages before copying the rest of the code to enable caching
COPY ./companyIntegration/package.json package.json
RUN npm install

# Copy the rest of the code
COPY ./companyIntegration .
RUN npx prisma generate
RUN npm run build

# Expose Azurite ports
EXPOSE 10000 10001 10002

# Start Azurite and the Function App
CMD ["sh", "-c", "azurite --silent --location /data --loose & func start"]