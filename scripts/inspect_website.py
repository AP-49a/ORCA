import os
import re

for root, dirs, files in os.walk('website'):
    for f in files:
        if f.endswith('.html'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fl:
                content = fl.read()
                imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)
                bg_imgs = re.findall(r'url\(["\']?([^"\')]+)["\']?\)', content)
                print(f"=== File: {p} ===")
                print("  Images:")
                for img in imgs:
                    print("   -", img)
                print("  Background Images:")
                for bg in bg_imgs:
                    print("   -", bg)
