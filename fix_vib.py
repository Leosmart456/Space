import sys
content = open("artifacts/spacex-platform/src/components/mobile/MobileApp.tsx").read()

replacements = [
    ('onClick={onClick}', 'onClick={onClick ? () => { vib(); onClick(); } : undefined}'),
    ('onClick={onBack}', 'onClick={() => { vib(); onBack(); }}'),
    ('onClick={() => onChange(!checked)}', 'onClick={() => { vib(); onChange(!checked); }}'),
    ('onClick={() => toast({ title: doc.name, description: "Contact support@spacexrocket.space to receive this document." })}', 'onClick={() => { vib(); toast({ title: doc.name, description: "Contact support@spacexrocket.space to receive this document." }); }}'),
    ('onClick={() => { window.open("mailto:support@spacexrocket.space?subject=Document%20Request", "_blank", "noopener,noreferrer"); }}', 'onClick={() => { vib(); window.open("mailto:support@spacexrocket.space?subject=Document%20Request", "_blank", "noopener,noreferrer"); }}'),
    ('onClick={() => toast({ title: "Password Reset", description: "A password reset link has been sent to your email." })}', 'onClick={() => { vib(); toast({ title: "Password Reset", description: "A password reset link has been sent to your email." }); }}'),
    ('onClick={btn.action} glow={btn.label === "Live Chat"}', 'onClick={() => { vib(); btn.action(); }} glow={btn.label === "Live Chat"}'),
    ('onClick={() => setOpen(open === i ? null : i)}', 'onClick={() => { vib(); setOpen(open === i ? null : i); }}'),
    ('onClick={item.action}', 'onClick={() => { vib(); item.action(); }}'),
    ('onClick={() => window.open("mailto:support@spacexrocket.space?subject=Accreditation%20Inquiry", "_blank", "noopener,noreferrer")}', 'onClick={() => { vib(); window.open("mailto:support@spacexrocket.space?subject=Accreditation%20Inquiry", "_blank", "noopener,noreferrer"); }}'),
    ('onClick={isOrder ? () => { onNavigateToOrder(n.purchaseId!); } : undefined}', 'onClick={isOrder ? () => { vib(); onNavigateToOrder(n.purchaseId!); } : undefined}'),
    ('onClick={() => onSubPage("notifications")}', 'onClick={() => { vib(); onSubPage("notifications"); }}'),
    ('onClick={() => onNavigate("buy")}', 'onClick={() => { vib(12); onNavigate("buy"); }}'),
    ('onClick={() => onNavigate("portfolio")}', 'onClick={() => { vib(); onNavigate("portfolio"); }}'),
    ('onClick={onGoTransfer}', 'onClick={() => { vib(); onGoTransfer(); }}'),
    ('onClick={() => onOpenOrder?.(p.id)}', 'onClick={() => { vib(); onOpenOrder?.(p.id); }}'),
    ('onClick={(item as any).url ? () => window.open((item as any).url, "_blank", "noopener,noreferrer") : undefined}', 'onClick={(item as any).url ? () => { vib(); window.open((item as any).url, "_blank", "noopener,noreferrer"); } : undefined}'),
    ('onClick={() => setPeriod(p.label)}', 'onClick={() => { vib(); setPeriod(p.label); }}'),
    ('onClick={() => onSubPage("accredited")}', 'onClick={() => { vib(); onSubPage("accredited"); }}'),
    ('onClick={() => setHistTab(t)}', 'onClick={() => { vib(); setHistTab(t); }}'),
    ('onClick={() => setSuccess(false)}', 'onClick={() => { vib(12); setSuccess(false); }}'),
    ('onClick={() => setRawAmt(p.toLocaleString("en-US"))}', 'onClick={() => { vib(); setRawAmt(p.toLocaleString("en-US")); }}'),
    ('onClick={() => setAgreed(v => !v)}', 'onClick={() => { vib(); setAgreed(v => !v); }}'),
    ('onClick={() => isValid && setShowReview(true)} disabled={!isValid}', 'onClick={() => { if (isValid) { vib(); setShowReview(true); } }} disabled={!isValid}'),
    ('onClick={handleConfirm}', 'onClick={() => { vib(12); handleConfirm(); }}'),
    ('onClick={() => setShowReview(false)}', 'onClick={() => { vib(); setShowReview(false); }}'),
    ('onClick={() => editing ? handleSave() : (setFullName(user?.fullName ?? ""), setPhone(user?.phone ?? ""), setEditing(true))}', 'onClick={() => { vib(12); editing ? handleSave() : (setFullName(user?.fullName ?? ""), setPhone(user?.phone ?? ""), setEditing(true)); }}'),
    ('onClick={() => fileInputRef.current?.click()}', 'onClick={() => { vib(); fileInputRef.current?.click(); }}'),
    ('onClick={() => { if (window.confirm("Sign out of your account?")) signOut(); }}', 'onClick={() => { vib(); if (window.confirm("Sign out of your account?")) signOut(); }}'),
    ('onClick={() => setActiveCategory(cat)}', 'onClick={() => { vib(); setActiveCategory(cat); }}'),
    ('onClick={() => { setRefreshKey(k => k + 1); refetch(); }}', 'onClick={() => { vib(); setRefreshKey(k => k + 1); refetch(); }}'),
    ('onClick={() => (tab.id === "transfer" ? goToTransfer() : navigate(tab.id))}', 'onClick={() => { vib(); tab.id === "transfer" ? goToTransfer() : navigate(tab.id); }}'),
]

for old, new in replacements:
    content = content.replace(old, new)

open("artifacts/spacex-platform/src/components/mobile/MobileApp.tsx", "w").write(content)
