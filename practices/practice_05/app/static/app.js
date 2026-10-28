"use strict";
const $ = (id) => document.getElementById(id);
let loading = false;
let config = { timeout_seconds: 10, max_diff_chars: 20000 };
const labels = { idle: "Готово к проверке", loading: "Выполняется ревью…", success: "Ревью завершено", timeout: "Таймаут LLM", error: "Ошибка запроса" };
const count = () => Array.from($("diff").value).length;
function setState(state, message = "") {
  $("review-state").dataset.state = state;
  $("review-state").setAttribute("aria-busy", String(state === "loading"));
  $("state-label").textContent = labels[state];
  $("status").textContent = message || labels[state];
  $("result").hidden = true;
  $("error").hidden = true;
  $("retry").hidden = !["timeout", "error"].includes(state);
  $("request-id").hidden = true;
}
function showError(state, message) {
  setState(state);
  $("error").textContent = message;
  $("error").hidden = false;
}
function renderReview(data) {
  if (typeof data.summary !== "string" || !Array.isArray(data.risks) || data.risks.length > 3 || !Array.isArray(data.checks) || !data.checks.every(x => typeof x === "string")) {
    throw new Error("invalid_response");
  }
  setState("success");
  $("summary").textContent = data.summary;
  $("risks").replaceChildren();
  $("checks").replaceChildren();
  const add = (parent, text) => { const li = document.createElement("li"); li.textContent = text; parent.append(li); };
  if (!data.risks.length) add($("risks"), "Подтверждённых рисков нет.");
  data.risks.forEach(risk => add($("risks"), `${risk.file}:${risk.line} — ${risk.risk}. Основание: ${risk.evidence}`));
  data.checks.forEach(check => add($("checks"), check));
  $("result").hidden = false;
}
async function submitReview() {
  if (loading) return;
  const diff = $("diff").value;
  if (!diff.trim()) { showError("error", "Вставьте непустой diff."); return; }
  if (count() > config.max_diff_chars) { showError("error", "Diff превышает лимит 20 000 символов."); return; }
  loading = true;
  $("submit").disabled = true;
  $("retry").disabled = true;
  $("diff").readOnly = true;
  $("scenario").disabled = true;
  setState("loading");
  const start = performance.now();
  const updateElapsed = () => { $("elapsed").textContent = `${((performance.now() - start) / 1000).toFixed(1)} с`; };
  updateElapsed();
  const ticker = setInterval(updateElapsed, 100);
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Demo-Scenario": $("scenario").value },
      body: JSON.stringify({ diff }), signal: controller.signal,
    });
    const data = await response.json();
    if (response.ok) renderReview(data);
    else {
      const state = response.status === 504 && data.error?.code === "llm_timeout" ? "timeout" : "error";
      showError(state, typeof data.error?.message === "string" ? data.error.message : "Сервис вернул ошибку. Повторите запрос.");
    }
    const requestId = response.headers.get("X-Request-ID");
    if (requestId) { $("request-id").textContent = `Запрос: ${requestId}`; $("request-id").hidden = false; }
  } catch (error) {
    const message = error.name === "AbortError" ? "Нет ответа сервиса за 15 секунд. Проверьте соединение и повторите запрос." : "Не удалось получить корректный ответ сервиса. Проверьте соединение и повторите запрос.";
    showError("error", message);
  } finally {
    clearTimeout(deadline);
    clearInterval(ticker);
    updateElapsed();
    loading = false;
    $("submit").disabled = false;
    $("retry").disabled = false;
    $("diff").readOnly = false;
    $("scenario").disabled = false;
  }
}
$("diff").addEventListener("input", () => { $("counter").textContent = `${count().toLocaleString("ru-RU")} / 20 000`; });
$("review-form").addEventListener("submit", event => { event.preventDefault(); submitReview(); });
$("retry").addEventListener("click", submitReview);
fetch("/api/config").then(response => response.json()).then(data => {
  config = data;
  $("scenario").querySelector('[value="slow"]').textContent = `Таймаут LLM · ${data.timeout_seconds} секунд`;
}).catch(() => showError("error", "Сервис недоступен. Запустите его и обновите страницу."));
