import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

export const LoginPromptModal = ({
  open,
  onClose,
  featureName,
}: LoginPromptModalProps) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const handleLogin = () => {
    onClose();
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">
              {t.auth.loginRequired}
            </DialogTitle>
          </div>
          <DialogDescription className="text-center">
            {featureName
              ? t.auth.loginToBookMessage
              : t.auth.loginRequired.toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleLogin}
            className="w-full sm:w-auto"
          >
            {t.auth.login}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
