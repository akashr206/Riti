import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { suggestRepair, applyRepair } from "../../api";

export function EmergencySwapModal({ open, onOpenChange, alloc, disruptionType, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState(null);

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await suggestRepair(alloc.id, disruptionType);
      if (res.success) {
        setSuggestion(res.suggestion);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      await applyRepair(alloc.id, disruptionType, suggestion.replaceWithId);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && alloc) {
      setSuggestion(null);
      setError(null);
      handleSuggest();
    }
  }, [open, alloc]);

  if (!alloc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Emergency {disruptionType === 'faculty' ? 'Faculty' : 'Room'} Swap</DialogTitle>
          <DialogDescription>
            Finding a minimal-impact replacement for {alloc.exam.courseCode}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center justify-center min-h-[100px]">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Calculating minimal-change swap...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 text-destructive text-center">
              <AlertCircle className="w-6 h-6" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : suggestion ? (
            <div className="w-full space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  Suggested Replacement
                </p>
                <p className="text-lg font-bold text-foreground">
                  {suggestion.replaceWithName}
                </p>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                This replacement causes zero cascading conflicts.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleApply} 
            disabled={!suggestion || loading}
          >
            Apply Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
