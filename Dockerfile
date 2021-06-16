FROM public.ecr.aws/lambda/nodejs:12
COPY *.js *.ts *.json ./
RUN yum install -y at-spi2-atk atk cups libxkbcommon libXcomposite pango alsa-lib && npm install && npm run build
CMD [ "index.handler" ]
