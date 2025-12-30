"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/lib/actions";
import { User, Lock, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfileSettings({ user }: { user: any }) {
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        username: user?.username || ""
    });

    const [passData, setPassData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMsg(null);

        const formData = new FormData();
        formData.append("name", profileData.name);
        formData.append("username", profileData.username);

        try {
            const res = await updateProfile(formData);
            if (res.success) {
                setProfileMsg({ type: 'success', text: "Perfil actualizado correctamente." });
            } else {
                setProfileMsg({ type: 'error', text: res.error as string });
            }
        } catch (error) {
            setProfileMsg({ type: 'error', text: "Error al actualizar perfil." });
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingPassword(true);
        setPassMsg(null);

        const formData = new FormData();
        formData.append("currentPassword", passData.currentPassword);
        formData.append("newPassword", passData.newPassword);
        formData.append("confirmPassword", passData.confirmPassword);

        try {
            const res = await changePassword(formData);
            if (res.success) {
                setPassMsg({ type: 'success', text: "Contraseña cambiada correctamente." });
                setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setPassMsg({ type: 'error', text: res.error as string });
            }
        } catch (error) {
            setPassMsg({ type: 'error', text: "Error al cambiar contraseña." });
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <section className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <User className="w-6 h-6 text-purple-600" />
                    Mi Perfil
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Actualiza tus datos básicos.</p>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario</label>
                        <input
                            type="text"
                            value={profileData.username}
                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loadingProfile}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        {loadingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar cambios
                    </button>

                    {profileMsg && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${profileMsg.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                                : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:border-red-800'
                            }`}>
                            {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {profileMsg.text}
                        </div>
                    )}
                </form>
            </div>

            {/* Password */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Lock className="w-6 h-6 text-amber-600" />
                    Cambiar Contraseña
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Asegura tu cuenta con una contraseña fuerte.</p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña actual</label>
                        <input
                            type="password"
                            value={passData.currentPassword}
                            onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
                            <input
                                type="password"
                                value={passData.newPassword}
                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nueva</label>
                            <input
                                type="password"
                                value={passData.confirmPassword}
                                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loadingPassword}
                        className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Actualizar contraseña
                    </button>

                    {passMsg && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${passMsg.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                                : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:border-red-800'
                            }`}>
                            {passMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {passMsg.text}
                        </div>
                    )}
                </form>
            </div>
        </section>
    );
}
