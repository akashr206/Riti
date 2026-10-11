import React, { useState, useEffect } from "react";
import { Loader2, ArrowRight, Lock, User, Fingerprint } from "lucide-react";
import { fetchFaculty, login } from "./api";
import { CrazyInteractiveBackground } from "./components/CrazyInteractiveBackground";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./components/ui/select";

export default function LoginScreen({ onLogin }) {
    const [role, setRole] = useState("admin");
    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadFaculty = async () => {
            try {
                const data = await fetchFaculty();
                setFacultyList(data);
            } catch (err) {
                setError("Could not connect to the server.");
            } finally {
                setLoading(false);
            }
        };
        loadFaculty();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            if (role === "admin") {
                const res = await login({ role: "admin", password });
                if (res.success && res.token) {
                    localStorage.setItem("riti_token", res.token);
                    const userObj = { role: "admin" };
                    localStorage.setItem("riti_user", JSON.stringify(userObj));
                    onLogin(userObj);
                }
            } else {
                if (!selectedFaculty || !password) {
                    setError(
                        "Please select your faculty profile and enter your password.",
                    );
                    return;
                }
                const res = await login({
                    role: "lecturer",
                    facultyId: parseInt(selectedFaculty, 10),
                    password,
                });
                if (res.success && res.token) {
                    localStorage.setItem("riti_token", res.token);
                    const userObj = {
                        role: "lecturer",
                        facultyId: parseInt(selectedFaculty, 10),
                    };
                    localStorage.setItem("riti_user", JSON.stringify(userObj));
                    onLogin(userObj);
                }
            }
        } catch (err) {
            setError(err.message || "Invalid credentials.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-background font-sans overflow-hidden">
            <div
                id="left-pane-container"
                className="hidden lg:flex w-1/2 relative bg-zinc-950 flex-col justify-between p-12 overflow-hidden perspective-[2000px]"
            >
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] rounded-full bg-white/5 blur-[120px]" />
                </div>
                <CrazyInteractiveBackground />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl p-2">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="w-full h-auto object-contain brightness-0 invert opacity-90"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">
                            RITI
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1] mt-24 relative z-20 pointer-events-none">
                        Orchestrate your <br />
                        Academic exams <br /> WIn thith precision.
                    </h1>
                    <p className="mt-6 text-zinc-400 text-lg max-w-md font-light leading-relaxed">
                        An intelligent system for automated scheduling, conflict
                        resolution, and faculty assignments.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-background">
                <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex lg:hidden items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="w-full h-auto object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-foreground">
                            RITI Scheduler
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                            Welcome back
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Please enter your credentials to access your
                            account.
                        </p>
                    </div>

                    <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
                        <button
                            onClick={() => {
                                setRole("admin");
                                setPassword("");
                                setError("");
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                role === "admin"
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        >
                            Administrator
                        </button>
                        <button
                            onClick={() => {
                                setRole("lecturer");
                                setPassword("");
                                setError("");
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                role === "lecturer"
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        >
                            Lecturer
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {role === "admin" ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        Admin Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="••••••••"
                                            className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        Faculty Profile
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <Select
                                            value={selectedFaculty}
                                            onValueChange={(value) => setSelectedFaculty(value)}
                                        >
                                            <SelectTrigger className="w-full bg-background border border-input rounded-xl pl-10 h-12 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary shadow-sm cursor-pointer data-[placeholder]:text-muted-foreground transition-all">
                                                <SelectValue placeholder="Select your name...">
                                                    {selectedFaculty && facultyList.find(f => f.id.toString() === selectedFaculty)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-lg border-border/40 bg-popover">
                                                {facultyList.map((f) => (
                                                    <SelectItem key={f.id} value={f.id.toString()} className="cursor-pointer py-2.5">
                                                        <span className="font-medium text-foreground">{f.name}</span>
                                                        <span className="text-muted-foreground ml-2 text-xs">({f.department})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="••••••••"
                                            className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                <svg
                                    className="w-4 h-4 mr-2 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    ></path>
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-center text-primary/80 mt-2 mb-2">
                            <span className="font-semibold block mb-1">For testing purposes:</span>
                            {role === "admin" ? (
                                <span>Admin password is <code className="bg-primary/10 px-1.5 py-0.5 rounded font-mono text-primary font-bold">riti2026</code></span>
                            ) : (
                                <span>Lecturer password is <code className="bg-primary/10 px-1.5 py-0.5 rounded font-mono text-primary font-bold">lecturer123</code></span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] mt-4 group"
                        >
                            {role === "admin"
                                ? "Access Command Center"
                                : "View My Schedule"}
                            <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground/60 mt-8 pt-8 border-t border-border/40">
                        &copy; {new Date().getFullYear()} RITI Technical
                        Institute. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
