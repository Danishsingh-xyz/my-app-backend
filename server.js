const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow requests from any origin (update this in production)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Path to ffmpeg binary
const ffmpegPath = '/usr/bin/ffmpeg'; // Default path for ffmpeg on Linux

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

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the YouTube Downloader API',
    endpoints: {
      videoInfo: 'POST /video-info',
      downloadMP4: 'POST /download/mp4',
      downloadMP3: 'POST /download/mp3',
      downloadThumbnail: 'POST /download/thumbnail'
    }
  });
});

// YouTube Video/Shorts Info Endpoint
app.post('/video-info', async (req, res) => {
  const { url } = req.body;
  console.log('Received URL for video/shorts info:', url);

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const command = `yt-dlp --cookies cookies.txt --dump-json ${url}`;
    console.log('Executing command:', command);

    const stdout = await executeCommand(command);
    const videoInfo = JSON.parse(stdout);

    // Send video/shorts info to the client
    res.json({ videoInfo });
  } catch (error) {
    console.error('Error fetching video/shorts info:', error);
    res.status(500).json({ error: 'Failed to fetch video/shorts info', details: error.stderr || error.message });
  }
});

// Download MP4 Video/Shorts Endpoint
app.post('/download/mp4', async (req, res) => {
  const { url } = req.body;
  console.log('Received URL for MP4 download:', url);

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const outputPath = path.join(__dirname, 'temp_video.mp4');
    const command = `yt-dlp --cookies cookies.txt -f best -o "${outputPath}" ${url}`;
    console.log('Executing command:', command);

    await executeCommand(command);

    if (!fs.existsSync(outputPath)) {
      console.error('File not found:', outputPath);
      return res.status(500).json({ error: 'File not found' });
    }

    // Stream the file to the client
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Delete the file after streaming
    fileStream.on('end', () => {
      fs.unlinkSync(outputPath);
      console.log('File deleted:', outputPath);
    });

    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ error: 'Failed to stream file' });
    });
  } catch (error) {
    console.error('Error downloading MP4 video/shorts:', error);
    res.status(500).json({ error: 'Failed to download MP4 video/shorts', details: error.stderr || error.message });
  }
});

// Download MP3 Audio Endpoint
app.post('/download/mp3', async (req, res) => {
  const { url } = req.body;
  console.log('Received URL for MP3 download:', url);

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const outputPath = path.join(__dirname, 'temp_audio.mp3');
    const command = `yt-dlp --cookies cookies.txt -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" -o "${outputPath}" ${url}`;
    console.log('Executing command:', command);

    await executeCommand(command);

    if (!fs.existsSync(outputPath)) {
      console.error('File not found:', outputPath);
      return res.status(500).json({ error: 'File not found' });
    }

    // Stream the file to the client
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Delete the file after streaming
    fileStream.on('end', () => {
      fs.unlinkSync(outputPath);
      console.log('File deleted:', outputPath);
    });

    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ error: 'Failed to stream file' });
    });
  } catch (error) {
    console.error('Error downloading MP3 audio:', error);
    res.status(500).json({ error: 'Failed to download MP3 audio', details: error.stderr || error.message });
  }
});

// Download Thumbnail Endpoint
app.post('/download/thumbnail', async (req, res) => {
  const { thumbnailUrl } = req.body;
  console.log('Received thumbnail URL:', thumbnailUrl);

  if (!thumbnailUrl) {
    return res.status(400).json({ error: 'Thumbnail URL is required' });
  }

  try {
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="thumbnail.jpg"');
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading thumbnail:', error);
    res.status(500).json({ error: 'Failed to download thumbnail', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
