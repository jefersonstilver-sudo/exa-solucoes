"""EXA Motion Studio worker: renders a sofia_video_jobs row to MP4, uploads to Storage, notifies Sofia."""
import os, sys, json, subprocess, urllib.request, urllib.error

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TOKEN = os.environ["SOFIA_WEBHOOK_TOKEN"]
JOB = os.environ["JOB_ID"]
BUCKET = "sofia-videos"
HERE = os.path.dirname(os.path.abspath(__file__))

def req(method, path, body=None, headers=None, raw=None):
    h = {"apikey": KEY, "Authorization": "Bearer " + KEY}
    h.update(headers or {})
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    if body is not None: h["Content-Type"] = "application/json"
    r = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=120) as resp:
        t = resp.read()
        return json.loads(t) if t and t[:1] in b"[{" else t

def notify(payload):
    r = urllib.request.Request(f"{URL}/functions/v1/sofia-agent?action=video&token={TOKEN}",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + KEY})
    try: urllib.request.urlopen(r, timeout=60).read()
    except Exception as e: print("notify failed", e)

def gerar_cena(job):
    """Potencializador: pede ao Sofia (Claude) o codigo JS do motion, valida renderizando quadros de teste; ate 3 tentativas, senao cai no template."""
    import time
    try: subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pillow"], check=False)
    except Exception: pass
    erro = ""
    for tent in range(3):
        try:
            r = urllib.request.Request(f"{URL}/functions/v1/sofia-agent?action=codegen&token={TOKEN}",
                data=json.dumps({"job_id": JOB, "erro": erro, "tentativa": tent}).encode(), method="POST",
                headers={"Content-Type": "application/json", "Authorization": "Bearer " + KEY})
            urllib.request.urlopen(r, timeout=60).read()
        except Exception as e:
            print("codegen request falhou", e); erro = "falha ao pedir codigo"; continue
        b = {}
        t0 = time.time()
        while time.time() - t0 < 420:
            time.sleep(6)
            rows = req("GET", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}&select=briefing")
            b = (rows[0]["briefing"] if rows else {}) or {}
            if b.get("scene_status") in ("ready", "failed"): break
        if b.get("scene_status") != "ready" or not b.get("scene_code"):
            erro = b.get("scene_err") or "sem codigo"; print("cena nao gerada:", erro); continue
        vj = f"/tmp/val_{JOB}.json"
        json.dump({"formato": job.get("formato") or "horizontal", "briefing": b}, open(vj, "w"))
        p = subprocess.run([sys.executable, os.path.join(HERE, "render.py"), vj, f"/tmp/valout_{JOB}", "--validate"], capture_output=True, text=True, timeout=600)
        line = [l for l in p.stdout.splitlines() if l.startswith("VALIDATE ")]
        print(p.stdout[-1500:], p.stderr[-800:])
        if line:
            res = json.loads(line[0][9:])
            if res.get("ok"):
                b["scene_validada"] = True; b["scene_tent"] = tent
                return b
            erro = "; ".join(res.get("problemas", []))
        else:
            erro = "validacao nao executou: " + p.stderr[-300:]
    b = dict(job.get("briefing") or {}); 
    try:
        rows = req("GET", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}&select=briefing"); b = (rows[0]["briefing"] if rows else b) or b
    except Exception: pass
    b["scene_code"] = None; b["scene_fallback"] = True; b["scene_err"] = (erro or "")[:200]
    return b

def main():
    rows = req("GET", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}&select=*")
    if not rows: sys.exit("job not found")
    job = rows[0]
    req("PATCH", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}", {"status": "rendering"})
    jp, out = f"/tmp/job_{JOB}.json", f"/tmp/{JOB}.mp4"
    brief0 = dict(job.get("briefing") or {})
    if brief0.get("gen_scene") and not brief0.get("scene_code"):
        brief0 = gerar_cena(job)
    spec = {"formato": job.get("formato") or "horizontal", "briefing": brief0}
    json.dump(spec, open(jp, "w"))
    subprocess.run([sys.executable, os.path.join(HERE, "render.py"), jp, out], check=True)
    with open(out, "rb") as f: blob = f.read()
    path = f"{JOB}.mp4"
    req("POST", f"/storage/v1/object/{BUCKET}/{path}", raw=blob,
        headers={"Content-Type": "video/mp4", "x-upsert": "true"})
    pub = f"{URL}/storage/v1/object/public/{BUCKET}/{path}"
    # quadros para o editor-chefe (revisao automatica)
    qa = []
    try:
        dur = 15 if "vertical" in (job.get("formato") or "") else 10
        for i, f in enumerate([0.9, 2.3, 3.7, 5.1, 6.5, 7.9, 9.2]):
            t = f * dur / 10.0
            fp = f"/tmp/qa_{JOB}_{i}.jpg"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", out, "-frames:v", "1", "-vf", "scale=800:-2", "-q:v", "4", fp], check=True)
            with open(fp, "rb") as fh: jb = fh.read()
            req("POST", f"/storage/v1/object/{BUCKET}/qa/{JOB}-{i}.jpg", raw=jb, headers={"Content-Type": "image/jpeg", "x-upsert": "true"})
            qa.append({"t": round(t, 1), "url": f"{URL}/storage/v1/object/public/{BUCKET}/qa/{JOB}-{i}.jpg"})
    except Exception as e:
        print("qa frames falhou", e)
    brief = dict(brief0)
    brief["qa_frames"] = qa
    req("PATCH", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}", {"status": "ready", "output_url": pub, "briefing": brief})
    notify({"job_id": JOB})

if __name__ == "__main__":
    try: main()
    except Exception as e:
        print("ERROR", e)
        try:
            req("PATCH", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}", {"status": "error", "error": str(e)[:500]})
        except Exception: pass
        notify({"job_id": JOB, "error": str(e)[:300]})
        sys.exit(1)
