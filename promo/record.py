"""광고 영상 녹화: 헤드리스 크롬으로 promo/ad.html 을 열어 화면+소리를 녹화한다.

  python promo/record.py            # 녹화해서 promo/out/ 에 저장
  python promo/record.py --serve    # 서버만 켠다 (브라우저로 미리보기: http://localhost:8991/ad.html?live)
"""
import http.server, os, subprocess, sys, tempfile, threading, time, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
PORT = 8991
CHROME = next((p for p in [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
] if os.path.exists(p)), None)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=HERE, **k)
    def do_POST(self):
        name = os.path.basename(self.path.split('name=')[-1])
        n = int(self.headers.get('Content-Length', 0))
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, name), 'wb') as f:
            left = n
            while left > 0:
                b = self.rfile.read(min(65536, left))
                if not b: break
                f.write(b); left -= len(b)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
        print('saved', name, n)
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
if '--serve' in sys.argv:
    print('serving http://localhost:%d/ad.html' % PORT)
    while True: time.sleep(60)

prof = tempfile.mkdtemp()
before = set(os.listdir(OUT)) if os.path.isdir(OUT) else set()
p = subprocess.Popen([CHROME, '--headless=new', '--user-data-dir=' + prof, '--window-size=1280,720',
                      '--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync', '--no-first-run',
                      '--hide-scrollbars', '--mute-audio=false', 'http://localhost:%d/ad.html?record' % PORT])
t0 = time.time()
while time.time() - t0 < 120:
    now = set(os.listdir(OUT)) if os.path.isdir(OUT) else set()
    if now - before: break
    time.sleep(1)
time.sleep(1)
p.terminate()
try: p.wait(10)
except Exception: p.kill()
shutil.rmtree(prof, ignore_errors=True)
print('done', sorted(set(os.listdir(OUT)) - before) if os.path.isdir(OUT) else 'nothing')
