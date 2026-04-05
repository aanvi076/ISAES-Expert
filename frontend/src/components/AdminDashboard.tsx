import { useState, useEffect, useMemo } from 'react';
import ReportViewer from './ReportViewer';
import ChatWidget from './ChatWidget';
import { API_BASE_URL } from '../config';

interface Student {
  id: number;
  name: string;
  cgpa: number;
  program: string;
  attendance_pct: number;
  year: number;
}

const colorMap: Record<string, string> = {
  "Computer Science": "bg-purple-100 text-purple-700 border-purple-200",
  "Electrical Engineering": "bg-orange-100 text-orange-700 border-orange-200",
  "Mechanical Engineering": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Business Admin": "bg-pink-100 text-pink-700 border-pink-200",
  "Data Science": "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/students`)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        if (data.length > 0) {
          setActiveStudentId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  // Global Stats Calculation
  const stats = useMemo(() => {
    if (students.length === 0) return { avgGpa: 0, atRisk: 0, avgAttendance: 0 };
    const avgGpa = students.reduce((acc, s) => acc + s.cgpa, 0) / students.length;
    const atRisk = students.filter(s => s.cgpa < 2.0).length;
    const avgAttendance = students.reduce((acc, s) => acc + s.attendance_pct, 0) / students.length;
    return { avgGpa: avgGpa.toFixed(2), atRisk, avgAttendance: avgAttendance.toFixed(1) };
  }, [students]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-50">Synchronizing Intelligence Arrays...</p>
      </div>
    );
  }

  const departments = ["All", ...Array.from(new Set(students.map(s => s.program)))];
  const filteredStudents = students.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toString().includes(searchQuery);
      const matchDept = selectedDept === "All" || s.program === selectedDept;
      return matchSearch && matchDept;
  });

  return (
    <div className="flex h-screen bg-slate-50 flex-col font-sans overflow-hidden">
        
      {/* Premium Dark Navigation */}
      <header className="bg-slate-900 border-b border-black/20 px-10 py-5 flex justify-between items-center z-30 shrink-0 shadow-2xl">
        <div className="flex items-center gap-5">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 transform hover:rotate-12 transition-transform cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
                <h1 className="text-xl font-black text-white tracking-tighter">ISAES <span className="text-indigo-400 font-medium">Intelligence</span></h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] leading-none mt-1">Institutional Expert System</p>
            </div>
        </div>
        <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-10">
                <div className="flex flex-col items-start translate-y-0.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Health</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" /> 
                        Operational
                    </span>
                </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800 mx-1" />
            <div className="flex items-center gap-4 group cursor-pointer bg-slate-800/40 p-2 pr-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                    <span className="text-white font-black text-xs relative z-10">AB</span>
                </div>
                <div className="text-left">
                    <p className="text-sm font-black text-slate-100 group-hover:text-indigo-300 transition-colors">Aanvi Bindal</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider uppercase">Head Advisor</p>
                </div>
            </div>
        </div>
      </header>

      {/* Global Intelligence Overview (THE STATS) */}
      <div className="bg-white border-b border-slate-200 px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-8 z-20 shadow-sm shrink-0">
          <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Registry</span>
              <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-slate-900 leading-none">{students.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Students</span>
              </div>
          </div>
          <div className="flex flex-col border-l border-slate-100 pl-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Academic Index (GPA)</span>
              <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-indigo-600 leading-none">{stats.avgGpa}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Average</span>
              </div>
          </div>
          <div className="flex flex-col border-l border-slate-100 pl-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Institutional Risk</span>
              <div className="flex items-end gap-2">
                  <span className={`text-3xl font-black leading-none ${stats.atRisk > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>{stats.atRisk}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Critical High</span>
              </div>
          </div>
          <div className="flex flex-col border-l border-slate-100 pl-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Avg Participation</span>
              <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-slate-900 leading-none">{stats.avgAttendance}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Attendance</span>
              </div>
          </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Roster with Filters */}
        <div className="w-85 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-lg">
          
          <div className="p-8 border-b border-slate-100 space-y-6">
             <div className="relative group">
                <svg className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                    type="text" 
                    placeholder="Search records / ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-5 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all ring-1 ring-slate-100"
                />
             </div>
             <div className="flex gap-3">
                <select 
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer ring-1 ring-slate-100"
                >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="bg-slate-900 rounded-2xl px-4 flex items-center justify-center text-white shadow-lg shadow-slate-200 active:scale-95 transition-transform cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18"></path></svg>
                </div>
             </div>
          </div>

          <div className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar bg-slate-50/10">
            {filteredStudents.map((student) => {
              const isActive = activeStudentId === student.id;
              const pillColor = colorMap[student.program] || "bg-slate-100 text-slate-700 border-slate-200";
              
              return (
                <button
                  key={student.id}
                  onClick={() => setActiveStudentId(student.id)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.5rem] transition-all duration-500 group relative border ${
                    isActive 
                      ? 'bg-slate-900 border-slate-900 shadow-2xl translate-x-2' 
                      : 'bg-white border-slate-100/50 hover:border-slate-200 hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner font-black text-[10px] ${isActive ? 'bg-white/10 text-white border border-white/10' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                        {student.id.toString().slice(-2)}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-black truncate transition-colors ${isActive ? 'text-white' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                            {student.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border transition-colors ${isActive ? 'bg-white/10 border-white/20 text-indigo-300' : pillColor}`}>
                                {student.program.split(' ')[0]}
                            </span>
                        </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-md font-black font-mono tracking-tighter ${
                        student.cgpa < 2.0 ? 'text-rose-500' : student.cgpa < 3.0 ? 'text-amber-500' : 'text-emerald-500'
                    } ${isActive && 'text-shadow-glow brightness-125'}`}>
                      {student.cgpa.toFixed(2)}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>GPA</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Intelligence Canvas */}
        <div className="flex-1 overflow-y-auto bg-white p-10 relative no-scrollbar">
           {activeStudentId ? (
               <div className="max-w-6xl mx-auto pb-32">
                   <ReportViewer studentId={activeStudentId} />
                   <ChatWidget studentId={activeStudentId} />
               </div>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-20 h-20 opacity-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="font-black text-xs uppercase tracking-[0.3em]">Select a High-Resolution Asset Record</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
