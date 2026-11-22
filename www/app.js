// eGFR Clinical Pro — CKD-EPI 2021 (Inker et al., NEJM 2021) & KDIGO Staging
(function () {
  "use strict";

  const state = {
    sex: "F",
    unit: "mgdl", // 'mgdl' | 'umol'
    history: JSON.parse(localStorage.getItem("egfr_session_history") || "[]")
  };

  // DOM Elements
  const segButtons = document.querySelectorAll(".seg-btn");
  const unitButtons = document.querySelectorAll(".unit-btn");
  const stepButtons = document.querySelectorAll(".step-btn");
  const chipButtons = document.querySelectorAll(".chip-btn");

  const ageInput = document.getElementById("ageInput");
  const crInput = document.getElementById("crInput");
  const cysInput = document.getElementById("cysInput");
  const weightInput = document.getElementById("weightInput");
  const heightInput = document.getElementById("heightInput");

  const ageFeedback = document.getElementById("ageFeedback");
  const crFeedback = document.getElementById("crFeedback");
  const cysFeedback = document.getElementById("cysFeedback");
  const crConverted = document.getElementById("crConverted");

  const emptyResultPrompt = document.getElementById("emptyResultPrompt");
  const populatedResult = document.getElementById("populatedResult");
  const equationUsedBadge = document.getElementById("equationUsedBadge");
  const egfrNumber = document.getElementById("egfrNumber");
  const stageBadge = document.getElementById("stageBadge");
  const scaleMarker = document.getElementById("scaleMarker");
  const clinicalAlertBox = document.getElementById("clinicalAlertBox");
  const stageTitle = document.getElementById("stageTitle");
  const stageDescription = document.getElementById("stageDescription");
  const bsaResultRow = document.getElementById("bsaResultRow");
  const absEgfrVal = document.getElementById("absEgfrVal");
  const bsaVal = document.getElementById("bsaVal");

  const btnReset = document.getElementById("btnReset");
  const btnCopyReport = document.getElementById("btnCopyReport");
  const btnSaveSession = document.getElementById("btnSaveSession");
  const btnHistory = document.getElementById("btnHistory");
  const btnInfo = document.getElementById("btnInfo");
  const btnClearHistory = document.getElementById("btnClearHistory");
  const historyCount = document.getElementById("historyCount");
  const historyList = document.getElementById("historyList");
  const toast = document.getElementById("toast");

  let lastResult = null;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2400);
  }

  // CKD-EPI 2021 Creatinine-only equation (Race-free)
  function calcCkdEpi2021Cr(scrMgDl, age, sex) {
    const kappa = sex === "F" ? 0.7 : 0.9;
    const alpha = sex === "F" ? -0.241 : -0.302;
    const sexFactor = sex === "F" ? 1.012 : 1.0;
    const ratio = scrMgDl / kappa;
    return 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, age) * sexFactor;
  }

  // CKD-EPI 2021 Creatinine-Cystatin C combined equation (Race-free)
  function calcCkdEpi2021CrCys(scrMgDl, scysMgL, age, sex) {
    const kappa = sex === "F" ? 0.7 : 0.9;
    const alpha = sex === "F" ? -0.219 : -0.144;
    const sexFactor = sex === "F" ? 0.963 : 1.0;
    const crRatio = scrMgDl / kappa;
    const cysRatio = scysMgL / 0.8;
    return (
      135 *
      Math.pow(Math.min(crRatio, 1), alpha) *
      Math.pow(Math.max(crRatio, 1), -0.544) *
      Math.pow(Math.min(cysRatio, 1), -0.323) *
      Math.pow(Math.max(cysRatio, 1), -0.778) *
      Math.pow(0.9961, age) *
      sexFactor
    );
  }

  function getKdigoStage(egfr) {
    if (egfr >= 90) {
      return {
        code: "G1",
        cls: "stage-g1",
        color: "#1E7E34",
        markerPct: 91,
        title: "G1 — Funzione renale normale o elevata (≥ 90)",
        desc: "Filtrato glomerulare nella norma. In assenza di albuminuria o anomalie strutturali/urinari persistenti (>3 mesi), non configura IRC."
      };
    } else if (egfr >= 60) {
      return {
        code: "G2",
        cls: "stage-g2",
        color: "#4C9A2A",
        markerPct: 75,
        title: "G2 — Lieve riduzione del filtrato (60 – 89)",
        desc: "Riduzione lieve dell'eGFR. Valutare rapporto albumina/creatinina urinaria (uACR) per la stratificazione del rischio KDIGO."
      };
    } else if (egfr >= 45) {
      return {
        code: "G3a",
        cls: "stage-g3a",
        color: "#C68B00",
        markerPct: 58,
        title: "G3a — Riduzione da lieve a moderata (45 – 59)",
        desc: "Insufficienza renale cronica stadio G3a se confermata >3 mesi. Monitorare progressione, pressione arteriosa e aggiustare farmaci nefrotossici."
      };
    } else if (egfr >= 30) {
      return {
        code: "G3b",
        cls: "stage-g3b",
        color: "#D96B00",
        markerPct: 41,
        title: "G3b — Riduzione da moderata a severa (30 – 44)",
        desc: "Rischio aumentato di complicanze metaboliche e cardiovascolari. Obbligatorio adeguamento posologico dei farmaci a escrezione renale."
      };
    } else if (egfr >= 15) {
      return {
        code: "G4",
        cls: "stage-g4",
        color: "#C53030",
        markerPct: 24,
        title: "G4 — Riduzione severa del filtrato (15 – 29)",
        desc: "Insufficienza renale avanzata. Indicata presa in carico specialistica nefrologica e preparazione multidisciplinare al trattamento sostitutivo."
      };
    } else {
      return {
        code: "G5",
        cls: "stage-g5",
        color: "#742A2A",
        markerPct: 8,
        title: "G5 — Insufficienza renale terminale (< 15)",
        desc: "Quadro di uremia terminale (ESKD). Valutazione nefrologica urgente per terapia sostitutiva (dialisi / trapianto) o terapia conservativa."
      };
    }
  }

  function validateAndCompute() {
    const ageVal = parseFloat(ageInput.value);
    const rawCr = parseFloat(crInput.value);
    const rawCys = parseFloat(cysInput.value);
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);

    let ageValid = false;
    let crValid = false;
    let cysValid = true;

    // Validate Age
    ageFeedback.textContent = "";
    ageFeedback.className = "field-feedback";
    ageInput.parentElement.classList.remove("invalid");

    if (!isNaN(ageVal)) {
      if (ageVal < 18 || ageVal > 120) {
        ageFeedback.textContent = "Età fuori range validato CKD-EPI (18–120 anni).";
        ageInput.parentElement.classList.add("invalid");
      } else {
        ageValid = true;
        if (ageVal >= 85) {
          ageFeedback.textContent = "Nota: nei grandi anziani valutare anche cistatina C.";
          ageFeedback.classList.add("warn");
        }
      }
    }

    // Validate Creatinine & Bidirectional Conversion
    crFeedback.textContent = "";
    crFeedback.className = "field-feedback";
    crConverted.textContent = "";
    crInput.parentElement.classList.remove("invalid");

    let scrMgDl = NaN;
    if (!isNaN(rawCr)) {
      if (state.unit === "mgdl") {
        scrMgDl = rawCr;
        if (rawCr < 0.1 || rawCr > 30) {
          crFeedback.textContent = "Valore non fisiologico (0.1 – 30 mg/dL).";
          crInput.parentElement.classList.add("invalid");
        } else {
          crValid = true;
          crConverted.textContent = `= ${(rawCr * 88.4).toFixed(0)} µmol/L`;
          if (rawCr > 5.0) {
            crFeedback.textContent = "Valore critico elevato: verificare unità di misura.";
            crFeedback.classList.add("warn");
          }
        }
      } else {
        scrMgDl = rawCr / 88.4;
        if (rawCr < 9 || rawCr > 2650) {
          crFeedback.textContent = "Valore non fisiologico (9 – 2650 µmol/L).";
          crInput.parentElement.classList.add("invalid");
        } else {
          crValid = true;
          crConverted.textContent = `= ${scrMgDl.toFixed(2)} mg/dL`;
          if (scrMgDl > 5.0) {
            crFeedback.textContent = "Valore critico elevato (> 5 mg/dL).";
            crFeedback.classList.add("warn");
          }
        }
      }
    }

    // Validate Optional Cystatin C
    cysFeedback.textContent = "";
    let useCys = false;
    if (!isNaN(rawCys) && cysInput.value.trim() !== "") {
      if (rawCys < 0.2 || rawCys > 15) {
        cysFeedback.textContent = "Cistatina C fuori range (0.2 – 15 mg/L).";
        cysValid = false;
      } else {
        useCys = true;
      }
    }

    if (!ageValid || !crValid || !cysValid) {
      emptyResultPrompt.classList.remove("hidden");
      populatedResult.classList.add("hidden");
      lastResult = null;
      return;
    }

    // Compute eGFR
    const egfr = useCys
      ? calcCkdEpi2021CrCys(scrMgDl, rawCys, ageVal, state.sex)
      : calcCkdEpi2021Cr(scrMgDl, ageVal, state.sex);

    const roundedEgfr = Math.round(egfr * 10) / 10;
    const stage = getKdigoStage(roundedEgfr);

    emptyResultPrompt.classList.add("hidden");
    populatedResult.classList.remove("hidden");

    equationUsedBadge.textContent = useCys
      ? "CKD-EPI Cr + Cistatina C (2021)"
      : "CKD-EPI Creatinina (2021)";
    egfrNumber.textContent = roundedEgfr.toFixed(1);

    stageBadge.textContent = stage.code;
    stageBadge.className = `stage-badge ${stage.cls}`;
    scaleMarker.style.left = `${stage.markerPct}%`;
    clinicalAlertBox.style.borderLeftColor = stage.color;
    stageTitle.textContent = stage.title;
    stageDescription.textContent = stage.desc;

    // Optional Du Bois BSA calculation for non-indexed eGFR (mL/min)
    let bsa = null;
    let absEgfr = null;
    if (!isNaN(weight) && weight >= 20 && weight <= 300 && !isNaN(height) && height >= 100 && height <= 250) {
      bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
      absEgfr = (roundedEgfr * bsa) / 1.73;
      bsaVal.textContent = bsa.toFixed(2);
      absEgfrVal.textContent = absEgfr.toFixed(1);
      bsaResultRow.classList.remove("hidden");
    } else {
      bsaResultRow.classList.add("hidden");
    }

    lastResult = {
      timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      sex: state.sex,
      age: ageVal,
      scrMgDl: scrMgDl.toFixed(2),
      cys: useCys ? rawCys.toFixed(2) : null,
      egfr: roundedEgfr.toFixed(1),
      stage: stage.code,
      equation: useCys ? "CKD-EPI 2021 Cr-Cys" : "CKD-EPI 2021 Cr",
      absEgfr: absEgfr ? absEgfr.toFixed(1) : null
    };
  }

  // Sex Segmented Control
  segButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      segButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
      state.sex = btn.dataset.sex;
      validateAndCompute();
    });
  });

  // Unit Toggle with automatic conversion of current value
  unitButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextUnit = btn.dataset.unit;
      if (nextUnit === state.unit) return;

      const currentVal = parseFloat(crInput.value);
      if (!isNaN(currentVal)) {
        if (nextUnit === "umol") {
          crInput.value = Math.round(currentVal * 88.4);
          crInput.step = "1";
          crInput.placeholder = "es. 102";
        } else {
          crInput.value = (currentVal / 88.4).toFixed(2);
          crInput.step = "0.01";
          crInput.placeholder = "es. 1.15";
        }
      } else {
        crInput.step = nextUnit === "umol" ? "1" : "0.01";
        crInput.placeholder = nextUnit === "umol" ? "es. 102" : "es. 1.15";
      }

      unitButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.unit = nextUnit;
      validateAndCompute();
    });
  });

  // Stepper Buttons (+/-)
  stepButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      let step = parseFloat(btn.dataset.step);
      if (btn.dataset.target === "crInput" && state.unit === "umol") {
        step = step > 0 ? 5 : -5;
      }
      const current = parseFloat(input.value) || (btn.dataset.target === "ageInput" ? 50 : state.unit === "umol" ? 90 : 1.0);
      const next = Math.max(0, +(current + step).toFixed(2));
      input.value = next;
      validateAndCompute();
    });
  });

  // Quick Clinical Presets
  chipButtons.forEach((chip) => {
    chip.addEventListener("click", () => {
      // Ensure mg/dL for presets
      if (state.unit !== "mgdl") {
        unitButtons[0].click();
      }
      const p = chip.dataset.preset;
      if (p === "normal") {
        segButtons[0].click(); // F
        ageInput.value = 45;
        crInput.value = 0.9;
      } else if (p === "g3b") {
        segButtons[1].click(); // M
        ageInput.value = 68;
        crInput.value = 1.85;
      } else if (p === "g4") {
        segButtons[0].click(); // F
        ageInput.value = 76;
        crInput.value = 2.9;
      }
      validateAndCompute();
      showToast("Caso clinico di esempio caricato");
    });
  });

  // Live Listeners
  [ageInput, crInput, cysInput, weightInput, heightInput].forEach((el) => {
    el.addEventListener("input", validateAndCompute);
  });

  // Reset (Shneiderman #6 Reversibility)
  btnReset.addEventListener("click", () => {
    ageInput.value = "";
    crInput.value = "";
    cysInput.value = "";
    weightInput.value = "";
    heightInput.value = "";
    validateAndCompute();
    showToast("Campi azzerati");
  });

  // Copy Clinical Report
  btnCopyReport.addEventListener("click", async () => {
    if (!lastResult) return;
    const text = [
      `Stima Funzione Renale (${lastResult.equation})`,
      `- Paziente: ${lastResult.sex === "F" ? "Femmina" : "Maschio"}, ${lastResult.age} anni`,
      `- Creatinina sierica: ${lastResult.scrMgDl} mg/dL` + (lastResult.cys ? ` | Cistatina C: ${lastResult.cys} mg/L` : ""),
      `- eGFR: ${lastResult.egfr} mL/min/1.73m² (Stadio KDIGO ${lastResult.stage})` +
        (lastResult.absEgfr ? ` | eGFR assoluto: ${lastResult.absEgfr} mL/min` : "")
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      showToast("Referto copiato negli appunti");
    } catch {
      showToast("Referto pronto per la copia");
    }
  });

  // History Management
  function renderHistory() {
    historyCount.textContent = state.history.length;
    historyCount.classList.toggle("hidden", state.history.length === 0);

    if (state.history.length === 0) {
      historyList.innerHTML = '<p class="muted-center">Nessun calcolo salvato in questa sessione.</p>';
      return;
    }

    historyList.innerHTML = state.history
      .map(
        (item, idx) => `
      <div class="history-item" data-idx="${idx}">
        <div>
          <div class="hist-main">eGFR ${item.egfr} mL/min/1.73m² • Stadio ${item.stage}</div>
          <div class="hist-sub">${item.sex === "F" ? "F" : "M"}, ${item.age}a • Cr ${item.scrMgDl} mg/dL • Ore ${item.timestamp}</div>
        </div>
        <span style="color:var(--primary);font-weight:700;font-size:0.8rem;">Ripristina ↺</span>
      </div>`
      )
      .join("");

    historyList.querySelectorAll(".history-item").forEach((el) => {
      el.addEventListener("click", () => {
        const item = state.history[parseInt(el.dataset.idx, 10)];
        if (!item) return;
        if (state.unit !== "mgdl") unitButtons[0].click();
        segButtons[item.sex === "F" ? 0 : 1].click();
        ageInput.value = item.age;
        crInput.value = item.scrMgDl;
        cysInput.value = item.cys || "";
        validateAndCompute();
        document.getElementById("historyModal").classList.add("hidden");
        showToast("Calcolo ripristinato dalla cronologia");
      });
    });
  }

  btnSaveSession.addEventListener("click", () => {
    if (!lastResult) return;
    state.history.unshift(lastResult);
    if (state.history.length > 20) state.history.pop();
    localStorage.setItem("egfr_session_history", JSON.stringify(state.history));
    renderHistory();
    showToast("Salvato nella cronologia");
  });

  btnClearHistory.addEventListener("click", () => {
    state.history = [];
    localStorage.removeItem("egfr_session_history");
    renderHistory();
    showToast("Cronologia svuotata");
  });

  // Modals
  btnHistory.addEventListener("click", () => {
    renderHistory();
    document.getElementById("historyModal").classList.remove("hidden");
  });

  btnInfo.addEventListener("click", () => {
    document.getElementById("infoModal").classList.remove("hidden");
  });

  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.close).classList.add("hidden");
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  });

  // Register Service Worker for offline PWA support (iOS & Android)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  renderHistory();
})();
