# Explicit manual rollback fixture: always returns HTTP 503, no external calls.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf
RUN apk add --no-cache 'libcrypto3>=3.5.8-r0' 'libssl3>=3.5.8-r0'
USER 1000:1000
EXPOSE 3000
CMD ["node", "-e", "require('http').createServer((req,res)=>{res.writeHead(503);res.end('rollback fixture')}).listen(3000,'0.0.0.0')"]
