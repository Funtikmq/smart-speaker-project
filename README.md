# Smart Speaker Project

Voice assistant system built on Raspberry Pi Zero W with an Android mobile app.
The mobile app handles voice processing, offloading computation from the resource-limited Pi.

## Hardware

| Component | Model |
|-----------|-------|
| Microcontroller | Raspberry Pi Zero W |
| Microphone | INMP441 (I2S) |
| Speaker | Visaton K50 |
| Amplifier | MAX98357A (I2S) |

## Repository Structure
smart-speaker-project/
├── mobile-app/Assistant/   # React Native CLI Android app
├── cloud/                  # Whisper STT WebSocket server
└── smart-speaker/          # Raspberry Pi scripts

### Raspberry Pi
```bash
# Quick start
python3 -m venv venv --system-site-packages
source venv/bin/activate
pip install websockets pvporcupine opuslib sounddevice
```

### Cloud Server
```bash
pip install websockets openai-whisper numpy scipy gTTS
sudo apt install ffmpeg
```

### Mobile App
```bash
cd mobile-app/Assistant
npm install
npx react-native run-android
```

Set Pi MAC address in `src/screens/AgentScreen.tsx`:
```typescript
const PI_MAC_ADDRESS = 'B8:27:EB:11:18:DC';
```

Monitor logs:
```bash
adb logcat *:S ReactNativeJS:V
```

## Features (Offline)
- Current time, date, weekday
- Alarm setting with multi-turn dialogue
- Bluetooth A2DP audio playback through Pi speaker

## Known Limitations
- Online mode (cloud) does not include LLM integration yet
- English only (`en-US`)
- Pi MAC address is hardcoded in the app

## Authors
| Name | Role |
|------|------|
| Bobeica Veaceslav | Embedded System, Mobile Application Business Logic, Cloud |
| Uglea Nicolae | Mobile Application UI/UX |
