from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from vosk import Model, KaldiRecognizer
import wave, json, subprocess, os, re, httpx
from openai import OpenAI

app = FastAPI()

# Autoriser le front
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chemin du modèle
model_path = "linto-asr-ar-tn-0.1/vosk-model"
model = Model(model_path)

def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()

# ------------------------------
# Endpoint pour fichier audio (transcription + résumé)
# ------------------------------
@app.post("/transcribe-file/")
async def transcribe_file(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    temp_path = f"uploads/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Convertir en WAV mono 16kHz
    audio_wav = f"{temp_path}.wav"
    subprocess.run([
        "ffmpeg", "-y", "-i", temp_path,
        "-ac", "1", "-ar", "16000", "-sample_fmt", "s16", audio_wav
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Transcription
    wf = wave.open(audio_wav, "rb")
    rec = KaldiRecognizer(model, wf.getframerate())
    results = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0: break
        if rec.AcceptWaveform(data):
            results.append(json.loads(rec.Result()))
    results.append(json.loads(rec.FinalResult()))
    transcript = " ".join([r.get("text","") for r in results])
    transcript = clean_text(transcript)

    wf.close()
    os.remove(temp_path)
    os.remove(audio_wav)

    # Résumé avec LLM
    http_client = httpx.Client(verify=False)
    client = OpenAI(
        api_key="sk-83d910e10b1e44658ea00d57a407ecac",
        base_url="https://tokenfactory.esprit.tn/api",
        http_client=http_client
    )

    prompt = f"""
    أنت مساعد ذكي.
    عندك نص ناتج عن تحويل صوت إلى نص باللهجة التونسية.
    النص فيه أخطاء بسيطة وتكرار.

    المطلوب:
    - اعمل ملخص واضح
    - نقاط مرتبة
    - باللهجة التونسية

    النص:
    \"\"\"{transcript}\"\"\"
    """

    response = client.chat.completions.create(
        model="hosted_vllm/Llama-3.1-70B-Instruct",
        messages=[
            {"role": "system", "content": "أنت مساعد مفيد وملخصك واضح."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=300
    )

    summary = response.choices[0].message.content
    return {"transcript": transcript, "summary": summary}
