export default async function (field, ms = 5000) {
  const proto = location.protocol == 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${proto}//${location.host}/stt`);
  socket.binaryType = "arraybuffer";
  socket.onerror = console.error;
  socket.onmessage = function (event) {
    const parsed = JSON.parse(event.data || '{}');
    if (parsed.partial) field.value = parsed.partial;
    if (parsed.text) field.value = parsed.text;
  };
  field.value = ""
  await new Promise(next => socket.onopen = next); // wait for socket to open
  field.disabled = true;

  // setup microphone stream
  const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('/static/data-conversion-processor.js');
  const audioProcess = new AudioWorkletNode(audioContext, 'data-conversion-processor', {});
  audioProcess.port.onmessage = (event) => socket.send(event.data)
  socket.send(`{"config" : {"sample_rate" : ${audioContext.sampleRate} }}`);
  const source = audioContext.createMediaStreamSource(audioStream);
  source.connect(audioProcess);

  // timebox the listening
  await new Promise(resolve => setTimeout(resolve, ms));

  // don't socket.close(), let the server close the socket
  socket.send('{"eof" : 1}');
  audioProcess.port.close();
  source.disconnect(audioProcess);
  audioContext.close();
  audioStream.getTracks().map(t => t.stop());
  field.disabled = false;
}