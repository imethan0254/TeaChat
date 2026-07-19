"""AtmoSound — 程式合成無縫循環環境音素材(CC0,自產零授權)"""
import numpy as np
from scipy import signal
import wave, os, subprocess

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(42)

def white(n): return rng.standard_normal(n)

def pink(n):
    x = white(n + SR)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    f[0] = 1
    X = X / np.sqrt(f)
    y = np.fft.irfft(X)[SR // 2 : SR // 2 + n]
    return y / (np.abs(y).max() + 1e-9)

def brown(n):
    x = np.cumsum(white(n))
    x -= np.linspace(x[0], x[-1], n)  # detrend so loop ends near start
    return x / (np.abs(x).max() + 1e-9)

def bp(x, lo, hi, order=4):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)

def lp(x, fc, order=4):
    sos = signal.butter(order, fc, btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x)

def hp(x, fc, order=4):
    sos = signal.butter(order, fc, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x)

def slow_lfo(n, hz, depth=1.0, base=1.0):
    """smoothed random LFO in [base-depth/2, base+depth/2]"""
    k = max(int(SR / max(hz, 0.01) / 8), 1)
    seed = rng.standard_normal(n // k + 4)
    l = np.interp(np.arange(n), np.arange(len(seed)) * k, seed)
    l = lp(l, hz * 2, 2)
    l = l / (np.abs(l).max() + 1e-9)
    return base + l * depth / 2

def loopify(x, xfade_s=2.0):
    """crossfade tail into head -> seamless loop"""
    L = int(xfade_s * SR)
    n = len(x) - L
    y = x[:n].copy()
    r = np.linspace(0, 1, L)
    y[:L] = y[:L] * r + x[n:] * (1 - r)
    return y

def norm(x, peak=0.85):
    return x / (np.abs(x).max() + 1e-9) * peak

def save(name, x, sr=SR):
    x16 = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    p = f"{OUT}/{name}.wav"
    with wave.open(p, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(x16.tobytes())
    m4a = f"{OUT}/{name}.m4a"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", p,
                    "-c:a", "aac", "-b:a", "96k", m4a], check=True)
    os.remove(p)
    print(name, f"{os.path.getsize(m4a)//1024}KB")

def droplets(n, rate_hz, f_lo, f_hi, dur_s=0.012):
    """random short filtered ticks (rain droplets / crackle base)"""
    out = np.zeros(n)
    count = int(rate_hz * n / SR)
    d = int(dur_s * SR)
    env = np.exp(-np.linspace(0, 6, d))
    for _ in range(count):
        i = rng.integers(0, n - d)
        fc = rng.uniform(f_lo, f_hi)
        bw = fc * 0.6
        tick = bp(white(d) * env, max(fc - bw, 80), min(fc + bw, SR // 2 - 100), 2)
        out[i:i + d] += tick * rng.uniform(0.3, 1.0)
    return out

DUR = 28  # seconds per loop (+2s xfade)
N = (DUR + 2) * SR

# ── 小雨 rain-light ───────────────────────────────
hiss = bp(white(N), 800, 9000) * 0.16
hiss *= slow_lfo(N, 0.15, 0.25, 1.0)
drops = droplets(N, 22, 1500, 6500) * 0.5
save("rain-light", norm(loopify(lp(hiss + drops, 11000))))

# ── 大雨 rain-heavy ───────────────────────────────
wash = bp(white(N), 200, 10000) * 0.5
rumble = lp(brown(N), 220) * 0.55
drops = droplets(N, 90, 900, 7000) * 0.4
heavy = wash * slow_lfo(N, 0.12, 0.2, 1.0) + rumble + drops
save("rain-heavy", norm(loopify(heavy)))

# ── 風 wind ───────────────────────────────────────
base = lp(pink(N), 500) * slow_lfo(N, 0.1, 1.1, 0.9)
whistle = bp(pink(N), 600, 1100, 2) * slow_lfo(N, 0.07, 0.9, 0.5) * 0.25
save("wind", norm(loopify(base + whistle)))

# ── 雷 thunder(one-shot,非循環)──────────────────
tn = int(9 * SR)
crack = hp(white(int(0.25 * SR)), 700) * np.exp(-np.linspace(0, 9, int(0.25 * SR)))
roll = lp(brown(tn), 110) * np.exp(-np.linspace(0, 3.4, tn))
roll *= slow_lfo(tn, 0.8, 0.9, 0.75)  # rolling rumble
th = roll
th[:len(crack)] += crack * 0.5
fade = np.ones(tn); fs_ = int(1.5 * SR); fade[-fs_:] = np.linspace(1, 0, fs_)
save("thunder", norm(th * fade, 0.9))

# ── 柴火 fire ─────────────────────────────────────
crackle = droplets(N, 14, 2500, 9000, 0.006) * 0.9
pops = droplets(N, 3, 300, 1200, 0.02) * 0.9
emberhum = lp(brown(N), 350) * 0.35 * slow_lfo(N, 0.2, 0.5, 0.8)
save("fire", norm(loopify(crackle + pops + emberhum)))

# ── 海浪 waves ────────────────────────────────────
t = np.arange(N) / SR
swell = np.zeros(N)
period = 9.0
for k in range(int((DUR + 2) / period) + 2):
    c = k * period + rng.uniform(-1, 1)
    rise, fall = 3.2, 4.5
    e = np.where(t < c, np.exp(-((t - c) / rise) ** 2), np.exp(-((t - c) / fall) ** 2))
    swell += e
swell = lp(swell, 1.0, 2); swell = swell / (swell.max() + 1e-9)
body = bp(white(N), 120, 1800) * (0.15 + 0.85 * swell)
foam = bp(white(N), 2000, 8000) * (0.05 + 0.5 * swell ** 2)
save("waves", norm(loopify(body + foam * 0.5)))

# ── 溪流 stream ───────────────────────────────────
sh = bp(white(N), 600, 3200) * slow_lfo(N, 6, 0.5, 0.8)
gl = bp(white(N), 3000, 8000) * slow_lfo(N, 9, 0.6, 0.5) * 0.4
lowg = lp(brown(N), 300) * 0.25
save("stream", norm(loopify(sh + gl + lowg)))

# ── 鳥鳴 birds ────────────────────────────────────
amb = lp(pink(N), 400) * 0.06
chirps = np.zeros(N)
def chirp(f0, f1, d, vib=0):
    n_ = int(d * SR); tt = np.arange(n_) / SR
    f = np.linspace(f0, f1, n_) + vib * np.sin(2 * np.pi * 40 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    e = np.sin(np.pi * np.linspace(0, 1, n_)) ** 1.5
    return np.sin(ph) * e
pos = 1.0
while pos < DUR + 1:
    nnotes = rng.integers(2, 6)
    base_f = rng.uniform(2200, 4200)
    for j in range(nnotes):
        d = rng.uniform(0.06, 0.16)
        c = chirp(base_f * rng.uniform(0.9, 1.3), base_f * rng.uniform(0.8, 1.2), d, vib=rng.uniform(0, 120))
        i = int(pos * SR)
        if i + len(c) < N: chirps[i:i + len(c)] += c * rng.uniform(0.2, 0.5)
        pos += d + rng.uniform(0.05, 0.25)
    pos += rng.uniform(1.2, 3.5)
save("birds", norm(loopify(amb + chirps)))

# ── 蟲鳴 crickets ─────────────────────────────────
amb = lp(pink(N), 300) * 0.05
cr = np.zeros(N)
for f0, pulse_hz, group_s, gap_lo, gap_hi, amp in [(4300, 27, 0.55, 0.4, 1.0, 0.35), (3600, 18, 0.8, 1.0, 2.4, 0.22)]:
    pos = rng.uniform(0, 1)
    while pos < DUR + 1.5:
        n_ = int(group_s * SR); tt = np.arange(n_) / SR
        pulse = (np.sin(2 * np.pi * pulse_hz * tt) > 0.2).astype(float)
        pulse = lp(pulse, 200, 2)
        tone = np.sin(2 * np.pi * f0 * tt + 3 * np.sin(2 * np.pi * 7 * tt))
        e = np.sin(np.pi * np.linspace(0, 1, n_)) ** 0.5
        i = int(pos * SR)
        if i + n_ < N: cr[i:i + n_] += tone * pulse * e * amp
        pos += group_s + rng.uniform(gap_lo, gap_hi)
save("crickets", norm(loopify(amb + cr)))

# ── 鍵盤 keyboard ─────────────────────────────────
kb = np.zeros(N)
pos = 0.5
while pos < DUR + 1.5:
    burst = rng.integers(4, 14)          # 一段打字
    for _ in range(burst):
        d = int(0.011 * SR)
        click = hp(white(d), 1800) * np.exp(-np.linspace(0, 7, d))
        thock = lp(white(int(0.02 * SR)), 900) * np.exp(-np.linspace(0, 8, int(0.02 * SR)))
        i = int(pos * SR)
        if i + len(thock) < N:
            kb[i:i + d] += click * rng.uniform(0.4, 1.0)
            kb[i:i + len(thock)] += thock * rng.uniform(0.25, 0.6)
        pos += rng.uniform(0.09, 0.2)
    if rng.random() < 0.25: pos += rng.uniform(0.3, 0.8)  # spacebar pause
    pos += rng.uniform(0.6, 2.2)
save("keyboard", norm(loopify(kb), 0.7))


# ═══ Rainland 7 級雨勢新增音軌(mist/drips/medium/downpour/storm-wind)═══

N = (DUR + 2) * SR

# ── L1 絲絲細雨 rain-mist:極輕的高頻霧狀 hiss,幾乎無滴答 ──
mist = hp(white(N), 3000) * 0.10
mist *= slow_lfo(N, 0.08, 0.35, 1.0)
veil = bp(white(N), 1200, 4000) * 0.05 * slow_lfo(N, 0.15, 0.4, 0.9)
save("rain-mist", norm(loopify(mist + veil), 0.55))

# ── L2 淅瀝小雨 rain-drips:錯落滴答為主,底噪極薄 ──
drips = droplets(N, 9, 1200, 6000, 0.016) * 0.9
base = bp(white(N), 900, 7000) * 0.05 * slow_lfo(N, 0.12, 0.3, 1.0)
save("rain-drips", norm(loopify(drips + base), 0.7))

# ── L4 滂沱中雨 rain-medium:飽滿啪嗒 + 中等 wash ──
wash = bp(white(N), 300, 9500) * 0.32 * slow_lfo(N, 0.12, 0.25, 1.0)
patter = droplets(N, 50, 700, 6500, 0.014) * 0.5
lowbody = lp(brown(N), 260) * 0.3
save("rain-medium", norm(loopify(wash + patter + lowbody)))

# ── L6-7 傾盆/豪雨 rain-downpour:密不透風的 roar + 重低頻 ──
roar = bp(white(N), 150, 11000) * 0.6 * slow_lfo(N, 0.1, 0.18, 1.0)
rumble = lp(brown(N), 200) * 0.7
splat = droplets(N, 160, 500, 7000, 0.012) * 0.35
save("rain-downpour", norm(loopify(roar + rumble + splat)))

# ── 狂風 storm-wind:深沉陣風 + 呼嘯,給 L6-7 ──
gust = lp(pink(N), 420) * slow_lfo(N, 0.16, 1.4, 0.85)
howl = bp(pink(N), 700, 1400, 2) * slow_lfo(N, 0.11, 1.1, 0.55) * 0.4
deep = lp(brown(N), 120) * 0.4 * slow_lfo(N, 0.09, 0.8, 0.8)
save("storm-wind", norm(loopify(gust + howl + deep)))


print("DONE")
