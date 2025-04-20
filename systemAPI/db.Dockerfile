FROM node:20-slim

# Install OpenSSL - required by Prisma
RUN apt-get update && apt-get install -y openssl

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app

# Copy only the necessary files for Prisma
COPY ./systemAPI/package.json ./
COPY ./systemAPI/prisma ./prisma/

# Install only the required dependencies
RUN npm install prisma

# Run the database push command
CMD ["npx", "prisma", "db", "push", "--force-reset", "--accept-data-loss"]
