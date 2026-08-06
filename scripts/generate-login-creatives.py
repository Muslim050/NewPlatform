#!/usr/bin/env python3
"""Generate the lightweight demo spots used by the login-page television."""

import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "creatives"
WIDTH, HEIGHT, FPS, SECONDS = 960, 540, 24, 4
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def rounded_label(draw, xy, text, fill, text_fill, size=24):
    x, y = xy
    typeface = font(size, True)
    box = draw.textbbox((0, 0), text, font=typeface)
    width = box[2] - box[0] + 38
    draw.rounded_rectangle((x, y, x + width, y + 48), radius=24, fill=fill)
    draw.text((x + 19, y + 10), text, font=typeface, fill=text_fill)


def reach(draw, progress):
    draw.rectangle((0, 0, WIDTH, HEIGHT), fill="#050505")
    pulse = 1 + 0.08 * math.sin(progress * math.tau)
    cx = int(770 + math.sin(progress * math.tau) * 42)
    cy = int(105 + math.cos(progress * math.tau) * 28)
    radius = int(190 * pulse)
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill="#ffd106")
    draw.ellipse((-150, 370, 430, 950), fill="#151515")
    draw.text((58, 50), "SETANTA SPORTS / PLATFORM", font=font(25, True), fill="#ffd106")
    draw.text((58, 165), "РЕКЛАМА,", font=font(82, True), fill="white")
    draw.text((58, 252), "КОТОРУЮ", font=font(82, True), fill="white")
    draw.text((58, 345), "ВИДЯТ ВМЕСТЕ", font=font(64, True), fill="#ffd106")


def channels(draw, progress):
    draw.rectangle((0, 0, WIDTH, HEIGHT), fill="#ffd106")
    offset = int(progress * 170)
    for index in range(-2, 9):
        x = index * 150 + offset
        draw.line((x, -40, x - 320, 580), fill="#e8bd00", width=42)
    draw.text((58, 52), "SETANTA SPORTS PLATFORM", font=font(25, True), fill="#17161c")
    draw.text((58, 142), "ВСЕ КАНАЛЫ", font=font(82, True), fill="#17161c")
    draw.text((58, 230), "ВАШЕЙ РЕКЛАМЫ", font=font(65, True), fill="#17161c")
    labels = ["CTV", "ТВ", "WEB", "MOBILE"]
    x = 58
    for label in labels:
        rounded_label(draw, (x, 360), label, "#17161c", "#ffffff", 22)
        x += 142 if label != "MOBILE" else 0


def results(draw, progress):
    draw.rectangle((0, 0, WIDTH, HEIGHT), fill="#17161c")
    for index in range(9):
        x = 55 + index * 110
        base = 468
        height = int((70 + index * 28) * min(1, progress * 2.1))
        color = "#ffd106" if index > 5 else "#3a3a3a"
        draw.rounded_rectangle((x, base - height, x + 64, base), radius=18, fill=color)
    draw.rectangle((0, 0, WIDTH, 305), fill="#17161c")
    draw.text((58, 50), "SETANTA SPORTS · РЕЗУЛЬТАТЫ В РЕАЛЬНОМ ВРЕМЕНИ", font=font(22, True), fill="#ffd106")
    draw.text((58, 128), "61 МЛН", font=font(112, True), fill="white")
    draw.text((60, 244), "ПОКАЗОВ ЗА МЕСЯЦ", font=font(31, True), fill="#ffd106")


def make_video(filename, renderer):
    target = OUTPUT / filename
    command = [
        "ffmpeg", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pixel_format", "rgb24",
        "-video_size", f"{WIDTH}x{HEIGHT}", "-framerate", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "23",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(target),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    for frame_index in range(FPS * SECONDS):
        progress = frame_index / (FPS * SECONDS - 1)
        frame = Image.new("RGB", (WIDTH, HEIGHT))
        renderer(ImageDraw.Draw(frame), progress)
        process.stdin.write(frame.tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"ffmpeg failed while generating {target}")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    make_video("setanta-reach.mp4", reach)
    make_video("setanta-channels.mp4", channels)
    make_video("setanta-results.mp4", results)


if __name__ == "__main__":
    main()
