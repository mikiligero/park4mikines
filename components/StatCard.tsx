import { Icon, type IconName } from "@/components/Icon";

export default function StatCard({ label, value, icon, color }: {
    label: string; value: string | number; icon: IconName; color: string;
}) {
    return (
        <div style={{
            background: "var(--surface)", borderRadius: 18,
            border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
            padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12, background: color,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Icon name={icon} size={20} style={{ color: "#fff" }} />
            </div>
            <div>
                <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0, lineHeight: 1.1 }}>
                    {value}
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 0 0" }}>
                    {label}
                </p>
            </div>
        </div>
    );
}
