(function () {
  "use strict";
  const core = window.AcreCalculator;
  const cards = new Map();
  const states = new Map();
  const copyButton = document.querySelector("#copy-summary");
  const actionStatus = document.querySelector("#action-status");
  const manualCopy = document.querySelector("#manual-copy");
  const summaryText = document.querySelector("#summary-text");
  let announcement;

  function announce(message) {
    clearTimeout(announcement);
    announcement = setTimeout(() => {
      document.querySelector("#calculation-status").textContent = message;
    }, 600);
  }

  function dismissSummary() {
    manualCopy.hidden = true;
    summaryText.value = "";
    actionStatus.textContent = "";
  }

  function inputValues(card) {
    const values = { name: card.querySelector(".scenario-name").value };
    card.querySelectorAll("[data-field]").forEach((field) => {
      values[field.dataset.field] = field.querySelector("input").value;
    });
    return values;
  }

  function setDefaults(id) {
    const card = cards.get(id);
    card.querySelector(".scenario-name").value = core.defaults[id].name;
    card.querySelectorAll("[data-field]").forEach((field) => {
      field.querySelector("input").value = core.defaults[id][field.dataset.field];
    });
  }

  function renderScenario(id, notify = false) {
    const card = cards.get(id);
    const state = core.calculate(inputValues(card));
    states.set(id, state);
    card.classList.toggle("has-errors", !state.valid);
    card.querySelector(".scenario-validation").hidden = state.valid;
    card.querySelectorAll("[data-field]").forEach((field) => {
      const input = field.querySelector("input");
      const error = field.querySelector(".field-error");
      const message = state.errors[field.dataset.field];
      input.setAttribute("aria-invalid", String(Boolean(message)));
      error.textContent = message || "";
      error.hidden = !message;
    });
    const set = (key, value) => { card.querySelector(`[data-result="${key}"]`).textContent = value; };
    const landBar = card.querySelector(".land-bar");
    landBar.replaceChildren();
    if (state.valid) {
      set("gross", core.acreage.format(state.gross));
      set("taxableRate", core.money.format(state.taxableRate));
      set("grossRate", core.money.format(state.grossRate));
      set("share", core.formatPercent(state.taxableShare));
      set("reduction", state.reduction == null ? "N/A — zero measured value" : state.reduction === 0 ? "0.0% difference" : `${core.formatPercent(state.reduction)} lower`);
      set("explanation", state.reduction == null ? "Both rates are $0; the percentage is undefined." : state.reduction === 0 ? "Taxable and gross acreage are the same." : "Using gross acreage, relative to taxable-acre value.");
      core.landKeys.forEach((key) => {
        if (state.values[key] === 0) return;
        const segment = document.createElement("span");
        segment.className = `land-segment segment-${key}`;
        segment.style.width = `${state.values[key] / state.gross * 100}%`;
        segment.title = `${core.fields[key].label}: ${core.acreage.format(state.values[key])} acres`;
        landBar.appendChild(segment);
      });
      landBar.setAttribute("aria-label", `Acreage composition. ${core.landKeys.map((key) => `${core.fields[key].label}: ${core.acreage.format(state.values[key])} acres`).join("; ")}.`);
    } else {
      ["gross", "taxableRate", "grossRate", "share", "reduction"].forEach((key) => set(key, "—"));
      set("explanation", "Results appear when all inputs are valid.");
      landBar.setAttribute("aria-label", "Acreage composition unavailable until inputs are valid.");
    }
    if (notify) announce(state.valid ? `Scenario ${id.toUpperCase()} updated. Gross acreage ${core.acreage.format(state.gross)} acres. Value per taxable acre ${core.money.format(state.taxableRate)}. Value per gross acre ${core.money.format(state.grossRate)}. Reduction ${core.formatPercent(state.reduction)}.` : `Scenario ${id.toUpperCase()} has ${Object.keys(state.errors).length} input errors. Correct the highlighted fields.`);
  }

  function renderComparison() {
    ["a", "b"].forEach((id) => {
      const state = states.get(id);
      document.querySelector(`#compare-name-${id}`).textContent = cards.get(id).querySelector(".scenario-name").value.trim() || "Untitled scenario";
      const values = state.valid ? {
        value: core.money.format(state.values.value),
        taxable: core.acreage.format(state.values.taxable),
        gross: core.acreage.format(state.gross),
        taxableRate: core.money.format(state.taxableRate),
        grossRate: core.money.format(state.grossRate),
        reduction: core.formatPercent(state.reduction)
      } : {};
      document.querySelectorAll(`[data-compare^="${id}-"]`).forEach((cell) => {
        cell.textContent = state.valid ? values[cell.dataset.compare.slice(2)] : "—";
      });
    });
    const a = states.get("a");
    const b = states.get("b");
    const valid = a.valid && b.valid;
    copyButton.disabled = !valid;
    copyButton.title = valid ? "Copy both scenarios, formulas, and the boundary caveat" : "Correct the highlighted inputs in both scenarios before copying";
    const reading = document.querySelector("#comparison-reading");
    if (!valid) reading.textContent = "Correct the highlighted inputs to compare both scenarios and copy a complete summary.";
    else if (a.taxableRate === b.taxableRate && a.grossRate !== b.grossRate) reading.textContent = `Both scenarios report ${core.money.format(a.taxableRate)} per taxable acre. Counting the whole development changes that to ${core.money.format(a.grossRate)} per gross acre for A and ${core.money.format(b.grossRate)} for B.`;
    else reading.textContent = `Using gross development acreage, Scenario A reports ${core.money.format(a.grossRate)} per acre and Scenario B reports ${core.money.format(b.grossRate)} per acre. Read each row across using a consistent boundary definition.`;
  }

  function createScenario(id) {
    const card = document.querySelector("#scenario-template").content.firstElementChild.cloneNode(true);
    const letter = id.toUpperCase();
    card.id = `scenario-${id}`;
    card.dataset.scenario = id;
    card.setAttribute("aria-labelledby", `scenario-${id}-heading`);
    const heading = card.querySelector(".scenario-label");
    heading.id = `scenario-${id}-heading`;
    heading.textContent = `Scenario ${letter}`;
    const nameInput = card.querySelector(".scenario-name");
    nameInput.id = `${id}-name`;
    nameInput.name = `${id}-name`;
    const nameLabel = card.querySelector(".name-label");
    nameLabel.htmlFor = nameInput.id;
    nameLabel.textContent = `Scenario ${letter} name`;
    card.querySelector(".inputs-legend").textContent = `Scenario ${letter} value and acreage`;
    card.querySelector("fieldset").setAttribute("aria-describedby", "land-guidance");
    card.querySelectorAll("[data-field]").forEach((field) => {
      const key = field.dataset.field;
      const input = field.querySelector("input");
      const error = field.querySelector(".field-error");
      input.id = `${id}-${key}`;
      input.name = input.id;
      error.id = `${input.id}-error`;
      field.querySelector("label").htmlFor = input.id;
      const units = document.createElement("span");
      units.className = "sr-only";
      units.textContent = key === "value" ? " in US dollars" : " in acres";
      field.querySelector("label").appendChild(units);
      input.setAttribute("aria-describedby", error.id);
      input.addEventListener("blur", () => {
        const parsed = core.parseField(input.value, key);
        if (!parsed.error) input.value = new Intl.NumberFormat("en-US", { maximumFractionDigits: core.fields[key].decimals }).format(parsed.value);
      });
    });
    card.querySelectorAll("output").forEach((output) => {
      output.setAttribute("for", Object.keys(core.fields).map((key) => `${id}-${key}`).join(" "));
      // Announce one concise update, rather than each changing output separately.
      output.setAttribute("aria-live", "off");
    });
    const reset = card.querySelector(".reset-scenario");
    reset.setAttribute("aria-label", `Reset Scenario ${letter}`);
    reset.addEventListener("click", () => {
      dismissSummary();
      setDefaults(id);
      renderScenario(id, true);
      renderComparison();
      actionStatus.textContent = `Scenario ${letter} restored to its illustrative example.`;
    });
    card.addEventListener("input", () => {
      dismissSummary();
      renderScenario(id, true);
      renderComparison();
    });
    cards.set(id, card);
    document.querySelector("#scenarios").appendChild(card);
    setDefaults(id);
    renderScenario(id);
  }

  ["a", "b"].forEach(createScenario);
  renderComparison();

  document.querySelector("#reset-all").addEventListener("click", () => {
    dismissSummary();
    ["a", "b"].forEach((id) => { setDefaults(id); renderScenario(id); });
    renderComparison();
    clearTimeout(announcement);
    actionStatus.textContent = "Both scenarios restored to their illustrative examples.";
  });

  copyButton.addEventListener("click", async () => {
    const text = core.summary([states.get("a"), states.get("b")]);
    if (!text) return;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      actionStatus.textContent = "Copied both scenarios, formulas, and the boundary caveat.";
      manualCopy.hidden = true;
    } catch (_) {
      summaryText.value = text;
      manualCopy.hidden = false;
      summaryText.focus();
      summaryText.select();
      actionStatus.textContent = "Automatic copy is unavailable. The summary below is selected and ready to copy.";
    }
  });
  document.querySelector("#close-copy").addEventListener("click", () => { dismissSummary(); copyButton.focus(); });
})();
