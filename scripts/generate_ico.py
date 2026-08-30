import struct
import io
import os
from PIL import Image, ImageDraw, ImageFilter

# 1. Source image
src_path = 'assets/orca-logo.png'
src_img = Image.open(src_path).convert('RGBA')

# Extract alpha cleanly from original black & white artwork
gray = src_img.convert('L')
import numpy as np
gray_arr = np.array(gray, dtype=np.float32)

# Invert so black artwork (0) -> alpha (255)
alpha = (255.0 - gray_arr)
alpha = np.clip((alpha / 255.0) * 255.0 * 1.05, 0, 255).astype(np.uint8)

# Create high-res transparent master (white emblem for dark backgrounds & contrast)
white_emblem = Image.merge('RGBA', (
    Image.new('L', src_img.size, 255),
    Image.new('L', src_img.size, 255),
    Image.new('L', src_img.size, 255),
    Image.fromarray(alpha)
))

# Create high-res transparent master (black emblem)
black_emblem = Image.merge('RGBA', (
    Image.new('L', src_img.size, 0),
    Image.new('L', src_img.size, 0),
    Image.new('L', src_img.size, 0),
    Image.fromarray(alpha)
))

# Target Windows icon resolutions
sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256]

def make_windows_icon_frame(size):
    # To be visible on BOTH dark taskbars and light desktops in Windows:
    # A sleek deep-ocean circular disc badge (#0B1220 with subtle #38BDF8 accent border)
    # with the white ORCA emblem centered inside.
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    
    pad = max(1, int(size * 0.04))
    # Outer circle disc
    draw.ellipse([pad, pad, size - pad, size - pad], fill=(11, 18, 32, 255), outline=(56, 189, 248, 200), width=max(1, int(size * 0.03)))
    
    # Inner emblem
    inner_dim = int(size * 0.76)
    offset = (size - inner_dim) // 2
    resized_emblem = white_emblem.resize((inner_dim, inner_dim), Image.Resampling.LANCZOS)
    canvas.paste(resized_emblem, (offset, offset), resized_emblem)
    return canvas

def make_transparent_icon_frame(size):
    # Pure transparent emblem with high fidelity
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # Add subtle backing so black/white parts are both visible
    resized_white = white_emblem.resize((size, size), Image.Resampling.LANCZOS)
    resized_black = black_emblem.resize((size, size), Image.Resampling.LANCZOS)
    return resized_white

def pack_ico(frames, sizes, output_path):
    header = struct.pack('<HHH', 0, 1, len(frames))
    png_buffers = []
    for frame in frames:
        buf = io.BytesIO()
        frame.save(buf, format='PNG')
        png_buffers.append(buf.getvalue())
    
    offset = 6 + len(frames) * 16
    entries = []
    for i, s in enumerate(sizes):
        w = s if s < 256 else 0
        h = s if s < 256 else 0
        png_len = len(png_buffers[i])
        entry = struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, png_len, offset)
        entries.append(entry)
        offset += png_len
    
    with open(output_path, 'wb') as f:
        f.write(header)
        for entry in entries:
            f.write(entry)
        for buf in png_buffers:
            f.write(buf)
    print(f"Packed {output_path} ({len(sizes)} resolutions, {offset} bytes)")

# Generate frames for the 9 specified sizes
badge_frames = [make_windows_icon_frame(s) for s in sizes]
os.makedirs('assets', exist_ok=True)
os.makedirs('src/renderer/src/assets', exist_ok=True)
os.makedirs('public', exist_ok=True)

pack_ico(badge_frames, sizes, 'assets/orca.ico')
pack_ico(badge_frames, sizes, 'src/renderer/src/assets/orca.ico')
pack_ico(badge_frames, sizes, 'public/favicon.ico')

# Also save high-res 256 and 512 pngs for Electron window icon
badge_frames[-1].save('assets/orca-icon-256.png')
badge_frames[-1].save('src/renderer/src/assets/orca-icon-256.png')
badge_frames[-1].save('public/orca-icon-256.png')
