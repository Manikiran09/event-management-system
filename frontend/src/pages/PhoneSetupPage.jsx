import { useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { clearRuntimeApiBaseUrl, getConfiguredApiBaseUrl, setRuntimeApiBaseUrl } from "../api";

const normalizePreviewUrl = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\/$/, "");
};

const PhoneSetupPage = () => {
  const [apiUrlInput, setApiUrlInput] = useState(getConfiguredApiBaseUrl());
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const [busy, setBusy] = useState(false);

  const activeUrl = useMemo(() => getConfiguredApiBaseUrl(), [status]);

  const setMessage = (message, tone = "neutral") => {
    setStatus(message);
    setStatusTone(tone);
  };

  const handleSave = () => {
    const saved = setRuntimeApiBaseUrl(apiUrlInput);

    if (!saved) {
      setMessage("Invalid URL. Enter your Railway backend domain (with or without /api).", "error");
      return;
    }

    setApiUrlInput(saved);
    setMessage(`Saved API URL for this phone: ${saved}`, "success");
  };

  const handleReset = () => {
    clearRuntimeApiBaseUrl();
    const fallback = getConfiguredApiBaseUrl();
    setApiUrlInput(fallback);
    setMessage(`Cleared saved API URL. Active fallback is now ${fallback}`, "success");
  };

  const handleTest = async () => {
    const normalized = setRuntimeApiBaseUrl(apiUrlInput);

    if (!normalized) {
      setMessage("Cannot test. Enter a valid backend URL first.", "error");
      return;
    }

    setBusy(true);
    setMessage("Testing backend connection from this phone...", "neutral");

    try {
      const response = await axios.get(`${normalizePreviewUrl(normalized)}/health`, { timeout: 12000 });
      const serverStatus = response.data?.status || "ok";
      setMessage(`Connection successful. Backend status: ${serverStatus}.`, "success");
    } catch {
      setMessage("Connection failed. Verify Railway URL and that backend is deployed and healthy.", "error");
    } finally {
      setBusy(false);
    }
  };

  const statusClass =
    statusTone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : statusTone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <main className="grid min-h-[100dvh] place-items-center px-3 py-6 sm:px-4 md:py-10">
      <section className="w-full max-w-xl rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-glow backdrop-blur-2xl sm:p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">Phone Setup</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">Configure API For This Device</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use this screen on any phone that cannot sign in. It saves a backend API URL only for this phone browser.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Active API</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-800">{activeUrl || "Not resolved"}</p>
        </div>

        <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" htmlFor="apiUrlInput">
          Railway Backend URL
        </label>
        <input
          id="apiUrlInput"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
          value={apiUrlInput}
          onChange={(event) => setApiUrlInput(event.target.value)}
          placeholder="https://your-service.up.railway.app"
        />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-3 text-sm font-bold text-white"
            onClick={handleSave}
            disabled={busy}
          >
            Save URL
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
            onClick={handleTest}
            disabled={busy}
          >
            {busy ? "Testing..." : "Test Connection"}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            onClick={handleReset}
            disabled={busy}
          >
            Reset URL
          </button>
        </div>

        {status ? <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${statusClass}`}>{status}</div> : null}

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <Link className="font-semibold text-teal-700 underline decoration-teal-400 underline-offset-2" to="/login">
            Back To Login
          </Link>
          <Link className="font-semibold text-slate-700 underline decoration-slate-400 underline-offset-2" to="/register">
            Go To Register
          </Link>
        </div>
      </section>
    </main>
  );
};

export default PhoneSetupPage;
