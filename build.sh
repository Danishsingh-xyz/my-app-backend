#!/bin/bash
# Install yt-dlp
pip3 install yt-dlp

# Download and install ffmpeg
wget https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz
tar -xf ffmpeg-master-latest-linux64-gpl.tar.xz
mv ffmpeg-master-latest-linux64-gpl/bin/ffmpeg /usr/local/bin/
mv ffmpeg-master-latest-linux64-gpl/bin/ffprobe /usr/local/bin/
rm -rf ffmpeg-master-latest-linux64-gpl ffmpeg-master-latest-linux64-gpl.tar.xz

# Install Node.js dependencies
npm install
