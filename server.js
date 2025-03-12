const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to execute shell commands asynchronously
const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
};

// YouTube Video/Shorts Info Endpoint
app.post('/video-info', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const command = `yt-dlp --dump-json ${url}`;
    const stdout = await executeCommand(command);
    const videoInfo = JSON.parse(stdout);
    res.json({ videoInfo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video info', details: error.stderr || error.message });
  }
});

// Download MP4 Video/Shorts Endpoint
app.post('/download/mp4', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const outputPath = path.join(__dirname, 'temp_video.mp4');
    const command = `yt-dlp -f best -o "${outputPath}" ${url}`;
    await executeCommand(command);
    res.download(outputPath, 'video.mp4', () => fs.unlinkSync(outputPath));
  } catch (error) {
    res.status(500).json({ error: 'Failed to download MP4 video', details: error.stderr || error.message });
  }
});

// Download MP3 Audio Endpoint
app.post('/download/mp3', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const outputPath = path.join(__dirname, 'temp_audio.mp3');
    const command = `yt-dlp -x --audio-format mp3 -o "${outputPath}" ${url}`;
    await executeCommand(command);
    res.download(outputPath, 'audio.mp3', () => fs.unlinkSync(outputPath));
  } catch (error) {
    res.status(500).json({ error: 'Failed to download MP3 audio', details: error.stderr || error.message });
  }
});

// Download Thumbnail Endpoint
app.post('/download/thumbnail', async (req, res) => {
  const { thumbnailUrl } = req.body;
  if (!thumbnailUrl) {
    return res.status(400).json({ error: 'Thumbnail URL is required' });
  }
  try {
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to download thumbnail', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
