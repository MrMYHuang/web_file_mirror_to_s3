FROM public.ecr.aws/lambda/nodejs:12
COPY *.js *.ts *.json ./
RUN npm install && npm run build
CMD [ "index.handler" ]
