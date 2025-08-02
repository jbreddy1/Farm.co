const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const { execFile } = require('child_process');
const router = express.Router();

// Use the full google-cloud.json file as keyFilename
const speechClient = new SpeechClient({
  keyFilename: path.join(__dirname, '../google-cloud.json')
});

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No audio file uploaded');
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    // Check for empty or very small files
    const stats = fs.statSync(req.file.path);
    if (stats.size < 1024) { // less than 1KB
      fs.unlinkSync(req.file.path);
      console.error('Uploaded audio file is empty or too small');
      return res.status(400).json({ error: 'Uploaded audio file is empty or too short. Please record a longer message.' });
    }
    if (!req.file.mimetype.startsWith('audio/webm')) {
      fs.unlinkSync(req.file.path);
      console.error('Unsupported audio format:', req.file.mimetype);
      return res.status(400).json({ error: 'Only audio/webm format is supported for speech-to-text.' });
    }
    const filePath = req.file.path;
    const wavPath = filePath + '.wav';
    const language = req.body.language || 'en';
    let languageCode = 'en-IN';
    if (language === 'hi') languageCode = 'hi-IN';
    if (language === 'te') languageCode = 'te-IN';
    // Convert webm to wav (LINEAR16) using ffmpeg
    execFile('ffmpeg', ['-y', '-i', filePath, '-ar', '16000', '-ac', '1', '-f', 'wav', wavPath], async (err) => {
      if (err) {
        fs.unlinkSync(filePath);
        console.error('ffmpeg conversion error:', err);
        return res.status(500).json({ error: 'Failed to convert audio to wav/LINEAR16', details: err.message });
      }
      try {
        const file = fs.readFileSync(wavPath);
        const audioBytes = file.toString('base64');
        const audio = { content: audioBytes };
        const config = {
          encoding: 'LINEAR16',
          languageCode,
          sampleRateHertz: 16000,
        };
        const request = { audio, config };
        const [response] = await speechClient.recognize(request);
        const transcription = response.results.map(r => r.alternatives[0].transcript).join(' ');
        fs.unlinkSync(filePath);
        fs.unlinkSync(wavPath);
        console.log('Transcription result:', transcription);
        if (!transcription) {
          return res.status(400).json({ error: 'No transcription result from Google STT.' });
        }
        res.json({ transcript: transcription });
      } catch (err) {
        fs.unlinkSync(filePath);
        if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
        console.error('Speech recognition failed:', err.message, err);
        res.status(500).json({ error: 'Speech recognition failed', details: err.message });
      }
    });
  } catch (err) {
    console.error('Speech-to-text error:', err.message, err);
    res.status(500).json({ error: 'Speech-to-text error', details: err.message });
  }
});

module.exports = router; 