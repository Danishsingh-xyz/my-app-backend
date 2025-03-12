#!/bin/bash
# Install yt-dlp
apt-get update
apt-get install -y python3-pip
pip3 install yt-dlp

# Install ffmpeg
apt-get install -y ffmpeg

# Install Node.js dependencies
npm install
