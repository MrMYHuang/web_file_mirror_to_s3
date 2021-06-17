FROM amazon/aws-lambda-nodejs:14
ADD https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm chrome.rpm
RUN yum install -y ./chrome.rpm
COPY *.js *.ts *.json ./
RUN npm install && npm run build
CMD [ "index.handler" ]
