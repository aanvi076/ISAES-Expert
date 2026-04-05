import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const ReportViewer = ({ studentId }: { studentId: number }) => {
  const [downloading, setDownloading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Student Basic Data
        const sRes = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}`);
        const sData = await sRes.json();
        setStudent(sData);

        // 2. Fetch Advice - STRIP EXTRA FIELDS to match AdviseRequest (Prevents 422 error)
        const advicePayload = {
            cgpa: sData.cgpa,
            failed_subjects: sData.failed_subjects || 0,
            attendance_pct: sData.attendance_pct || 100.0,
            year: sData.year || 1,
            credit_completion: sData.credit_completion || 100.0,
            income_band: sData.income_band || "HIGH",
            program: sData.program
        };

        const aRes = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/advise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(advicePayload)
        });
        const aData = await aRes.json();
        setAdvice(aData);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/report/pdf`);
      
      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const extension = contentType?.includes('pdf') ? 'pdf' : 'html';
      const a = document.createElement('a');
      a.href = url;
      a.download = `ISAES_Intelligence_Export_${studentId}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed animate-pulse">
        <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Profiling Student Intelligence...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Action Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-6">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{student.name}</h2>
                    <span className="px-2 py-0.5 bg-indigo-50 text-[10px] font-black text-indigo-600 rounded-md border border-indigo-100 underline decoration-indigo-200 decoration-2 underline-offset-2 uppercase">ID: {student.id}</span>
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{student.program} • Year {student.year}</p>
            </div>
            <button 
                onClick={handleDownload}
                disabled={downloading}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"
            >
                {downloading ? 'Generating...' : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3"></path></svg>
                        Download Intelligence Report
                    </>
                )}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Core Metrics Visualizer */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden group">
                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic CGPA</p>
                        <p className={`text-3xl font-black ${student.cgpa < 2.0 ? 'text-rose-500' : student.cgpa < 3.0 ? 'text-amber-500' : 'text-slate-900'}`}>{student.cgpa.toFixed(2)}</p>
                        <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${student.cgpa < 2.0 ? 'bg-rose-500' : 'bg-slate-900'}`} style={{ width: `${(student.cgpa / 4) * 100}%` }} />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance Rate</p>
                        <p className="text-3xl font-black text-slate-900">{student.attendance_pct}%</p>
                        <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${student.attendance_pct < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${student.attendance_pct}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Specialized Course Strategy Card */}
            <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    Targeted Improvements
                </h3>
                <div className="space-y-4">
                    {advice?.recommendations?.filter((r: any) => r.category === 'improvement').map((r: any, i: number) => (
                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{r.rule_id}</p>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">{r.message}</p>
                        </div>
                    ))}
                    {(!advice?.recommendations?.some((r: any) => r.category === 'improvement')) && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-slate-500 text-xs text-center">
                            Inference engine processing individualized student trajectory...
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Dynamic Inference Visualization */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-8">
                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                Inference Intelligence
            </h3>
            
            <div className="space-y-4">
                {advice?.recommendations?.filter((r: any) => r.category === 'risk').map((r: any, i: number) => (
                    <div key={i} className={`flex gap-4 items-start p-6 rounded-2xl border transition-colors ${
                        r.risk_level === 'HIGH' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}>
                         <div className="mt-0.5 p-2 bg-white rounded-lg shadow-sm">
                            <svg className={`w-5 h-5 ${r.risk_level === 'HIGH' ? 'text-rose-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                         </div>
                         <div>
                            <strong className="font-black tracking-tight text-lg block mb-1 uppercase">{r.rule_id}</strong>
                            <p className="text-sm leading-relaxed font-medium opacity-80">{r.message}</p>
                         </div>
                    </div>
                ))}
                {(!advice?.recommendations?.some((r: any) => r.category === 'risk')) && (
                    <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        <svg className="w-12 h-12 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Risk Vectors: Nominal</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ReportViewer;
