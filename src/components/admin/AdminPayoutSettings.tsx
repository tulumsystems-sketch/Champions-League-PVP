"use client";

import { useEffect, useState, type FormEvent } from "react";

import { getPayoutSettings, updatePayoutSettings, type PayoutSettings } from "@/lib/economy";

const emptySettings: PayoutSettings = {
  ars: { bank: "", cvu: "", alias: "", note: "" },
  usdt: { network: "TRC20 (Tron)", address: "", note: "" },
};

export function AdminPayoutSettings() {
  const [settings, setSettings] = useState<PayoutSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    getPayoutSettings()
      .then(setSettings)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el cobro."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await updatePayoutSettings(settings);
      setOk("Datos de cobro actualizados. Los jugadores los ven en Wallet.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="arena-panel p-5">
      <h2 className="text-xl font-black text-white">Datos de cobro</h2>
      <p className="mt-1 text-xs text-neutral-500">CBU/CVU/alias y wallet USDT que ve el jugador al recargar. Reemplazá los placeholders.</p>
      {loading ? (
        <p className="mt-4 text-sm text-neutral-400">Cargando...</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-white">ARS</legend>
            <input value={settings.ars.bank} onChange={(event) => setSettings({ ...settings, ars: { ...settings.ars, bank: event.target.value } })} placeholder="Banco / Mercado Pago" className={inputClass} />
            <input value={settings.ars.cvu} onChange={(event) => setSettings({ ...settings, ars: { ...settings.ars, cvu: event.target.value } })} placeholder="CVU / CBU" className={inputClass} />
            <input value={settings.ars.alias} onChange={(event) => setSettings({ ...settings, ars: { ...settings.ars, alias: event.target.value } })} placeholder="Alias" className={inputClass} />
            <textarea value={settings.ars.note} onChange={(event) => setSettings({ ...settings, ars: { ...settings.ars, note: event.target.value } })} placeholder="Nota" className={`${inputClass} min-h-20`} />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-white">USDT</legend>
            <input value={settings.usdt.network} onChange={(event) => setSettings({ ...settings, usdt: { ...settings.usdt, network: event.target.value } })} placeholder="Red" className={inputClass} />
            <input value={settings.usdt.address} onChange={(event) => setSettings({ ...settings, usdt: { ...settings.usdt, address: event.target.value } })} placeholder="Address" className={inputClass} />
            <textarea value={settings.usdt.note} onChange={(event) => setSettings({ ...settings, usdt: { ...settings.usdt, note: event.target.value } })} placeholder="Nota" className={`${inputClass} min-h-20`} />
          </fieldset>
          {error && <p className="text-sm text-red-300 md:col-span-2">{error}</p>}
          {ok && <p className="text-sm text-emerald-300 md:col-span-2">{ok}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60 md:col-span-2">
            {saving ? "Guardando..." : "Guardar datos de cobro"}
          </button>
        </form>
      )}
    </section>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none";
