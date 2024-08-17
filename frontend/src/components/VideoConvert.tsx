import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { IonButton, IonProgressBar } from "@ionic/react";
import VideoPlayer from "./VideoPlayer";
import axios from "axios";

function VideoConvert() {
  const playerRef: any = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [file, setFile] = useState<File | undefined>();
  const [videoSrc, setVideoSrc] = useState<string | undefined>();
  const [progressBar, setProgress] = useState(0);

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: videoSrc,
        type: "application/x-mpegURL",
      },
    ],
  };

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
  };

  const handleFileChange = async (event: any) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("progress", ({ progress, time }) => {
      setProgress(progress);
    });

    await ffmpeg.writeFile("input.avi", await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      "input.avi",
      "-hls_time",
      "10",
      "-hls_list_size",
      "0",
      "-f",
      "hls",
      "output.m3u8",
    ]);

    const m3u8Data: any = await ffmpeg.readFile("output.m3u8");
    const m3u8Blob = new Blob([m3u8Data.buffer], {
      type: "application/x-mpegURL",
    });

    const formData = new FormData();
    formData.append("file", m3u8Blob);

    await axios.put("http://127.0.0.1:8000/upload/output.m3u8", formData);

    // Upload TS files by assuming a known naming pattern
    let segmentIndex = 0;
    let segmentExists = true;

    while (segmentExists) {
      try {
        const segmentName = `output${segmentIndex}.ts`;
        const tsData: any = await ffmpeg.readFile(segmentName);
        const tsBlob = new Blob([tsData.buffer], { type: "video/MP2T" });

        const formData = new FormData();
        formData.append("file", tsBlob);

        await axios.put(
          "http://127.0.0.1:8000/upload/" + segmentName,
          formData
        );

        segmentIndex++;
      } catch (error) {
        console.log("Error", error);
        handlePlayAgain();
        setVideoSrc("http://127.0.0.1:8000/download/output.m3u8");
        // If a segment file is not found, it means we have uploaded all existing segments
        segmentExists = false;
      }
    }
  };

  useEffect(() => {
    load();
  }, []);


  const handlePlayerReady = (player: any) => {
    playerRef.current = player;
    player.on("waiting", () => {
      console.log("player is waiting");
    });

    player.on("dispose", () => {
      console.log("player will dispose");
    });
  };

  const handlePlayAgain = () => {
    if (playerRef.current) {
      playerRef.current.play();
    }
  };

  return loaded ? (
    <>
      <VideoPlayer options={videoJsOptions} onReady={handlePlayerReady} />
      <input type="file" onChange={handleFileChange} />
      <IonButton onClick={transcode}>Convert</IonButton>
      <IonProgressBar value={progressBar}></IonProgressBar>
      <p ref={messageRef}></p>
    </>
  ) : (
    <>Not loaded</>
  );
}

export default VideoConvert;
