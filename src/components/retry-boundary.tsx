"use client";

import { Component, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * Catches a failed part of a page, so the rest of the page stays (owner feedback 2026-11-26: the
 * Strava refresh button disappeared when the 6-month calendar failed). The part shows a message and
 * a "Try again" button, and shows its content again once the server sends new data.
 */
export class RetryBoundary extends Component<
  { children: ReactNode; message: string; retryLabel: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previous: { children: ReactNode }) {
    // A fresh page from the server gives new children: show them again.
    if (this.state.failed && previous.children !== this.props.children) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <RetryNotice
          message={this.props.message}
          retryLabel={this.props.retryLabel}
        />
      );
    }
    return this.props.children;
  }
}

function RetryNotice({
  message,
  retryLabel,
}: {
  message: string;
  retryLabel: string;
}) {
  const router = useRouter();
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-6 text-center text-sm"
    >
      <p className="text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="rounded-lg border px-3 py-1.5 font-medium hover:bg-muted"
      >
        {retryLabel}
      </button>
    </div>
  );
}
