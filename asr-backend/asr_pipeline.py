import subprocess
from vosk import Model, KaldiRecognizer
import wave
import json
import os
import httpx
from openai import OpenAI

def process_audio_file(audio_input):
    # Fichier converti
    audio_converted = "try.wav"

    # Conversion audio en WAV mono PCM 16kHz
    if os.path.exists(audio_converted):
        os.remove(audio_converted)

    subprocess.run([
        "ffmpeg", "-y", "-i", audio_input,
        "-ac", "1", "-ar", "16000", "-sample_fmt", "s16", audio_converted
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Chargement du modèle Vosk
    model = Model("linto-asr-ar-tn-0.1/vosk-model")

    # Transcription
    wf = wave.open(audio_converted, "rb")
    rec = KaldiRecognizer(model, wf.getframerate())
    results = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            results.append(json.loads(rec.Result()))
    results.append(json.loads(rec.FinalResult()))
    transcript = " ".join([r.get("text", "") for r in results])

    # Résumé avec LLM
    http_client = httpx.Client(verify=False)
    client = OpenAI(
        api_key="sk-83d910e10b1e44658ea00d57a407ecac",  # remplace par ta clé
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
    return transcript, summary
