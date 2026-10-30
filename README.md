# AnesthesiaGuard

Assistant IA pour la **préparation aux consultations pré-anesthésiques** :

- reconnaissance de médicaments (OCR) + consignes d’arrêt/maintien (RAG)
- estimation du score ASA
- téléconsultation avec **transcription** et **résumé** en dialecte tunisien (ASR)

Projet académique — Ministère de la Santé Publique (Tunisie) / Hôpital Militaire de Tunis.

---

## Architecture

| Dossier | Rôle | Port |
|---|---|---|
| `anesthesia-guardian-main` | Front patient / médecin (React) | **8080** |
| `drugs_recognition` | Back OCR + RAG + ASA (FastAPI) | **8050** |
| `docuspeak-live` | Front téléconsultation (React) | **8080*** |
| `asr-backend` | Back transcription + résumé (FastAPI) | **8001** |
| `audio_files` | Audios de test ASR | — |
| `TnASR.ipynb` | Fine-tuning Whisper (arabe tunisien) | Colab / local |

\* Si les deux fronts tournent en même temps, lance `docuspeak-live` sur un autre port (ex. `npm run dev -- --port 8082`).

```
Patient (front 8080)
  → scan boîte → OCR → protocole pré-op (RAG)
  → profil → score ASA
  → téléconsultation (front 8082)
      → audio → ASR + résumé IA
```

---

## Fonctionnalités

### Médicaments & ASA (`drugs_recognition`)
- **`POST /ocr/scan`** — photo de boîte → EasyOCR + matching (exact / fuzzy) → nom + sous-catégorie
- **`POST /rag/protocol`** — question → embeddings (SentenceTransformer) + FAISS + reranker → consigne via **Mistral 7B**
- **`POST /asa/evaluate`** — profil patient → score ASA

### Voix tunisienne (`asr-backend` + `docuspeak-live`)
- 3 modes : **upload**, **micro**, **appel live** (WebRTC + signalisation Supabase)
- Conversion audio **FFmpeg** (WAV mono 16 kHz)
- Transcription **LinTO / Vosk** (dialecte tunisien)
- Résumé via LLM (Llama via TokenFactory ESPRIT)

### Recherche ASR (`TnASR.ipynb`)
- Fine-tuning **Whisper-small** sur **TunSwitchTO**
- Évaluation WER / CER, analyses XAI

---

## Stack technique

**Front** : React, TypeScript, Vite, Tailwind, shadcn/ui, WebRTC, Supabase Realtime  

**Back IA** : FastAPI, PyTorch, SentenceTransformer, FAISS, EasyOCR, OpenCV, Pandas, NumPy, ctransformers (Mistral), Vosk / LinTO, FFmpeg, Torchaudio, Whisper

---

## Prérequis

- Node.js 18+
- Python 3.10+
- FFmpeg installé et disponible dans le `PATH`
- Compte / projet **Supabase** (appel live uniquement)
- Modèle **Vosk LinTO ar-tn** (non inclus dans ce dépôt — trop volumineux)
- Modèle **Mistral 7B GGUF** pour le RAG / ASA (à télécharger localement)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/TON_USERNAME/AnesthesiaGuard.git
cd AnesthesiaGuard
```

### 2. Backend médicaments (OCR / RAG / ASA)

```bash
cd drugs_recognition
pip install -r ../requirements.txt
# Placer le CSV médicaments + data_anesthesie.json + modèle GGUF Mistral
uvicorn main:app --host 0.0.0.0 --port 8050
```

### 3. Front patient / médecin

```bash
cd anesthesia-guardian-main
npm install
npm run dev
# → http://localhost:8080
```

### 4. Backend ASR

```bash
cd asr-backend
# Placer le modèle dans : linto-asr-ar-tn-0.1/vosk-model/
pip install -r requirements.txt   # ou ../requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001
```

### 5. Front téléconsultation

```bash
cd docuspeak-live
npm install
# Créer un .env avec :
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
npm run dev -- --port 8082
# → http://localhost:8082
```

---

## Endpoints utiles

| Service | Endpoint | Description |
|---|---|---|
| drugs_recognition | `POST /ocr/scan` | Scan médicament |
| drugs_recognition | `POST /rag/protocol` | Consigne pré-op |
| drugs_recognition | `POST /asa/evaluate` | Score ASA |
| asr-backend | `POST /transcribe-file/` | Transcription + résumé |

---

## Structure du dépôt

```
├── anesthesia-guardian-main/   # Front principal
├── drugs_recognition/          # OCR + RAG + ASA
├── docuspeak-live/             # Front téléconsultation
├── asr-backend/                # ASR + résumé
├── audio_files/                # Exemples audio
├── TnASR.ipynb                 # Fine-tuning Whisper
├── requirements.txt
└── README.md
```

> Les modèles lourds (Vosk, GGUF, archive FFmpeg) ne sont **pas** versionnés. Voir les README des sous-dossiers / documentation LinTO pour les récupérer.

---

## Auteurs

- **Aymen** — ASR / téléconsultation / fine-tuning Whisper  
- **Malek** — OCR médicaments / RAG protocoles / score ASA  

---

## Licence

Projet académique — usage éducatif.
