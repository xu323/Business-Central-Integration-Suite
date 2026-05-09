import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, ClipboardCopy, Home, RotateCw } from "lucide-react";
import { nanoid } from "nanoid";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  ticketId: string;
  message: string;
  stack: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, ticketId: "", message: "", stack: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      ticketId: nanoid(10),
      message: error.message,
      stack: error.stack ?? "",
    };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Future: send to Application Insights / Sentry here.
  }

  private copyDiagnostics = () => {
    const payload = [
      `ticket: ${this.state.ticketId}`,
      `message: ${this.state.message}`,
      `time: ${new Date().toISOString()}`,
      `userAgent: ${navigator.userAgent}`,
      "",
      this.state.stack,
    ].join("\n");
    void navigator.clipboard.writeText(payload);
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
        <div className="card max-w-lg w-full p-8 space-y-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-rose-50 p-2.5 text-rose-600">
              <AlertOctagon size={22} strokeWidth={1.75} />
            </div>
            <div className="flex-1 space-y-1">
              <h1 className="text-lg font-semibold text-slate-900">
                系統發生未預期錯誤
              </h1>
              <p className="text-sm text-slate-600">
                請將以下追蹤碼提供給支援團隊以加速處理。
              </p>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono break-all">
            <div className="text-slate-500">Ticket ID</div>
            <div className="text-slate-900">{this.state.ticketId}</div>
            <div className="mt-2 text-slate-500">Message</div>
            <div className="text-rose-700">{this.state.message}</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button type="button" className="btn-outline" onClick={this.copyDiagnostics}>
              <ClipboardCopy size={16} strokeWidth={1.75} />
              複製錯誤資訊
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <Home size={16} strokeWidth={1.75} />
              回首頁
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              <RotateCw size={16} strokeWidth={1.75} />
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }
}
