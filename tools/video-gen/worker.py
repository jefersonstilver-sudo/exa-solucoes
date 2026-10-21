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

def main():
    rows = req("GET", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}&select=*")
    if not rows: sys.exit("job not found")
    job = rows[0]
    req("PATCH", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}", {"status": "rendering"})
    spec = {"formato": job.get("formato") or "horizontal", "briefing": job.get("briefing") or {}}
    jp, out = f"/tmp/job_{JOB}.json", f"/tmp/{JOB}.mp4"
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
    brief = dict(job.get("briefing") or {})
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
