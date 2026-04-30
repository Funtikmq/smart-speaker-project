import subprocess
import queue
import threading
import os
import logging

from .audio_config import PLAYER_QUEUE_SIZE, PLAYBACK_DEVICE, SAMPLE_RATE

logger = logging.getLogger(__name__)


class AudioPlayer:

    def __init__(self, sample_rate=SAMPLE_RATE, device=PLAYBACK_DEVICE, max_queue_size=PLAYER_QUEUE_SIZE):
        self.sample_rate = sample_rate
        self.device = device
        self.process = None
        self.file_process = None
        self.running = False
        self.thread = None
        self.queue = queue.Queue(maxsize=max_queue_size)

    # ─── Stream PCM ───────────────────────────────────────────────────────────

    def _ensure_stream_process(self):
        if self.process:
            return
        self.process = subprocess.Popen(
            [
                "aplay",
                f"-D{self.device}",
                "-f", "S16_LE",
                "-r", str(self.sample_rate),
                "-c", "2",
                "-t", "raw",
            ],
            stdin=subprocess.PIPE,
        )

    def _loop(self):
        while self.running:
            try:
                chunk = self.queue.get(timeout=0.2)
            except queue.Empty:
                continue

            if not chunk:
                continue

            self._ensure_stream_process()

            try:
                self.process.stdin.write(chunk)
                self.process.stdin.flush()
            except (BrokenPipeError, OSError):
                self._close_stream_process()

    def _close_stream_process(self):
        if not self.process:
            return
        try:
            if self.process.stdin:
                self.process.stdin.close()
        except OSError:
            pass
        try:
            self.process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            self.process.kill()
        self.process = None

    # ─── Public API ───────────────────────────────────────────────────────────

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
            self.thread = None
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except queue.Empty:
                break
        self._close_stream_process()
        self.stop_file()

    def enqueue(self, chunk):
        """Adaugă un chunk PCM în coada de redare stream."""
        if not chunk:
            return
        if self.queue.full():
            try:
                self.queue.get_nowait()
            except queue.Empty:
                pass
        self.queue.put_nowait(chunk)

    def play(self, filename):
        """Redă un fișier audio — WAV cu aplay (cu parametrii corecți), MP3 cu mpg123."""
        if not os.path.exists(filename):
            logger.error(f"Fișierul nu există: {filename}")
            return

        if self.file_process:
            logger.warning(f"Redare în curs, sar peste {filename}")
            return

        def run():
            if filename.endswith(".mp3"):
                cmd = ["mpg123", filename]
            else:
                # WAV: forțează parametrii corecți pentru a evita erori ALSA
                # -t wav = format tip WAV
                # -f S16_LE = 16-bit signed PCM, little-endian  
                # -c 1 = mono
                # -r 16000 = 16kHz sample rate
                cmd = ["aplay", "-t", "wav", "-f", "S16_LE", "-c", "1", "-r", "16000", filename]

            logger.info(f"Lansez comanda redare: {' '.join(cmd)}")
            try:
                self.file_process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                logger.info(f"Proces redare lansat (PID={self.file_process.pid})")
                
                # Așteptăm finalul procesului
                returncode = self.file_process.wait()
                logger.info(f"Proces redare terminat cu cod {returncode}")
                
                if returncode != 0:
                    # Citim stderr pentru mesajul de eroare
                    _, stderr = self.file_process.communicate()
                    error_msg = stderr.decode('utf-8', errors='ignore') if stderr else ""
                    logger.error(f"aplay a eșuat: {error_msg}")
            except Exception as e:
                logger.error(f"Eroare la redare {filename}: {e}", exc_info=True)
            finally:
                self.file_process = None

        threading.Thread(target=run, daemon=True).start()

    def set_volume(self, value: int):
        """Setează volumul sistemului (0-100)."""
        value = max(0, min(100, value))
        os.system(f"amixer set Master {value}%")

    def stop_playback(self):
        """Oprește stream-ul PCM."""
        self._close_stream_process()

    def stop_file(self):
        """Oprește redarea fișierului curent."""
        if self.file_process:
            self.file_process.terminate()
            try:
                self.file_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.file_process.kill()
            self.file_process = None