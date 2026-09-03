FROM node:24.8.0-bookworm-slim AS build
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24.8.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN useradd --system --uid 10001 --create-home buzzerhood
COPY --from=build --chown=buzzerhood:buzzerhood /app/package.json /app/package-lock.json ./
COPY --from=build --chown=buzzerhood:buzzerhood /app/node_modules ./node_modules
COPY --from=build --chown=buzzerhood:buzzerhood /app/dist ./dist
USER buzzerhood
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3100/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
