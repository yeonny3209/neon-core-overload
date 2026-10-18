"""광고 영상용 페이지를 만든다 (promo/ad.html).

게임 본편 코드(메인 루프 제외) + promo/trailer.js 를 한 파일로 합친다.
  python promo/build_ad.py
  python promo/record.py     # 헤드리스 크롬으로 녹화 → promo/out/ 에 저장
"""
import io, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'src')

def read(p):
    return io.open(p, encoding='utf-8').read()

tpl = read(os.path.join(SRC, 'template.html'))
css = read(os.path.join(SRC, 'style.css')) + """
#app{display:none!important}
html,body{background:#000}
#ad{position:fixed;left:0;top:0;width:100vw;height:100vh;object-fit:contain;background:#000}
"""
font = read(os.path.join(SRC, 'font.b64')).strip()
music = read(os.path.join(SRC, 'music.b64')).strip()
parts = [p for p in sorted(glob.glob(os.path.join(SRC, '[0-9][0-9]-*.js'))) if '40-main' not in p]
js = '\n'.join(read(p) for p in parts).replace('/*MUSIC*/', music) + '\n' + read(os.path.join(HERE, 'trailer.js'))
out = tpl.replace('/*FONT*/', font).replace('/*STYLE*/', css).replace('/*SCRIPT*/', js)
out = out.replace('<div id="app">', '<canvas id="ad" width="1280" height="720"></canvas>\n<div id="app">', 1)
io.open(os.path.join(HERE, 'ad.html'), 'w', encoding='utf-8', newline='\n').write(out)
print('ok', round(len(out) / 1024), 'KB')
