FROM alphacep/kaldi-vosk-server:latest

ENV MODEL_VERSION 0.15
ENV VOSK_MODEL_PATH /opt/vosk-model-th/model
RUN mkdir /opt/vosk-model-th \
   && cd /opt/vosk-model-th \
   && wget -q https://github.com/vistec-AI/commonvoice-th/releases/download/vosk-v1/model.zip \
   && unzip model.zip \
   && rm -rf model.zip \
   && pip install aiohttp aiortc \
   && sed -i 's/frame.planes/frame[0].planes/' /opt/vosk-server/webrtc/asr_server_webrtc.py

EXPOSE 2700
WORKDIR /opt/vosk-server/webrtc
CMD [ "./asr_server_webrtc.py"]