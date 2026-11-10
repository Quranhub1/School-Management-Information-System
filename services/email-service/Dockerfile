FROM node:22-alpine
ENV NODE_ENV=production PORT=5100 EMAIL_SERVICE_HOST=0.0.0.0
WORKDIR /app
COPY services/email-service/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY services/email-service/src ./src
COPY services/email-service/templates ./templates
USER node
EXPOSE 5100
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:5100/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm","start"]
