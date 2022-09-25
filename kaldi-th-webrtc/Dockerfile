FROM alphacep/kaldi-vosk-server:latest

ENV MODEL_VERSION 0.15
ENV VOSK_MODEL_PATH /opt/vosk-model-th/model
RUN mkdir /opt/vosk-model-th \
   && cd /opt/vosk-model-th \
   && wget -q https://github.com/vistec-AI/commonvoice-th/releases/download/vosk-v1/model.zip \
   && unzip model.zip \
   && rm -rf model.zip

EXPOSE 2701
WORKDIR /opt/vosk-server/websocket
CMD [ "python3", "./asr_server.py", "/opt/vosk-model-th/model" ]