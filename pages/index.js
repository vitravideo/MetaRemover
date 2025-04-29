import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg/dist/esm';
import { useState } from 'react';

export default function Home() {
  const [video, setVideo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const ffmpeg = createFFmpeg({ log: true });

  const load = async () => {
    await ffmpeg.load();
  };

  const removeMetadata = async () => {
    setProcessing(true);
    await load();
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(video));
    await ffmpeg.run('-i', 'input.mp4', '-map_metadata', '-1', '-c:v', 'copy', '-c:a', 'copy', 'output.mp4');
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    setDownloadUrl(url);
    setProcessing(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h1>MetaRemover</h1>
      <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.item(0))} />
      <br /><br />
      {video && <button onClick={removeMetadata}>Remove Metadata</button>}
      <br /><br />
      {processing && <p>Processing...</p>}
      {downloadUrl && <a href={downloadUrl} download="cleaned-video.mp4">Download Clean Video</a>}
    </div>
  );
}
