const canvas = document.querySelector("canvas");

const stream = canvas.captureStream(25);
const recordedChunks = [];

console.log(stream);
const options = { mimeType: "video/webm; codecs=vp9" };
const mediaRecorder = new MediaRecorder(stream, options);


function startRecording(){

}