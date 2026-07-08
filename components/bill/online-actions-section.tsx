import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OnlineActionsSection({
  isSaving,
  message,
  viewLink,
  editLink,
  onSaveOnline,
  onCopyViewLink,
  onCopyEditLink,
  onDuplicate,
}: {
  isSaving: boolean;
  message: string;
  viewLink: string;
  editLink: string;
  onSaveOnline: () => void;
  onCopyViewLink: () => void;
  onCopyEditLink: () => void;
  onDuplicate: () => void;
}) {
  return (
    <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">Online Sharing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={onSaveOnline} disabled={isSaving} className="h-11">
            {isSaving ? "Saving..." : "Save Online"}
          </Button>
          <Button onClick={onDuplicate} variant="outline" className="h-11">
            Duplicate Bill
          </Button>
          <Button
            onClick={onCopyViewLink}
            disabled={!viewLink}
            variant="outline"
            className="h-11"
          >
            Copy View Link
          </Button>
          <Button
            onClick={onCopyEditLink}
            disabled={!editLink}
            variant="outline"
            className="h-11"
          >
            Copy Edit Link
          </Button>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
