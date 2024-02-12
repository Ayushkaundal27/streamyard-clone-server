const express = require("express");
const app = express();
const EventEmitter = require("node:events");
const myEmitter = new EventEmitter();
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const { Blob } = require("buffer");
const { Buffer } = require("node:buffer");
const spawn = require("child_process").spawn;
const cors = require("cors");
Blob.type = "";
ffmpeg.setFfmpegPath(ffmpegPath);
app.use(cors());
var command = new ffmpeg();
const ffmpegCommand = [
  "-i",
  "-",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-max_muxing_queue_size",
  "1000",
  "-bufsize",
  "500000",
  "-r",
  "15",
  "-g",
  "30",
  "-profile:v",
  "baseline",
  "-level",
  "3",
  "-c:a",
  "aac",
  "-f",
  "flv",
  "rtmp://a.rtmp.youtube.com/live2/xb09-4ec4-09ur-f94f-6sv7",
  "-i",
  "-",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-max_muxing_queue_size",
  "1000",
  "-bufsize",
  "500000",
  "-r",
  "15",
  "-g",
  "30",
  "-profile:v",
  "baseline",
  "-level",
  "3",
  "-c:a",
  "aac",
  "-f",
  "flv",
  "rtmp://live.twitch.tv/app/live_227753964_dOJBU4G3qVcMQgSBNmScYvgNez1s7f",
];

const ffmpegProcess = spawn("ffmpeg", ffmpegCommand);
console.log(ffmpegProcess);
const webrtc = require("wrtc");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
let peer;
let dataChannel;
app.post("/broadcast", async ({ body }, res) => {
  function onReceiveMessageCallback(event) {
    console.log("Received Message", event.channel);
    const datachannel = event.channel;
    dataChannel.binaryType = "blob";
  }
  peer = new webrtc.RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org",
      },
    ],
  });
  const desc = new webrtc.RTCSessionDescription(body.sdp);
  await peer.setRemoteDescription(desc);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  const payload = {
    sdp: peer.localDescription,
    p: peer,
  };
  peer.onicecandidate = (e) => {
    payload.p.addicecandidate = e.candidate;
  };
  peer.ondatachannel = (dc) => {
    dataChannel = dc.channel;
    dataChannel.onmessage = (e) => {
      var a = Buffer.from(e.data);
      console.log(a);
      ffmpegProcess.stdin.write(a);
    };
  };
  res.json(payload);
});

// Start the server
app.listen(5000, () => console.log("server started"));
