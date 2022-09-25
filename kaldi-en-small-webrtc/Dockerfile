FROM alphacep/kaldi-vosk-server:latest

ENV MODEL_VERSION 0.15
ENV MODEL_BASENAME vosk-model-small-en-us
RUN mkdir /opt/${MODEL_BASENAME} \
   && cd /opt/${MODEL_BASENAME} \
   && wget -q http://alphacephei.com/kaldi/models/${MODEL_BASENAME}-${MODEL_VERSION}.zip \
   && unzip ${MODEL_BASENAME}-${MODEL_VERSION}.zip \
   && mv ${MODEL_BASENAME}-${MODEL_VERSION} model \
   && rm -rf ${MODEL_BASENAME}-${MODEL_VERSION}.zip

EXPOSE 2700
WORKDIR /opt/vosk-server/websocket
CMD [ "python3", "./asr_server.py", "/opt/vosk-model-small-en-us/model" ]