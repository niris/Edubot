FROM alphacep/kaldi-vosk-server:latest

ENV MODEL_VERSION 0.15
ENV VOSK_MODEL_PATH /opt/vosk-model-small-en/model
RUN mkdir /opt/vosk-model-small-en \
   && cd /opt/vosk-model-small-en \
   && wget -q https://alphacephei.com/vosk/models/vosk-model-small-en-us-${MODEL_VERSION}.zip \
   && unzip vosk-model-small-en-us-${MODEL_VERSION}.zip \
   && mv vosk-model-small-en-us-${MODEL_VERSION} model \
   && rm -rf vosk-model-small-en-us-${MODEL_VERSION}.zip \
   && pip install aiohttp aiortc \
   && sed -i 's/frame.planes/frame[0].planes/' /opt/vosk-server/webrtc/asr_server_webrtc.py

EXPOSE 2700
WORKDIR /opt/vosk-server/webrtc
CMD [ "./asr_server_webrtc.py"]