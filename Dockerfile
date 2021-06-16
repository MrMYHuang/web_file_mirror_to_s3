FROM public.ecr.aws/lambda/nodejs:12
COPY index.js package*.json ./
RUN npm install && npm run build
CMD [ "index.handler" ]
