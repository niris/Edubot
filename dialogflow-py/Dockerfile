FROM python:3

WORKDIR /usr/src/app

RUN pip install --no-cache-dir flask google-cloud-dialogflow

COPY app.py conf.json.gpg ./

ENV GOOGLE_APPLICATION_CREDENTIALS=conf.json

CMD [ "sh", "-c", "gpg --batch -o $GOOGLE_APPLICATION_CREDENTIALS --passphrase $GOOGLE_APPLICATION_CREDENTIALS --decrypt ${GOOGLE_APPLICATION_CREDENTIALS}.gpg && python ./app.py" ]