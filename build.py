"""네온 코어 디펜스: 오버로드 빌드

src/ 의 조각들을 하나의 HTML 파일(dist/index.html)로 합친다.
웹(GitHub Pages) · Artifact · 안드로이드 앱 모두 이 파일 하나를 쓴다.

  python build.py          일반 빌드
  python build.py --check  빌드 후 node 로 문법 검사
"""
import io, os, glob, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')


def read(p):
    return io.open(p, encoding='utf-8').read()


def build():
    tpl = read(os.path.join(SRC, 'template.html'))
    css = read(os.path.join(SRC, 'style.css'))
    font = read(os.path.join(SRC, 'font.b64')).strip()
    music = read(os.path.join(SRC, 'music.b64')).strip()
    parts = sorted(glob.glob(os.path.join(SRC, '[0-9][0-9]-*.js')))
    js = '\n'.join('/* ── ' + os.path.basename(p) + ' ── */\n' + read(p) for p in parts)
    js = js.replace('/*MUSIC*/', music)
    out = tpl.replace('/*FONT*/', font).replace('/*STYLE*/', css).replace('/*SCRIPT*/', js)
    os.makedirs(DIST, exist_ok=True)
    path = os.path.join(DIST, 'index.html')
    io.open(path, 'w', encoding='utf-8', newline='\n').write(out)
    # 배포용: 저장소 맨 위 index.html (GitHub Pages · 안드로이드 앱이 이 파일을 쓴다)
    io.open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)
    return path, js


if __name__ == '__main__':
    path, js = build()
    print('built', path, round(os.path.getsize(path) / 1024), 'KB')
    if '--check' in sys.argv:
        tmp = os.path.join(DIST, '_check.js')
        io.open(tmp, 'w', encoding='utf-8').write(js)
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        os.remove(tmp)
        if r.returncode:
            print(r.stderr)
            sys.exit(1)
        print('syntax ok')
