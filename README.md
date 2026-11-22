# eGFR Clinical Pro — CKD-EPI 2021 (Android APK & iOS)

Applicazione clinica per il calcolo della velocità di filtrazione glomerulare stimata (**eGFR**) progettata secondo i principi di **Usability Engineering (ISO 9241-210)**, le **8 Golden Rules di Shneiderman** e i **7 Principi di Norman**.

## Migliorie di Interfaccia Implementate (Riferimento Esercitazione)
1. **Prevenzione degli errori (Shneiderman #5 / Norman Constraints):** Validazione fisiologica in tempo reale (Età 18–120 anni, Creatinina 0.1–30 mg/dL), alert cromatico sui valori critici e conversione automatica bidirezionale `mg/dL ↔ µmol/L` senza perdita di dati.
2. **Feedback informativo continuo (Shneiderman #3 / Norman Feedback):** Calcolo istantaneo durante la digitazione (zero click superflui), barra visiva di stadiazione KDIGO `G1–G5` con indicatore dinamico.
3. **Riduzione del carico cognitivo (Shneiderman #8):** Parametri avanzati (Cistatina C e Superficie Corporea Du Bois per eGFR assoluto) in sezione espandibile, referto clinico strutturato copiabile con 1 tocco.
4. **Controllo, Scorciatoie e Reversibilità (Shneiderman #2, #6, #7):** Casi clinici rapidi preimpostati, pulsanti stepper ergonomici (`+`/`−`), tasto `Azzera` e cronologia locale con ripristino immediato.

---

## 1. Come ottenere l'APK per Android tramite GitHub (Automatico)
1. Crea un nuovo repository su **GitHub** (es. `egfr-clinical-pro`).
2. Carica tutti i file di questa cartella nel repository (inclusa la cartella nascosta `.github/workflows/build-apk.yml`).
3. Vai nella scheda **Actions** del tuo repository su GitHub: partirà in automatico il workflow **Build Android APK**.
4. Al termine (circa 2-3 minuti), clicca sul run completato e scarica l'artefatto **`eGFR-Clinical-Pro-APK`** contenente `app-debug.apk`.
5. Invia `app-debug.apk` al telefono Android (via WhatsApp, Telegram, Drive o cavo USB) e installalo.

## 2. Come installare l'app su iPhone (iOS)
L'app integra un Service Worker e un Web App Manifest (`manifest.json`) compatibili con iOS Safari:
1. Attiva **GitHub Pages** sul repository (`Settings → Pages → Branch: main → Folder: / (root)` oppure pubblicando la cartella `www/`).
2. Apri il link generato da **Safari su iPhone**.
3. Tocca l'icona **Condividi** (quadrato con freccia verso l'alto) e seleziona **Aggiungi alla schermata Home**.
4. L'app funzionerà a schermo intero come app nativa anche **offline**, senza barra del browser.
*(In alternativa, su Mac con Xcode puoi eseguire `npm install && npx cap add ios && npx cap open ios` per compilare il pacchetto IPA).*
