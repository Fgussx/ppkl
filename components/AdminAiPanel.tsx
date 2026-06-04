"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, PlugZap, Plus, Save, Trash2, XCircle } from "lucide-react";
import { AI_FEATURES, AI_FEATURE_LABELS } from "@/lib/ai/features";
import type { AiFeature, AiProviderPublic } from "@/types/app";

type FormState = {
  id: string | null;
  name: string;
  base_url: string;
  model: string;
  api_key: string;
  is_active: boolean;
  enabled_features: AiFeature[];
};

type ProviderPreset = {
  id: string;
  label: string;
  name: string;
  base_url: string;
  model: string;
};

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    name: "OpenAI",
    base_url: "https://api.openai.com/v1",
    model: "gpt-4.1-mini"
  },
  {
    id: "gemini",
    label: "Google Gemini",
    name: "Gemini",
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash"
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    name: "OpenRouter",
    base_url: "https://openrouter.ai/api/v1",
    model: "openrouter/free"
  },
  {
    id: "groq",
    label: "Groq",
    name: "Groq",
    base_url: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile"
  }
];

const EMPTY_FORM: FormState = {
  id: null,
  name: "OpenAI",
  base_url: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  api_key: "",
  is_active: true,
  enabled_features: AI_FEATURES
};

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

export function AdminAiPanel() {
  const [providers, setProviders] = useState<AiProviderPublic[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const editingProvider = useMemo(
    () => providers.find((provider) => provider.id === form.id),
    [form.id, providers]
  );

  const selectedPresetId = useMemo(() => {
    const currentBaseUrl = normalizeBaseUrl(form.base_url);
    return (
      PROVIDER_PRESETS.find((preset) => normalizeBaseUrl(preset.base_url) === currentBaseUrl)
        ?.id ?? "custom"
    );
  }, [form.base_url]);

  async function loadProviders() {
    const response = await fetch("/api/admin/ai/providers");
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(body.error ?? "Provider gagal dimuat.");
      return;
    }

    setProviders(body.providers ?? []);
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialProviders() {
      const response = await fetch("/api/admin/ai/providers");
      const body = await response.json().catch(() => ({}));

      if (ignore) {
        return;
      }

      if (!response.ok) {
        setMessage(body.error ?? "Provider gagal dimuat.");
        return;
      }

      setProviders(body.providers ?? []);
    }

    void loadInitialProviders();

    return () => {
      ignore = true;
    };
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyProviderPreset(presetId: string) {
    const preset = PROVIDER_PRESETS.find((item) => item.id === presetId);

    if (!preset) {
      setForm((current) => ({
        ...current,
        name: current.name || "Custom AI",
        base_url: current.base_url || "https://provider.example/v1",
        model: current.model || "model-name"
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      name: preset.name,
      base_url: preset.base_url,
      model: preset.model,
      api_key: ""
    }));
  }

  function toggleFeature(feature: AiFeature) {
    setForm((current) => {
      const exists = current.enabled_features.includes(feature);
      return {
        ...current,
        enabled_features: exists
          ? current.enabled_features.filter((item) => item !== feature)
          : [...current.enabled_features, feature]
      };
    });
  }

  function editProvider(provider: AiProviderPublic) {
    setForm({
      id: provider.id,
      name: provider.name,
      base_url: provider.base_url,
      model: provider.model,
      api_key: "",
      is_active: provider.is_active,
      enabled_features: provider.enabled_features
    });
    setMessage("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setMessage("");
  }

  async function saveProvider(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const switchedProvider =
      editingProvider &&
      normalizeBaseUrl(editingProvider.base_url) !== normalizeBaseUrl(form.base_url) &&
      !form.api_key.trim();

    if (switchedProvider) {
      setMessage("Isi API key baru kalau mengganti base URL provider.");
      setLoading(false);
      return;
    }

    const endpoint = form.id ? `/api/admin/ai/providers/${form.id}` : "/api/admin/ai/providers";
    const method = form.id ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(body.error ?? "Provider gagal disimpan.");
        return;
      }

      setMessage("Provider disimpan.");
      resetForm();
      await loadProviders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Provider gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  async function testProvider(providerId?: string) {
    setTesting(true);
    setMessage("");

    try {
      const payload = providerId
        ? { provider_id: providerId }
        : {
            base_url: form.base_url,
            model: form.model,
            api_key: form.api_key
          };

      const response = await fetch("/api/admin/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));

      setMessage(response.ok ? "Tes koneksi berhasil." : body.error ?? "Tes koneksi gagal.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tes koneksi gagal.");
    } finally {
      setTesting(false);
    }
  }

  async function deleteProvider(id: string) {
    if (!window.confirm("Hapus provider AI ini?")) {
      return;
    }

    const response = await fetch(`/api/admin/ai/providers/${id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(body.error ?? "Provider gagal dihapus.");
      return;
    }

    await loadProviders();
  }

  return (
    <div className="row g-3">
      <div className="col-lg-5">
        <form className="panel" onSubmit={saveProvider}>
          <div className="panel-header d-flex justify-content-between align-items-center">
            <h2 className="h5 mb-0">{form.id ? "Edit Provider" : "Tambah Provider"}</h2>
            <button className="btn btn-outline-secondary btn-sm icon-btn" type="button" onClick={resetForm}>
              <Plus size={16} /> Baru
            </button>
          </div>
          <div className="panel-body">
            <div className="mb-3">
              <label className="form-label" htmlFor="provider-preset">
                Preset provider
              </label>
              <select
                className="form-select"
                id="provider-preset"
                value={selectedPresetId}
                onChange={(event) => applyProviderPreset(event.target.value)}
              >
                {PROVIDER_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom OpenAI-compatible</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="provider-name">
                Nama
              </label>
              <input
                className="form-control"
                id="provider-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="base-url">
                Base URL
              </label>
              <input
                className="form-control"
                id="base-url"
                value={form.base_url}
                onChange={(event) => updateField("base_url", event.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="model">
                Model
              </label>
              <input
                className="form-control"
                id="model"
                value={form.model}
                onChange={(event) => updateField("model", event.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="api-key">
                API key
              </label>
              <input
                className="form-control"
                id="api-key"
                type="password"
                value={form.api_key}
                onChange={(event) => updateField("api_key", event.target.value)}
                placeholder={form.id ? "Kosongkan jika tidak diganti" : ""}
                required={!form.id}
              />
              {editingProvider ? (
                <div className="form-text">API key tersimpan dalam bentuk terenkripsi.</div>
              ) : null}
            </div>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                id="is-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => updateField("is_active", event.target.checked)}
              />
              <label className="form-check-label" htmlFor="is-active">
                Provider aktif
              </label>
            </div>
            <fieldset className="mb-3">
              <legend className="form-label">Fitur aktif</legend>
              <div className="d-grid gap-2">
                {AI_FEATURES.map((feature) => (
                  <label className="form-check" key={feature}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={form.enabled_features.includes(feature)}
                      onChange={() => toggleFeature(feature)}
                    />
                    <span className="form-check-label">{AI_FEATURE_LABELS[feature]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {message ? <div className="alert alert-info py-2">{message}</div> : null}
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-primary icon-btn" type="submit" disabled={loading}>
                <Save size={18} />
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                className="btn btn-outline-primary icon-btn"
                type="button"
                disabled={testing}
                onClick={() => {
                  const canTestSavedProvider =
                    Boolean(form.id) &&
                    !form.api_key &&
                    editingProvider &&
                    normalizeBaseUrl(editingProvider.base_url) === normalizeBaseUrl(form.base_url) &&
                    editingProvider.model === form.model;

                  void testProvider(canTestSavedProvider && form.id ? form.id : undefined);
                }}
              >
                <PlugZap size={18} />
                {testing ? "Testing..." : "Test"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="col-lg-7">
        <div className="panel">
          <div className="panel-header">
            <h2 className="h5 mb-0">Provider tersimpan</h2>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Fitur</th>
                  <th className="text-end">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {providers.length ? (
                  providers.map((provider) => (
                    <tr key={provider.id}>
                      <td>
                        <strong>{provider.name}</strong>
                        <div className="small text-secondary">{provider.base_url}</div>
                      </td>
                      <td>{provider.model}</td>
                      <td>
                        {provider.is_active ? (
                          <span className="badge text-bg-success icon-btn">
                            <CheckCircle2 size={14} /> Aktif
                          </span>
                        ) : (
                          <span className="badge text-bg-secondary icon-btn">
                            <XCircle size={14} /> Nonaktif
                          </span>
                        )}
                      </td>
                      <td>{provider.enabled_features.length}</td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            type="button"
                            disabled={testing}
                            onClick={() => void testProvider(provider.id)}
                          >
                            <PlugZap size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            type="button"
                            onClick={() => editProvider(provider)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            type="button"
                            onClick={() => void deleteProvider(provider.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-center text-secondary py-4" colSpan={5}>
                      Belum ada provider AI.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
