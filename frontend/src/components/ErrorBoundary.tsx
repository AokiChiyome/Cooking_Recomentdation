import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            minHeight: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            background: "#FEE2E2",
            borderRadius: "8px",
            margin: "1rem",
          }}
        >
          <AlertTriangle
            size={48}
            color="#DC2626"
            style={{ marginBottom: "1rem" }}
          />
          <h2 style={{ color: "#DC2626", marginBottom: "0.5rem" }}>
            Oops! Có lỗi xảy ra
          </h2>
          <p style={{ color: "#991B1B", marginBottom: "1.5rem", maxWidth: "400px" }}>
            {this.state.error?.message || "Ứng dụng gặp lỗi không mong muốn"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1rem",
              background: "#DC2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
