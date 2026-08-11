import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-level error boundary — prevents a single render error from
 * white-screening the whole app. Text is bilingual because the
 * LanguageProvider may itself be part of the failed tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.assign("/home");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isArabic = document.documentElement.dir === "rtl";

    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-3xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          {isArabic ? "حدث خطأ غير متوقع" : "Something went wrong"}
        </h1>
        <p className="text-muted-foreground mb-6 max-w-xs">
          {isArabic
            ? "نعتذر، حدث خطأ أثناء عرض هذه الصفحة. حاول مرة أخرى."
            : "Sorry, an error occurred while rendering this page. Please try again."}
        </p>
        <div className="flex gap-3">
          <Button onClick={this.handleReload}>
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </Button>
          <Button variant="outline" onClick={this.handleGoHome}>
            {isArabic ? "الرئيسية" : "Go home"}
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
