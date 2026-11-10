const appActivityKey = "surgeai-app-activity";
const activityRetention = 7 * 24 * 60 * 60 * 1000;

function recordAppActivity(app, title, detail) {
  const history = JSON.parse(localStorage.getItem(appActivityKey) || "[]");
  if (!Array.isArray(history)) throw new Error("Recent app activity is invalid.");
  const cutoff = Date.now() - activityRetention;
  const recent = history.filter((entry) =>
    entry &&
    typeof entry.timestamp === "string" &&
    Date.parse(entry.timestamp) >= cutoff,
  );
  recent.unshift({ app, title, detail, timestamp: new Date().toISOString() });
  localStorage.setItem(appActivityKey, JSON.stringify(recent));
  window.dispatchEvent(new CustomEvent("surgeai:activity-updated"));
}

function setupCurrencyConverter() {
  const amountInput = document.querySelector("#amount");
  const baseSelect = document.querySelector("#base");
  const quoteSelect = document.querySelector("#quote");
  const output = document.querySelector("#converted");
  const rateLabel = document.querySelector("#rate");
  const status = document.querySelector("#status");
  const refresh = document.querySelector("#refresh");
  const saveButton = document.querySelector("#save-conversion");
  let rate = null;
  let rateDate = "";
  let requestId = 0;
  let controller = null;

  function renderAmount() {
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount < 0 || rate === null) {
      output.textContent = "—";
      saveButton.disabled = true;
      return;
    }
    saveButton.disabled = false;
    output.textContent = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: quoteSelect.value,
      maximumFractionDigits: 4,
    }).format(amount * rate);
  }

  async function loadRate() {
    const base = baseSelect.value;
    const quote = quoteSelect.value;
    const currentRequest = ++requestId;
    if (controller) controller.abort();

    if (base === quote) {
      rate = 1;
      rateDate = "same currency";
      refresh.disabled = false;
      rateLabel.textContent = `1 ${base} = 1 ${quote}`;
      status.textContent = "No conversion needed.";
      renderAmount();
      return;
    }

    controller = new AbortController();
    status.textContent = "Loading the latest available rate…";
    refresh.disabled = true;
    try {
      const url = new URL("https://api.frankfurter.dev/v1/latest");
      url.searchParams.set("base", base);
      url.searchParams.set("symbols", quote);
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Currency rate request failed (${response.status}).`);
      const data = await response.json();
      const nextRate = data.rates && data.rates[quote];
      if (currentRequest !== requestId) return;
      if (!Number.isFinite(nextRate) || !data.date) {
        throw new Error("The currency service returned an invalid rate.");
      }
      rate = nextRate;
      rateDate = data.date;
      rateLabel.textContent = `1 ${base} = ${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 7 }).format(rate)} ${quote}`;
      status.textContent = `Reference rate dated ${rateDate}. Rates are usually updated each business day.`;
      renderAmount();
    } catch (error) {
      if (error.name === "AbortError") return;
      rate = null;
      rateLabel.textContent = "Rate unavailable";
      output.textContent = "—";
      saveButton.disabled = true;
      status.textContent = "Could not load a rate. Check your connection and try again.";
    } finally {
      if (currentRequest === requestId) refresh.disabled = false;
    }
  }

  amountInput.addEventListener("input", renderAmount);
  baseSelect.addEventListener("change", loadRate);
  quoteSelect.addEventListener("change", loadRate);
  refresh.addEventListener("click", loadRate);
  saveButton.addEventListener("click", () => {
    if (rate === null || !Number.isFinite(Number(amountInput.value))) return;
    recordAppActivity(
      "currency-converter",
      "Currency Converter",
      `${amountInput.value} ${baseSelect.value} → ${output.textContent} · rate date ${rateDate || "latest"}`,
    );
  });
  loadRate();
}

function setupCalculator() {
  const display = document.querySelector("#display");
  const status = document.querySelector("#status");
  let current = "0";
  let stored = null;
  let operation = null;
  let replaceCurrent = false;

  function show() {
    display.textContent = current;
  }

  function inputDigit(value) {
    if (replaceCurrent || current === "0" || current === "Error") {
      current = value === "." ? "0." : value;
      replaceCurrent = false;
    } else if (value !== "." || !current.includes(".")) {
      current += value;
    }
    status.textContent = "Ready";
    show();
  }

  function calculate(saveActivity = false) {
    if (stored === null || !operation) return;
    const left = stored;
    const right = Number(current);
    const expression = `${left} ${operation} ${right}`;
    let result;
    if (operation === "+") result = left + right;
    if (operation === "−") result = left - right;
    if (operation === "×") result = left * right;
    if (operation === "÷") result = right === 0 ? NaN : left / right;
    if (!Number.isFinite(result)) {
      current = "Error";
      status.textContent = right === 0 && operation === "÷" ? "Cannot divide by zero." : "That result is outside the calculator range.";
    } else {
      current = String(Number(result.toPrecision(12)));
      status.textContent = "Calculated";
      if (saveActivity) recordAppActivity("calculator", "Calculator", `${expression} = ${current}`);
    }
    stored = null;
    operation = null;
    replaceCurrent = true;
    show();
  }

  function press(key) {
    if (/^\d$/.test(key) || key === ".") {
      inputDigit(key);
      return;
    }
    if (key === "C") {
      current = "0";
      stored = null;
      operation = null;
      replaceCurrent = false;
      status.textContent = "Cleared";
    } else if (key === "⌫") {
      current = current.length > 1 ? current.slice(0, -1) : "0";
      if (current === "-") current = "0";
    } else if (key === "±") {
      if (current !== "0" && current !== "Error") current = String(-Number(current));
    } else if (key === "%") {
      if (current !== "Error") current = String(Number(current) / 100);
      replaceCurrent = true;
    } else if (["+", "−", "×", "÷"].includes(key)) {
      if (operation && !replaceCurrent) calculate();
      stored = Number(current);
      operation = key;
      replaceCurrent = true;
      status.textContent = `${key} selected`;
    } else if (key === "=") {
      calculate(true);
    }
    show();
  }

  document.querySelector("#keys").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (button) press(button.dataset.key);
  });
  window.addEventListener("keydown", (event) => {
    const keyMap = { "*": "×", "/": "÷", "-": "−", "Enter": "=", "Backspace": "⌫", "Escape": "C" };
    const key = keyMap[event.key] || event.key;
    if (/^\d$/.test(key) || [".", "+", "−", "×", "÷", "=", "⌫", "C"].includes(key)) {
      event.preventDefault();
      press(key);
    }
  });
  show();
}

function setupLandMapper() {
  const status = document.querySelector("#status");
  const areaOutput = document.querySelector("#area");
  const perimeterOutput = document.querySelector("#perimeter");
  const areaUnit = document.querySelector("#area-unit");
  const clearButton = document.querySelector("#clear");
  const finishButton = document.querySelector("#finish");
  const locateButton = document.querySelector("#locate");
  const countLabel = document.querySelector("#point-count");
  const earthRadius = 6371008.8;
  const points = [];
  if (!window.L) {
    status.textContent = "The map library could not load. Check your connection and reload this app.";
    locateButton.disabled = true;
    finishButton.disabled = true;
    clearButton.disabled = true;
    return;
  }
  const markers = L.layerGroup();
  const map = L.map("map", { doubleClickZoom: false }).setView([20.5937, 78.9629], 5);
  const boundary = L.polygon([], { color: "#e5aa4f", weight: 3, fillColor: "#e5aa4f", fillOpacity: .2 });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  markers.addTo(map);
  boundary.addTo(map);

  function distance(a, b) {
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const deltaLat = lat2 - lat1;
    const deltaLon = toRadians(b.lng - a.lng);
    const term = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return 2 * earthRadius * Math.atan2(Math.sqrt(term), Math.sqrt(1 - term));
  }

  function polygonArea() {
    let sum = 0;
    for (let index = 0; index < points.length; index += 1) {
      const currentPoint = points[index];
      const nextPoint = points[(index + 1) % points.length];
      sum += (nextPoint.lng - currentPoint.lng) * Math.PI / 180 *
        (2 + Math.sin(currentPoint.lat * Math.PI / 180) + Math.sin(nextPoint.lat * Math.PI / 180));
    }
    return Math.abs(sum * earthRadius * earthRadius / 2);
  }

  function renderMeasurements() {
    countLabel.textContent = `${points.length} corners`;
    if (points.length < 3) {
      areaOutput.textContent = "Add at least 3 corners";
      perimeterOutput.textContent = "—";
      return;
    }

    const squareMetres = polygonArea();
    const unit = areaUnit.value;
    const area = unit === "ha" ? squareMetres / 10000 : unit === "acre" ? squareMetres / 4046.8564224 : squareMetres;
    const perimeter = points.reduce((total, point, index) => total + distance(point, points[(index + 1) % points.length]), 0);
    areaOutput.textContent = `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(area)} ${unit === "ha" ? "ha" : unit === "acre" ? "acres" : "m²"}`;
    perimeterOutput.textContent = `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(perimeter)} m`;
  }

  function addPoint(point) {
    points.push(point);
    markers.addLayer(L.marker(point).bindTooltip(`Corner ${points.length}`));
    boundary.setLatLngs(points);
    if (points.length >= 3) status.textContent = "Boundary updated. Add another corner or finish the plot.";
    else status.textContent = "Add at least three corners to calculate the plot.";
    renderMeasurements();
  }

  map.on("click", (event) => addPoint(event.latlng));
  areaUnit.addEventListener("change", renderMeasurements);
  clearButton.addEventListener("click", () => {
    points.length = 0;
    markers.clearLayers();
    boundary.setLatLngs([]);
    status.textContent = "Boundary cleared. Click the map to add corners.";
    renderMeasurements();
  });
  finishButton.addEventListener("click", () => {
    if (points.length < 3) {
      status.textContent = "Add at least three corners before finishing the plot.";
      return;
    }
    boundary.setLatLngs(points);
    status.textContent = "Plot closed. Area and perimeter are calculated on this device.";
    renderMeasurements();
    recordAppActivity(
      "land-mapper",
      "Land Mapper",
      `${areaOutput.textContent} · ${perimeterOutput.textContent} perimeter · ${points.length} corners`,
    );
  });
  locateButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      status.textContent = "This browser does not support device location.";
      return;
    }
    locateButton.disabled = true;
    status.textContent = "Requesting device location…";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = [position.coords.latitude, position.coords.longitude];
        map.setView(center, 17);
        status.textContent = "Map centered on your location. Click to mark plot corners.";
        locateButton.disabled = false;
      },
      (error) => {
        status.textContent = error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. You can still navigate the map manually."
          : "Could not get your location. You can still navigate the map manually.";
        locateButton.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
  renderMeasurements();
}

function setupMeasurementConverter() {
  const categorySelect = document.querySelector("#category");
  const fromSelect = document.querySelector("#from-unit");
  const toSelect = document.querySelector("#to-unit");
  const valueInput = document.querySelector("#value");
  const output = document.querySelector("#result");
  const saveButton = document.querySelector("#save-conversion");
  const groups = {
    length: { label: "Length & height", units: { m: 1, km: 1000, cm: .01, mm: .001, in: .0254, ft: .3048, yd: .9144, mi: 1609.344 } },
    area: { label: "Area", units: { "m²": 1, "km²": 1000000, ha: 10000, acre: 4046.8564224, "ft²": .09290304 } },
    mass: { label: "Mass / everyday weight", units: { kg: 1, g: .001, mg: .000001, tonne: 1000, lb: .45359237, oz: .028349523125 } },
    force: { label: "Weight force", units: { N: 1, kN: 1000, lbf: 4.4482216153 } },
    volume: { label: "Volume", units: { L: 1, mL: .001, "m³": 1000, "US gal": 3.785411784, "US fl oz": .0295735296 } },
    temperature: { label: "Temperature", units: { "°C": 1, "°F": 1, K: 1 } },
  };

  function convertTemperature(value, from, to) {
    const celsius = from === "°F" ? (value - 32) * 5 / 9 : from === "K" ? value - 273.15 : value;
    return to === "°F" ? celsius * 9 / 5 + 32 : to === "K" ? celsius + 273.15 : celsius;
  }

  function render() {
    const value = Number(valueInput.value);
    if (!valueInput.value.trim() || !Number.isFinite(value)) {
      output.textContent = "Enter a number to convert.";
      saveButton.disabled = true;
      return;
    }
    const category = categorySelect.value;
    const from = fromSelect.value;
    const to = toSelect.value;
    const result = category === "temperature"
      ? convertTemperature(value, from, to)
      : value * groups[category].units[from] / groups[category].units[to];
    output.textContent = `${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 10 }).format(result)} ${to}`;
    saveButton.disabled = false;
  }

  function fillUnits() {
    const group = groups[categorySelect.value];
    const unitNames = Object.keys(group.units);
    fromSelect.replaceChildren();
    toSelect.replaceChildren();
    for (const unit of unitNames) {
      fromSelect.add(new Option(unit, unit));
      toSelect.add(new Option(unit, unit));
    }
    fromSelect.selectedIndex = 0;
    toSelect.selectedIndex = unitNames.length > 1 ? 1 : 0;
    render();
  }

  categorySelect.addEventListener("change", fillUnits);
  fromSelect.addEventListener("change", render);
  toSelect.addEventListener("change", render);
  valueInput.addEventListener("input", render);
  saveButton.addEventListener("click", () => {
    recordAppActivity(
      "measurement-converter",
      "Measurement Converter",
      `${valueInput.value} ${fromSelect.value} → ${output.textContent}`,
    );
  });
  fillUnits();
}

function setupCompass() {
  const start = document.querySelector("#start");
  const needle = document.querySelector("#needle");
  const headingLabel = document.querySelector("#heading");
  const status = document.querySelector("#status");
  let listening = false;
  let recordedReading = false;

  function handleOrientation(event) {
    const heading = Number.isFinite(event.webkitCompassHeading)
      ? event.webkitCompassHeading
      : Number.isFinite(event.alpha)
        ? (360 - event.alpha) % 360
        : null;
    if (heading === null) {
      status.textContent = "No compass reading is available. Move to a device with a compass sensor.";
      return;
    }
    const rounded = Math.round(heading);
    needle.style.transform = `rotate(${heading}deg)`;
    headingLabel.textContent = `${rounded}° ${["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(rounded / 45) % 8]}`;
    status.textContent = "Compass is active. Keep your device away from magnets and metal.";
    if (!recordedReading) {
      recordedReading = true;
      recordAppActivity("compass", "Compass", `Compass enabled · ${headingLabel.textContent}`);
    }
  }

  async function startCompass() {
    if (listening) return;
    const orientationApi = window.DeviceOrientationEvent;
    if (!orientationApi) {
      status.textContent = "This browser does not provide a device orientation sensor.";
      return;
    }
    if (typeof orientationApi.requestPermission === "function") {
      try {
        const permission = await orientationApi.requestPermission();
        if (permission !== "granted") {
          status.textContent = "Compass permission was not granted.";
          return;
        }
      } catch {
        status.textContent = "Could not request compass permission.";
        return;
      }
    }
    const eventName = "ondeviceorientationabsolute" in window
      ? "deviceorientationabsolute"
      : "deviceorientation";
    window.addEventListener(eventName, handleOrientation, true);
    listening = true;
    start.disabled = true;
    status.textContent = "Waiting for a compass reading…";
  }

  start.addEventListener("click", startCompass);
}

const app = document.body.dataset.app;
if (app === "currency-converter") setupCurrencyConverter();
if (app === "calculator") setupCalculator();
if (app === "land-mapper") setupLandMapper();
if (app === "measurement-converter") setupMeasurementConverter();
if (app === "compass") setupCompass();
