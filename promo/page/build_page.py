"""홍보 페이지 만들기 → 영상과 그림을 모두 파일 안에 넣은 HTML 한 개.

  python promo/page/build_page.py
결과: 저장소 맨 위 promo.html (GitHub Pages 주소: .../neon-core-overload/promo.html)
"""
import base64, io, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))


def b64(path):
    return base64.b64encode(open(path, 'rb').read()).decode()


t = io.open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
rep = {
    '{{FONT}}': io.open(os.path.join(ROOT, 'src', 'font.b64')).read().strip(),
    '{{VIDEO}}': b64(os.path.join(HERE, 'ad-web.mp4')),
    '{{POSTER}}': b64(os.path.join(HERE, 'poster.jpg')),
    '{{S1}}': b64(os.path.join(HERE, 's_1.9.jpg')),
    '{{S2}}': b64(os.path.join(HERE, 's_6.5.jpg')),
    '{{S3}}': b64(os.path.join(HERE, 's_8.4.jpg')),
    '{{S4}}': b64(os.path.join(HERE, 's_9.9.jpg')),
    '{{S5}}': b64(os.path.join(HERE, 's_12.6.jpg')),
    '{{S6}}': b64(os.path.join(HERE, 's_14.0.jpg')),
    '{{WEB}}': 'https://yeonny3209.github.io/neon-core-overload/',
    '{{APK}}': 'https://github.com/yeonny3209/neon-core-overload/releases/download/android-latest/neon-core-overload.apk',
    '{{OLD}}': 'https://yeonny3209.github.io/neon-core-defense/',
    '{{REPO}}': 'https://github.com/yeonny3209/neon-core-overload',
}
for k, v in rep.items():
    t = t.replace(k, v)
assert '{{' not in t
out = os.path.join(ROOT, 'promo.html')
io.open(out, 'w', encoding='utf-8', newline='\n').write(t)
print('built', out, round(os.path.getsize(out) / 1024 / 1024, 1), 'MB')
