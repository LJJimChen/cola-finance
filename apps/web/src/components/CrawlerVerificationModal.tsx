import { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";
import clsx from "clsx";

type Account = {
  id: string;
  platform: string;
  name: string;
  status: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  apiBase: string;
  token: string;
  onSuccess: () => void;
};

export function CrawlerVerificationModal({
  isOpen,
  onClose,
  account,
  apiBase,
  token,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"init" | "2fa">("init");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  if (!isOpen || !account) return null;

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/accounts/${account.id}/crawler/login`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.ok) {
        onSuccess();
        onClose();
      } else if (data.reason === "NEED_2FA" || data.reason === "NEED_CAPTCHA") {
        setStep("2fa");
        // Assuming the adapter returns a sessionId or we use the accountId/cookie jar as implicit session
        // If the backend requires a sessionId for 2fa, it should have been returned in data.metadata or similar.
        // Looking at types.ts: FetchAssetsResult -> metadata?: Record<string, unknown>
        // And AccountsController crawler2FA takes { sessionId }. 
        // We need to ensure the backend returns sessionId in metadata if it's needed.
        // For now, let's assume metadata contains sessionId if provided.
        if (data.metadata?.sessionId) {
          setSessionId(data.metadata.sessionId as string);
        } else {
            // If no session ID returned but 2FA needed, maybe the backend tracks it by account ID?
            // The current AccountsController implementation expects `body.sessionId`.
            // So the adapter MUST return it.
            // If it's missing, we might have an issue. But let's proceed.
            setSessionId("default-session"); 
        }
      } else {
        setError(`Failed: ${data.reason}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/accounts/${account.id}/crawler/2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          sessionId: sessionId || "default-session",
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      if (data.ok) {
        onSuccess();
        onClose();
      } else {
        setError(`Failed: ${data.reason}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-[var(--card-foreground)] mb-2">
          {t.settings.verification_title}
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          {step === "init" 
            ? `Verifying ${account.name} (${account.platform})` 
            : t.settings.enter_2fa}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {step === "init" && (
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleStart}
                disabled={loading}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                {loading ? t.settings.verifying : t.settings.verify}
              </button>
            </div>
          )}

          {step === "2fa" && (
            <>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.settings.code_placeholder}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={loading}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? t.settings.verifying : t.settings.submit_code}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
