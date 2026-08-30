import cv2
import numpy as np
import os

src_path = 'assets/orca-logo.png'
img = cv2.imread(src_path, cv2.IMREAD_GRAYSCALE)

# Threshold to binary (black artwork is 255 in inverted mask)
_, thresh = cv2.threshold(img, 150, 255, cv2.THRESH_BINARY_INV)

# Find all contours with hierarchy (holes)
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
print(f'Found {len(contours)} contours')

# Filter out tiny noise if any
filtered = []
for cnt in contours:
    if cv2.contourArea(cnt) > 20:
        filtered.append(cnt)

print(f'Retained {len(filtered)} meaningful contours')

# Convert contours to smooth SVG path string
# Using approxPolyDP with small epsilon for high fidelity
paths = []
for cnt in filtered:
    approx = cv2.approxPolyDP(cnt, 0.7, True)
    if len(approx) < 3:
        continue
    pts = approx.reshape(-1, 2)
    p_str = f"M {pts[0][0]} {pts[0][1]} "
    for pt in pts[1:]:
        p_str += f"L {pt[0]} {pt[1]} "
    p_str += "Z"
    paths.append(p_str)

full_d = " ".join(paths)

# Light SVG (black / currentColor)
light_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor">
  <path fill-rule="evenodd" clip-rule="evenodd" d="{full_d}" />
</svg>'''

# Dark SVG (white / #FFFFFF)
dark_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="#FFFFFF">
  <path fill-rule="evenodd" clip-rule="evenodd" d="{full_d}" />
</svg>'''

os.makedirs('assets', exist_ok=True)
os.makedirs('src/renderer/src/assets', exist_ok=True)

with open('assets/orca-logo-light.svg', 'w') as f:
    f.write(light_svg)

with open('assets/orca-logo-dark.svg', 'w') as f:
    f.write(dark_svg)

with open('src/renderer/src/assets/orca-logo-light.svg', 'w') as f:
    f.write(light_svg)

with open('src/renderer/src/assets/orca-logo-dark.svg', 'w') as f:
    f.write(dark_svg)

# Also create a typescript file or export the path directly
with open('src/renderer/src/components/Icons/OrcaLogoPath.ts', 'w') as f:
    f.write(f'''// Official ORCA Emblem Vector Path
export const ORCA_LOGO_PATH = "{full_d}";
''')

print(f"Generated SVGs and OrcaLogoPath.ts successfully! Path length: {len(full_d)} chars")
