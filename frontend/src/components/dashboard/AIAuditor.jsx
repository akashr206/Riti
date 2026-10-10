import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { generateInsights } from "../../api";

export function AIAuditor() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateInsights();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || "Failed to generate AI report");
      }
    } catch (err) {
      setError("Failed to communicate with AI Auditor engine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Schedule Intelligence
            </CardTitle>
            <CardDescription>
              Advanced heuristic analysis for faculty burnout, room utilization, and spatial fairness.
            </CardDescription>
          </div>
          {report && !loading && (
            <Button variant="outline" size="sm" onClick={handleGenerateAudit} className="hidden sm:flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Re-Run Audit
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!report && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-md border border-dashed bg-muted/50">
            <Sparkles className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Ready to Audit Schedule</h3>
            <p className="text-sm text-muted-foreground max-w-[420px] mt-2 mb-6">
              The intelligence engine will process the active schedule state to identify hidden human-factor conflicts that pure algorithmic sorting may overlook.
            </p>
            <Button onClick={handleGenerateAudit}>
              Initialize Audit
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">Analyzing Constraints</p>
              <p className="text-xs text-muted-foreground">Running heuristic checks across all allocations...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Intelligence Engine Offline</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateAudit}>
              Retry
            </Button>
          </div>
        )}

        {report && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 w-fit px-3 py-1 rounded-md">
              <CheckCircle2 className="w-4 h-4" /> Analysis Complete
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none 
              prose-p:text-muted-foreground
              prose-headings:text-foreground
              prose-strong:text-foreground
              prose-ul:text-muted-foreground
              p-6 rounded-md bg-muted/30 border">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
