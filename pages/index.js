import { useState, useEffect } from 'react';

let ffmpeg;
let createFFmpeg, fetchFile;

export default function Home() {
  const [video, setVideo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState('720');

  useEffect(() => {
    const load = async () => {
      const ffmpegModule = await import('@ffmpeg/ffmpeg');
      createFFmpeg = ffmpegModule.createFFmpeg;
      fetchFile = ffmpegModule.fetchFile;

      ffmpeg = createFFmpeg({
        log: true,
        corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      });

      try {
        await ffmpeg.load();
        setReady(true);
      } catch (error) {
        console.error('FFmpeg failed to load:', error);
      }
    };
    load();
  }, []);

  const getScale = (quality) => {
    if (quality === '1080') return '1920:1080';
    if (quality === '720') return '1280:720';
    if (quality === '480') return '854:480';
    return null;
  };

  const removeMetadata = async () => {
    if (!video || !ffmpeg) return;

    setProcessing(true);
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(video));

    const scale = getScale(quality);
    const outputArgs = scale
      ? ['-i', 'input.mp4', '-vf', `scale=${scale}`, '-map_metadata', '-1', '-c:a', 'copy', 'output.mp4']
      : ['-i', 'input.mp4', '-map_metadata', '-1', '-c:v', 'copy', '-c:a', 'copy', 'output.mp4'];

    await ffmpeg.run(...outputArgs);

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    setDownloadUrl(url);
    setProcessing(false);
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem',
      textAlign: 'center',
      background: '#f9f9f9',
      borderRadius: '12px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#333', marginBottom: '1rem' }}>🎥 MetaRemover</h1>

      {!ready && <p style={{ color: '#777' }}>Loading video engine... please wait...</p>}

      {ready && (
        <>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              setDownloadUrl('');
              setVideo(e.target.files?.item(0));
            }}
            style={{
              margin: '1rem 0',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              width: '100%'
            }}
          />

          <div style={{ margin: '1rem 0' }}>
            <label>Select Output Quality: </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
            >
              <option value="1080">1080p</option>
              <option value="720">720p</option>
              <option value="480">480p</option>
            </select>
          </div>

          {!processing && video && (
            <button
              onClick={removeMetadata}
              style={{
                backgroundColor: '#0070f3',
                color: '#fff',
                padding: '10px 20px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Remove Metadata & Resize
            </button>
          )}

          {processing && <p style={{ color: '#555', marginTop: '1rem' }}>⏳ Processing... please wait...</p>}

          {downloadUrl && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ color: 'green' }}>✅ Done!</h3>
              <a
                href={downloadUrl}
                download="cleaned-video.mp4"
                style={{
                  fontSize: '18px',
                  color: '#0070f3',
                  textDecoration: 'underline'
                }}
              >
                Click here to download cleaned video
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
