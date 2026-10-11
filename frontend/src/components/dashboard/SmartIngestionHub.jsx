import React, { useState, useRef, useEffect } from "react";
import {
    UploadCloud,
    Sparkles,
    FileText,
    ArrowRight,
    X,
    Building2,
    Users,
    Calendar,
} from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { ingestDocument, confirmIngest } from "../../api";
import { motion, AnimatePresence } from "motion/react";

const THINKING_STATES = [
    "Reading document structure...",
    "Running AI extraction models...",
    "Identifying valid classroom spaces...",
    "Categorizing faculty records...",
    "Parsing scheduling constraints...",
    "Validating against schema...",
];

// Helper to calculate SVG path length for success check
const calculatePathLength = () => {
    return 30; // Pre-calculated safe max for Lucide Check
};

export function SmartIngestionHub({ refreshData, setPage }) {
    const [file, setFile] = useState(null);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [success, setSuccess] = useState(false);
    const [thinkStateIndex, setThinkStateIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);

    const fileInputRef = useRef(null);

    // Cycle thinking states using React effects instead of vanilla JS orchestration for better integration
    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setThinkStateIndex((prev) => (prev + 1) % THINKING_STATES.length);
        }, 2000); // Maps to --think-hold in CSS
        return () => clearInterval(interval);
    }, [loading]);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!file && !text.trim()) {
            setError("Please drop a file or paste some text to extract.");
            return;
        }
        setLoading(true);
        setError(null);
        setThinkStateIndex(0);

        try {
            const res = await ingestDocument(file, text);
            if (res.success) {
                setPreviewData(res.data);
            } else {
                setError(res.error || "Failed to process data.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);
        setThinkStateIndex(0);
        try {
            const res = await confirmIngest(previewData);
            if (res.success) {
                setSuccess(true);
                refreshData(false);
                setTimeout(() => setPage("matrix"), 2500);
            } else {
                setError(res.error || "Failed to save data.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cancelImport = () => {
        setPreviewData(null);
        setFile(null);
        setText("");
        setError(null);
        setEditMode(false);
    };

    const updatePreviewData = (category, index, field, value) => {
        setPreviewData((prev) => {
            const newData = { ...prev };
            newData[category] = [...newData[category]];
            newData[category][index] = {
                ...newData[category][index],
                [field]: value,
            };
            return newData;
        });
    };

    // 1. Success State View
    if (success) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center h-full min-h-[70vh]">
                <div className="mb-8">
                    <span
                        className="t-success-check"
                        data-state="in"
                        aria-hidden="true"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-24 h-24 text-emerald-500"
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </span>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <h3 className="text-3xl font-semibold tracking-tight text-foreground mb-3 font-poppins">
                        Integration Complete
                    </h3>
                    <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                        Database successfully synchronized with new data.
                        Redirecting to Matrix...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-8 w-full flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col items-start gap-3"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold tracking-wide uppercase">
                        AI Extractor Engine
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-poppins">
                    Smart Ingestion Hub
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                    Transform unstructured syllabi and messy PDFs into
                    structured database records instantly. Powered by
                    intelligent schema mapping.
                </p>
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Alert
                        variant="destructive"
                        className="mb-8 border-destructive/20 bg-destructive/5 backdrop-blur-sm shadow-sm rounded-xl"
                    >
                        <AlertDescription className="text-sm font-medium">
                            {error}
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* 2. Review Extracted Data State */}
            {previewData && !loading ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {/* Bento Card 1: Rooms */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Building2 className="w-32 h-32 transform translate-x-8 -translate-y-8" />
                            </div>
                            <h4 className="font-semibold text-lg text-foreground mb-4 flex items-center justify-between">
                                Rooms Detected
                                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {previewData.rooms?.length || 0}
                                </span>
                            </h4>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 relative z-10 scrollbar-thin scrollbar-thumb-border">
                                {previewData.rooms?.map((r, i) => (
                                    <div
                                        key={i}
                                        className="text-sm p-3 bg-muted/40 rounded-lg flex justify-between items-center border border-transparent hover:border-border transition-colors"
                                    >
                                        {editMode ? (
                                            <>
                                                <input
                                                    className="font-medium text-foreground bg-background border px-2 py-1 rounded w-1/2"
                                                    value={r.name}
                                                    onChange={(e) =>
                                                        updatePreviewData(
                                                            "rooms",
                                                            i,
                                                            "name",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        Cap:
                                                    </span>
                                                    <input
                                                        type="number"
                                                        className="font-mono text-xs bg-background px-2 py-1 rounded border w-16"
                                                        value={r.capacity}
                                                        onChange={(e) =>
                                                            updatePreviewData(
                                                                "rooms",
                                                                i,
                                                                "capacity",
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-medium text-foreground">
                                                    {r.name}
                                                </span>
                                                <span className="text-muted-foreground font-mono text-xs bg-background px-2 py-1 rounded border">
                                                    Cap: {r.capacity}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {(!previewData.rooms ||
                                    previewData.rooms.length === 0) && (
                                    <p className="text-sm text-muted-foreground/60 italic">
                                        No rooms identified.
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        {/* Bento Card 2: Faculty */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users className="w-32 h-32 transform translate-x-8 -translate-y-8" />
                            </div>
                            <h4 className="font-semibold text-lg text-foreground mb-4 flex items-center justify-between">
                                Faculty Roster
                                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {previewData.faculty?.length || 0}
                                </span>
                            </h4>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 relative z-10 scrollbar-thin scrollbar-thumb-border">
                                {previewData.faculty?.map((f, i) => (
                                    <div
                                        key={i}
                                        className="text-sm p-3 bg-muted/40 rounded-lg flex flex-col gap-2 border border-transparent hover:border-border transition-colors"
                                    >
                                        {editMode ? (
                                            <>
                                                <input
                                                    className="font-medium text-foreground bg-background border px-2 py-1 rounded w-full"
                                                    value={f.name}
                                                    onChange={(e) =>
                                                        updatePreviewData(
                                                            "faculty",
                                                            i,
                                                            "name",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <input
                                                    className="text-muted-foreground text-xs uppercase tracking-wider bg-background border px-2 py-1 rounded w-full"
                                                    value={f.department || ""}
                                                    placeholder="Department"
                                                    onChange={(e) =>
                                                        updatePreviewData(
                                                            "faculty",
                                                            i,
                                                            "department",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-medium text-foreground">
                                                    {f.name}
                                                </span>
                                                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                                                    {f.department ||
                                                        "Unassigned"}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {(!previewData.faculty ||
                                    previewData.faculty.length === 0) && (
                                    <p className="text-sm text-muted-foreground/60 italic">
                                        No faculty identified.
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        {/* Bento Card 3: Exams */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Calendar className="w-32 h-32 transform translate-x-8 -translate-y-8" />
                            </div>
                            <h4 className="font-semibold text-lg text-foreground mb-4 flex items-center justify-between">
                                Exam Sessions
                                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {previewData.exams?.length || 0}
                                </span>
                            </h4>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 relative z-10 scrollbar-thin scrollbar-thumb-border">
                                {previewData.exams?.map((e, i) => (
                                    <div
                                        key={i}
                                        className="text-sm p-3 bg-muted/40 rounded-lg flex justify-between items-center gap-2 border border-transparent hover:border-border transition-colors"
                                    >
                                        {editMode ? (
                                            <>
                                                <input
                                                    className="font-medium text-foreground bg-background border px-2 py-1 rounded w-1/2"
                                                    value={e.courseCode}
                                                    onChange={(ev) =>
                                                        updatePreviewData(
                                                            "exams",
                                                            i,
                                                            "courseCode",
                                                            ev.target.value,
                                                        )
                                                    }
                                                />
                                                <input
                                                    className="text-muted-foreground font-mono text-xs bg-background border px-2 py-1 rounded w-1/2"
                                                    value={e.examDate}
                                                    onChange={(ev) =>
                                                        updatePreviewData(
                                                            "exams",
                                                            i,
                                                            "examDate",
                                                            ev.target.value,
                                                        )
                                                    }
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-medium text-foreground">
                                                    {e.courseCode}
                                                </span>
                                                <span className="text-muted-foreground font-mono text-xs">
                                                    {e.examDate}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {(!previewData.exams ||
                                    previewData.exams.length === 0) && (
                                    <p className="text-sm text-muted-foreground/60 italic">
                                        No exams identified.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-between mt-auto pt-6 border-t"
                    >
                        <Button
                            variant="outline"
                            onClick={() => setEditMode(!editMode)}
                            className="rounded-md shadow-sm"
                        >
                            {editMode ? "Lock Edits" : "Edit Raw Data"}
                        </Button>
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                onClick={cancelImport}
                                size="lg"
                                className="px-6 rounded-md hover:bg-destructive/10 hover:text-destructive"
                            >
                                Discard Draft
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                size="lg"
                                className="px-8 rounded-md shadow-sm"
                                disabled={editMode}
                            >
                                Sync to Database
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                /* 3. Upload State */
                <div className="flex-1 flex flex-col gap-6 relative">
                    <div
                        className={`
              relative flex-1 min-h-[350px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-12 text-center transition-all duration-300
              ${file ? "border-primary/40 bg-muted/30" : "border-border/60 bg-muted/10 hover:border-primary/50 hover:bg-muted/20"}
              cursor-pointer group overflow-hidden
            `}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() =>
                            !loading && fileInputRef.current?.click()
                        }
                    >
                        {loading && (
                            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8"></div>
                                <span className="t-think" role="status">
                                    <span
                                        className="t-think-sizer"
                                        aria-hidden="true"
                                    >
                                        {
                                            THINKING_STATES[
                                                THINKING_STATES.length - 1
                                            ]
                                        }
                                    </span>
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={thinkStateIndex}
                                            className="t-think-text"
                                            data-text={
                                                THINKING_STATES[thinkStateIndex]
                                            }
                                            initial={{
                                                opacity: 0,
                                                y: 8,
                                                filter: "blur(2px)",
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                filter: "blur(0px)",
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -8,
                                                filter: "blur(2px)",
                                            }}
                                            transition={{
                                                duration: 0.25,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            {THINKING_STATES[thinkStateIndex]}
                                        </motion.span>
                                    </AnimatePresence>
                                </span>
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.txt,.csv"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0])
                                    setFile(e.target.files[0]);
                            }}
                            disabled={loading}
                        />

                        {!loading && (
                            <>
                                {file ? (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center z-10"
                                    >
                                        <div className="w-20 h-20 bg-background shadow-xl border rounded-full flex items-center justify-center mb-6">
                                            <FileText className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-semibold text-foreground font-poppins">
                                            {file.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-2 font-mono">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-6 rounded-full border-dashed hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                        >
                                            <X className="w-4 h-4 mr-2" />{" "}
                                            Remove File
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center z-10"
                                    >
                                        <UploadCloud className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors duration-500" />

                                        <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-3 font-poppins">
                                            Drop your documents
                                        </h3>
                                        <p className="text-muted-foreground max-w-sm leading-relaxed">
                                            Accepts official academic PDFs,
                                            scheduling spreadsheets, or plain
                                            text fragments.
                                        </p>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
                        <div className="h-px bg-border/60 w-full"></div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-poppins">
                            OR PASTE DIRECTLY
                        </span>
                        <div className="h-px bg-border/60 w-full"></div>
                    </div>

                    <div className="bg-muted/10 rounded-lg border p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all duration-300 relative">
                        <textarea
                            className="w-full h-40 p-6 bg-transparent resize-none outline-none text-base placeholder:text-muted-foreground/60 font-mono text-sm leading-relaxed"
                            placeholder="[Course Code] CS101&#10;[Room] Block A 104 (Cap: 45)&#10;[Faculty] Dr. Smith, CS Dept..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            size="lg"
                            className="px-8 rounded-md shadow-sm h-12 text-base font-medium group"
                            onClick={handleProcess}
                            disabled={loading || (!file && !text.trim())}
                        >
                            Initialize AI Extraction
                            <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
