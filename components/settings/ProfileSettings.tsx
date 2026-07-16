"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { updateProfile, updateCamperPurchasePrice, changePassword } from "@/lib/actions";

function Msg({ type, text }: { type: "success" | "error"; text: string }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: type === "success" ? "var(--success-soft)" : "var(--danger-soft)",
            color: type === "success" ? "var(--success)" : "var(--danger)",
        }}>
            <Icon name={type === "success" ? "check" : "close"} size={14} />
            {text}
        </div>
    );
}

export default function ProfileSettings({ user }: { user: any }) {
    const [loadingProfile, setLoadingProfile]   = useState(false);
    const [loadingCamper, setLoadingCamper]     = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [profileMsg, setProfileMsg]           = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [camperMsg, setCamperMsg]             = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [passMsg, setPassMsg]                 = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [profileData, setProfileData] = useState({ name: user?.name || "", username: user?.username || "" });
    const [camperPurchasePrice, setCamperPurchasePrice] = useState(String(user?.camperPurchasePrice ?? 0));
    const [passData, setPassData]       = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMsg(null);
        const fd = new FormData();
        fd.append("name", profileData.name);
        fd.append("username", profileData.username);
        try {
            const res = await updateProfile(fd);
            setProfileMsg(res.success
                ? { type: "success", text: "Perfil actualizado correctamente." }
                : { type: "error",   text: res.error as string });
        } catch {
            setProfileMsg({ type: "error", text: "Error al actualizar perfil." });
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleCamperSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingCamper(true);
        setCamperMsg(null);
        const fd = new FormData();
        fd.append("camperPurchasePrice", camperPurchasePrice);
        try {
            const res = await updateCamperPurchasePrice(fd);
            setCamperMsg(res.success
                ? { type: "success", text: "Importe de la camper guardado." }
                : { type: "error",   text: res.error as string });
        } catch {
            setCamperMsg({ type: "error", text: "Error al guardar el importe." });
        } finally {
            setLoadingCamper(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingPassword(true);
        setPassMsg(null);
        const fd = new FormData();
        fd.append("currentPassword", passData.currentPassword);
        fd.append("newPassword", passData.newPassword);
        fd.append("confirmPassword", passData.confirmPassword);
        try {
            const res = await changePassword(fd);
            if (res.success) {
                setPassMsg({ type: "success", text: "Contraseña cambiada correctamente." });
                setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setPassMsg({ type: "error", text: res.error as string });
            }
        } catch {
            setPassMsg({ type: "error", text: "Error al cambiar contraseña." });
        } finally {
            setLoadingPassword(false);
        }
    };

    const passwordsMatch = passData.newPassword.length > 0 && passData.newPassword === passData.confirmPassword;
    const passwordLong   = passData.newPassword.length >= 8;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── Mi Perfil ── */}
            <section style={{ background: "var(--surface)", borderRadius: 20, padding: "20px 20px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon name="user" size={18} style={{ color: "var(--primary)" }} />
                    <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                        Mi Perfil
                    </h2>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Actualiza tus datos básicos.</p>

                <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                        <label className="label" htmlFor="p-name">Nombre</label>
                        <input
                            id="p-name" type="text" className="input"
                            value={profileData.name}
                            onChange={e => setProfileData(d => ({ ...d, name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="p-username">Usuario</label>
                        <input
                            id="p-username" type="text" className="input"
                            value={profileData.username}
                            onChange={e => setProfileData(d => ({ ...d, username: e.target.value }))}
                        />
                    </div>
                    <button type="submit" disabled={loadingProfile} className="btn btn-primary btn-md" style={{ alignSelf: "flex-start", gap: 8 }}>
                        <Icon name="save" size={16} style={{ animation: loadingProfile ? "spin .8s linear infinite" : "none" }} />
                        Guardar cambios
                    </button>
                    {profileMsg && <Msg {...profileMsg} />}
                </form>
            </section>

            {/* ── Camper ── */}
            <section style={{ background: "var(--surface)", borderRadius: 20, padding: "20px 20px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon name="camper" size={19} style={{ color: "var(--primary)" }} />
                    <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                        Camper
                    </h2>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Guarda el importe total pagado para calcular el coste por noche.</p>

                <form onSubmit={handleCamperSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                        <label className="label" htmlFor="p-camper-price">Importe total pagado</label>
                        <input
                            id="p-camper-price" type="number" min="0" step="0.01" inputMode="decimal" className="input"
                            value={camperPurchasePrice}
                            onChange={e => setCamperPurchasePrice(e.target.value)}
                        />
                    </div>
                    <button type="submit" disabled={loadingCamper} className="btn btn-primary btn-md" style={{ alignSelf: "flex-start", gap: 8 }}>
                        <Icon name="save" size={16} style={{ animation: loadingCamper ? "spin .8s linear infinite" : "none" }} />
                        Guardar importe
                    </button>
                    {camperMsg && <Msg {...camperMsg} />}
                </form>
            </section>

            {/* ── Cambiar contraseña ── */}
            <section style={{ background: "var(--surface)", borderRadius: 20, padding: "20px 20px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon name="lock" size={18} style={{ color: "var(--warning)" }} />
                    <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                        Cambiar contraseña
                    </h2>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Usa una contraseña que no utilices en otros sitios.</p>

                <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                        <label className="label" htmlFor="p-curr">Contraseña actual</label>
                        <input
                            id="p-curr" type="password" className="input" placeholder="Tu contraseña actual"
                            value={passData.currentPassword}
                            onChange={e => setPassData(d => ({ ...d, currentPassword: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="p-new">Nueva contraseña</label>
                        <input
                            id="p-new" type="password" className="input" placeholder="Mínimo 8 caracteres"
                            value={passData.newPassword}
                            onChange={e => setPassData(d => ({ ...d, newPassword: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="p-conf">Repetir nueva contraseña</label>
                        <input
                            id="p-conf" type="password" className="input" placeholder="Vuelve a escribirla"
                            value={passData.confirmPassword}
                            onChange={e => setPassData(d => ({ ...d, confirmPassword: e.target.value }))}
                        />
                    </div>

                    {/* Hints de validación */}
                    {passData.newPassword.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {[
                                { ok: passwordLong,   text: "Al menos 8 caracteres" },
                                { ok: passwordsMatch, text: "Las dos contraseñas coinciden" },
                            ].map(h => (
                                <div key={h.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: h.ok ? "var(--success)" : "var(--faint)" }}>
                                    <Icon name={h.ok ? "check" : "close"} size={12} />
                                    {h.text}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loadingPassword || !passwordLong || !passwordsMatch}
                        className="btn btn-primary btn-md"
                        style={{ alignSelf: "flex-start", gap: 8 }}
                    >
                        <Icon name="lock" size={16} style={{ animation: loadingPassword ? "spin .8s linear infinite" : "none" }} />
                        Actualizar contraseña
                    </button>
                    {passMsg && <Msg {...passMsg} />}
                </form>
            </section>
        </div>
    );
}
