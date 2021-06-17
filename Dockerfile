FROM public.ecr.aws/p3l8q8e7/aws_lambda_nodejs:latest
VOLUME /etc/localtime
COPY *.js *.ts *.json ./
RUN npm install --no-bin-links && npm run build
CMD [ "index.handler" ]
