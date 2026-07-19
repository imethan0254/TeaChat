"""Rainland — 乾淨版音源重製(需求 6)
- pink noise 基底 + 全體 lowpass:去除白噪的高頻嘶聲刺耳感
- droplet 較少、較軟(低頻帶、緩衰減),不再劈啪吵雜
- WAV 22050Hz 直存:AAC 有 encoder priming gap,loop 接縫會「斷一下」;WAV 無縫
- 循環 32 秒 + 3 秒 crossfade,聽感連續不間斷
- 新增 drop.wav:點擊畫面的水滴 plip 互動音
"""
import numpy as np
from scipy import signal
import wave, os

SR = 22050
NYQ = SR / 2
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(11)

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
    x -= np.linspace(x[0], x[-1], n)
    return x / (np.abs(x).max() + 1e-9)

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, NYQ - 100)], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)

def lp(x, fc, order=4):
    sos = signal.butter(order, min(fc, NYQ - 100), btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x)

def hp(x, fc, order=2):
    sos = signal.butter(order, fc, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x)

def slow_lfo(n, hz, depth=1.0, base=1.0):
    k = max(int(SR / max(hz, 0.01) / 8), 1)
    seed = rng.standard_normal(n // k + 4)
    l = np.interp(np.arange(n), np.arange(len(seed)) * k, seed)
    l = lp(l, hz * 2, 2)
    l = l / (np.abs(l).max() + 1e-9)
    return np.clip(base + l * depth / 2, 0.05, None)

def loopify(x, xfade_s=3.0):
    L = int(xfade_s * SR)
    n = len(x) - L
    y = x[:n].copy()
    r = np.linspace(0, 1, L)
    y[:L] = y[:L] * r + x[n:] * (1 - r)
    return y

def norm(x, peak=0.8):
    return x / (np.abs(x).max() + 1e-9) * peak

def save(name, x):
    x16 = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    p = f"{OUT}/{name}.wav"
    with wave.open(p, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(x16.tobytes())
    print(name, f"{os.path.getsize(p)//1024}KB")

def soft_drops(n, rate_hz, f_lo, f_hi, dur_s=0.03):
    """柔軟水滴:低頻帶 + 緩衰減,不劈啪"""
    out = np.zeros(n)
    count = int(rate_hz * n / SR)
    d = int(dur_s * SR)
    env = np.exp(-np.linspace(0, 5, d)) * np.sin(np.pi * np.minimum(np.linspace(0, 4, d), 1))
    for _ in range(count):
        i = rng.integers(0, n - d)
        fc = rng.uniform(f_lo, f_hi)
        tick = bp(white(d) * env, max(fc * 0.55, 100), fc * 1.6, 2)
        out[i:i + d] += tick * rng.uniform(0.25, 0.7)
    return out

DUR = 32
N = (DUR + 3) * SR

# ── L1 rain-mist:霧狀細雨,極柔 ──
mist = bp(pink(N), 400, 2600) * slow_lfo(N, 0.05, 0.3, 1.0)
save("rain-mist", norm(loopify(lp(mist, 3200)), 0.6))

# ── L2 rain-drips:錯落滴答,溫潤 ──
bed = bp(pink(N), 350, 2200) * 0.22 * slow_lfo(N, 0.07, 0.25, 1.0)
drips = soft_drops(N, 6, 600, 2200, 0.035) * 0.85
save("rain-drips", norm(loopify(lp(bed + drips, 3600)), 0.68))

# ── L3 rain-light:綿綿沙沙 ──
body = bp(pink(N), 300, 4200) * 0.55 * slow_lfo(N, 0.08, 0.2, 1.0)
drs = soft_drops(N, 14, 600, 2600) * 0.4
save("rain-light", norm(loopify(lp(body + drs, 5000)), 0.74))

# ── L4 rain-medium:飽滿但溫潤的啪嗒 ──
body = bp(pink(N) * 0.75 + white(N) * 0.25, 250, 4800) * 0.6 * slow_lfo(N, 0.09, 0.18, 1.0)
drs = soft_drops(N, 30, 500, 3000) * 0.35
low = lp(brown(N), 220) * 0.22
save("rain-medium", norm(loopify(lp(body + drs + low, 5600))))

# ── L5 rain-heavy:厚實但不刺耳 ──
body = bp(pink(N) * 0.6 + white(N) * 0.4, 200, 5200) * 0.75 * slow_lfo(N, 0.1, 0.15, 1.0)
low = lp(brown(N), 200) * 0.32
drs = soft_drops(N, 45, 450, 3200) * 0.3
save("rain-heavy", norm(loopify(lp(body + low + drs, 6000))))

# ── L6-7 rain-downpour:平滑轟鳴 roar ──
roar = bp(pink(N) * 0.5 + white(N) * 0.5, 160, 5800) * 0.9 * slow_lfo(N, 0.1, 0.12, 1.0)
deep = lp(brown(N), 170) * 0.45
save("rain-downpour", norm(loopify(lp(roar + deep, 6400))))

# ── wind:柔風(呼嘯壓低) ──
gust = lp(pink(N), 380) * slow_lfo(N, 0.09, 0.9, 0.85)
whistle = bp(pink(N), 550, 950) * slow_lfo(N, 0.06, 0.7, 0.4) * 0.12
save("wind", norm(loopify(gust + whistle), 0.72))

# ── storm-wind:深沉陣風 ──
gust = lp(pink(N), 330) * slow_lfo(N, 0.13, 1.2, 0.8)
deep = lp(brown(N), 100) * 0.35 * slow_lfo(N, 0.08, 0.7, 0.8)
whistle = bp(pink(N), 600, 1100) * slow_lfo(N, 0.1, 0.9, 0.45) * 0.16
save("storm-wind", norm(loopify(gust + deep + whistle), 0.78))

# ── thunder:遠雷(柔化,不炸耳) ──
tn = int(10 * SR)
roll = lp(brown(tn), 95) * np.exp(-np.linspace(0, 3.0, tn))
roll *= slow_lfo(tn, 0.7, 0.8, 0.7)
fade = np.ones(tn); fs_ = int(2 * SR); fade[-fs_:] = np.linspace(1, 0, fs_)
save("thunder", norm(lp(roll * fade, 400), 0.7))

# ── fire:溫潤柴火 ──
crackle = soft_drops(N, 9, 1500, 5000, 0.012) * 0.7
pops = soft_drops(N, 2, 300, 900, 0.03) * 0.8
ember = lp(brown(N), 300) * 0.32 * slow_lfo(N, 0.15, 0.4, 0.85)
save("fire", norm(loopify(lp(crackle + pops + ember, 6000)), 0.72))

# ── waves:柔浪 ──
t = np.arange(N) / SR
swell = np.zeros(N)
for k in range(int((DUR + 3) / 9.0) + 2):
    c = k * 9.0 + rng.uniform(-1, 1)
    e = np.where(t < c, np.exp(-((t - c) / 3.2) ** 2), np.exp(-((t - c) / 4.5) ** 2))
    swell += e
swell = lp(swell, 1.0, 2); swell = swell / (swell.max() + 1e-9)
bodyw = bp(pink(N), 150, 1600) * (0.18 + 0.82 * swell)
foam = bp(white(N), 1800, 4800) * (0.04 + 0.35 * swell ** 2)
save("waves", norm(loopify(lp(bodyw + foam * 0.4, 5200)), 0.75))

# ── stream:柔溪 ──
sh = bp(pink(N), 400, 2400) * slow_lfo(N, 5, 0.4, 0.8)
gl = bp(white(N), 2400, 5000) * slow_lfo(N, 8, 0.5, 0.5) * 0.22
lowg = lp(brown(N), 260) * 0.2
save("stream", norm(loopify(lp(sh + gl + lowg, 5600)), 0.72))

# ── birds(降亮度) ──
amb = lp(pink(N), 350) * 0.06
chirps = np.zeros(N)
def chirp(f0, f1, d, vib=0):
    n_ = int(d * SR); tt = np.arange(n_) / SR
    f = np.linspace(f0, f1, n_) + vib * np.sin(2 * np.pi * 40 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    e = np.sin(np.pi * np.linspace(0, 1, n_)) ** 1.5
    return np.sin(ph) * e
pos = 1.0
while pos < DUR + 1.5:
    for j in range(rng.integers(2, 6)):
        base_f = rng.uniform(2000, 3800)
        d = rng.uniform(0.06, 0.16)
        c = chirp(base_f * rng.uniform(0.9, 1.25), base_f * rng.uniform(0.8, 1.2), d, vib=rng.uniform(0, 100))
        i = int(pos * SR)
        if i + len(c) < N: chirps[i:i + len(c)] += c * rng.uniform(0.15, 0.4)
        pos += d + rng.uniform(0.05, 0.25)
    pos += rng.uniform(1.5, 3.5)
save("birds", norm(loopify(lp(amb + chirps, 5200)), 0.65))

# ── crickets(降亮度) ──
amb = lp(pink(N), 300) * 0.05
cr = np.zeros(N)
for f0, pulse_hz, group_s, gap_lo, gap_hi, amp in [(3900, 25, 0.55, 0.5, 1.2, 0.28), (3300, 17, 0.8, 1.2, 2.6, 0.18)]:
    pos = rng.uniform(0, 1)
    while pos < DUR + 2:
        n_ = int(group_s * SR); tt = np.arange(n_) / SR
        pulse = lp((np.sin(2 * np.pi * pulse_hz * tt) > 0.2).astype(float), 180, 2)
        tone = np.sin(2 * np.pi * f0 * tt + 2.5 * np.sin(2 * np.pi * 6 * tt))
        e = np.sin(np.pi * np.linspace(0, 1, n_)) ** 0.5
        i = int(pos * SR)
        if i + n_ < N: cr[i:i + n_] += tone * pulse * e * amp
        pos += group_s + rng.uniform(gap_lo, gap_hi)
save("crickets", norm(loopify(amb + cr), 0.6))

# ── keyboard(柔化) ──
kb = np.zeros(N)
pos = 0.5
while pos < DUR + 2:
    for _ in range(rng.integers(4, 12)):
        d = int(0.012 * SR)
        click = hp(white(d), 1400) * np.exp(-np.linspace(0, 6, d))
        dn = int(0.025 * SR)
        thock = lp(white(dn), 800) * np.exp(-np.linspace(0, 7, dn))
        i = int(pos * SR)
        if i + dn < N:
            kb[i:i + d] += click * rng.uniform(0.3, 0.7)
            kb[i:i + dn] += thock * rng.uniform(0.2, 0.5)
        pos += rng.uniform(0.1, 0.22)
    pos += rng.uniform(0.7, 2.2)
save("keyboard", norm(loopify(lp(kb, 5600)), 0.6))

# ── drop:觸水互動音(one-shot 0.95s)— water splashing 手拍到水面濺起水花 ──
dn = int(0.95 * SR)
tt = np.arange(dn) / SR
# 入水 impact:短促有力的水面拍擊
impact = bp(white(dn), 350, 4200) * np.minimum(tt / 0.006, 1) * np.exp(-tt * 26) * 1.1
# 水花噴濺 spray:密集細碎、幅度抖動(splashing 的「嘩」)
jitter = 1 + 0.6 * lp(white(dn), 60, 2)
spray = bp(white(dn), 800, 4800) * np.minimum(tt / 0.015, 1) * np.exp(-tt * 7.5) * jitter * 0.55
# 水體 slosh:低頻湧動
slosh = lp(white(dn), 350) * np.minimum(tt / 0.03, 1) * np.exp(-tt * 5.5)
slosh *= (1 + 0.4 * np.sin(2 * np.pi * 7 * tt + 0.8) * np.exp(-tt * 4)) * 0.5
# 回落水滴:濺起的水珠落回水面
plips = np.zeros(dn)
for _ in range(5):
    start = rng.uniform(0.18, 0.55); bd = rng.uniform(0.025, 0.05)
    bn = int(bd * SR); i = int(start * SR)
    if i + bn >= dn: continue
    tb = np.arange(bn) / SR
    f0 = rng.uniform(700, 1300)
    ph = 2 * np.pi * np.cumsum(f0 * np.exp(-tb * 18) + 300) / SR
    plips[i:i+bn] += np.sin(ph) * np.sin(np.pi * np.linspace(0, 1, bn)) ** 1.3 * rng.uniform(0.12, 0.25)
# 收尾餘波
tail = bp(white(dn), 600, 2600) * np.exp(-np.maximum(tt - 0.3, 0) * 8) * (tt > 0.3) * 0.1
save("drop", norm(lp(impact + spray + slosh + plips + tail, 5200), 0.74))

print("DONE")
