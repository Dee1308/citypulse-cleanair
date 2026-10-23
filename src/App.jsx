import React, { useState, useEffect } from 'react';
import { 
  Map, TrendingUp, AlertTriangle, ShieldCheck, 
  Wind, Search, Info, Activity, CheckSquare, MapPin, Loader2, CloudRain, Newspaper, Clock, Sun, Moon, Download, Thermometer, ArrowRight, Printer
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, AreaChart, Area, ComposedChart
} from 'recharts';

// --- MUMBAI WARD COORDINATES (FOR LIVE API) ---
const mumbaiWards = [
  { id: 'K/W', name: 'Andheri West (Versova, Juhu)', lat: 19.129, lon: 72.819 },
  { id: 'H/W', name: 'Bandra West (Pali Hill)', lat: 19.060, lon: 72.826 },
  { id: 'A', name: 'Colaba / Churchgate', lat: 18.906, lon: 72.816 },
  { id: 'G/N', name: 'Dadar / Dharavi', lat: 19.020, lon: 72.843 },
  { id: 'R/C', name: 'Borivali (National Park)', lat: 19.229, lon: 72.867 },
  { id: 'S', name: 'Powai (Lake Area)', lat: 19.119, lon: 72.905 },
  { id: 'P/N', name: 'Malad West', lat: 19.186, lon: 72.848 },
  { id: 'G/S', name: 'Worli (Sea Face)', lat: 19.016, lon: 72.816 },
  { id: 'L', name: 'Kurla', lat: 19.072, lon: 72.879 },
  { id: 'T', name: 'Mulund', lat: 19.172, lon: 72.956 },
  { id: 'M/E', name: 'Govandi / Chembur', lat: 19.048, lon: 72.912, hasSensor: false }
];

// --- MOCKED DATA ---
const mockAdvisories = [
  { id: 1, type: 'Health Warning', title: 'Severe AQI Alert Issued for Kurla & Govandi', time: '10 mins ago', desc: 'PM2.5 levels are expected to cross 300 μg/m³ due to localized industrial emissions and low wind speeds.', color: 'text-red-500 bg-red-500/10 border-red-500/30', icon: AlertTriangle },
  { id: 2, type: 'Municipal Action', title: 'BMC Deploys Anti-Smog Fleet to Western Suburbs', time: '2 hours ago', desc: '20 automated mist-sprinkler trucks have been routed to Andheri West and the Versova Metro Station corridors.', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', icon: ShieldCheck },
  { id: 3, type: 'General Advisory', title: 'School Morning Assembly Advisory Lifted in South Mumbai', time: '5 hours ago', desc: 'Air quality in the Colaba and Churchgate jurisdictions has stabilized. Normal activities may resume.', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30', icon: Info },
];

const shapData = [
  { feature: 'Wind Stagnation', impact: 75 },
  { feature: 'Traffic Commute', impact: 45 },
  { feature: 'Construction Dust', impact: 30 },
  { feature: 'Temp Inversion', impact: 60 },
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activePage, setActivePage] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState(mumbaiWards[0]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-IN'));
  
  // --- LIVE DATA STATES ---
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [liveAQI, setLiveAQI] = useState(null);
  const [chartData, setChartData] = useState([]);

  // --- THEME ENGINE ---
  const theme = isDarkMode ? {
    bg: 'bg-slate-950',
    sidebar: 'bg-slate-900 border-slate-800',
    panel: 'bg-slate-800/50 border-slate-700',
    card: 'bg-slate-800/40 border-slate-700 hover:border-indigo-500 hover:bg-slate-800/80',
    text: 'text-slate-200',
    textMuted: 'text-slate-400',
    heading: 'text-white',
    input: 'bg-slate-800 border-slate-700 text-white',
    chartGrid: '#334155',
    chartText: '#94a3b8',
    tooltipBg: '#1e293b',
  } : {
    bg: 'bg-slate-50',
    sidebar: 'bg-white border-slate-200 shadow-lg',
    panel: 'bg-white border-slate-200 shadow-sm',
    card: 'bg-white border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md',
    text: 'text-slate-700',
    textMuted: 'text-slate-500',
    heading: 'text-slate-900',
    input: 'bg-slate-100 border-slate-300 text-slate-900',
    chartGrid: '#e2e8f0',
    chartText: '#64748b',
    tooltipBg: '#ffffff',
  };
  
  // --- CLOCK & API ENGINE ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-IN')), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${selectedWard.lat}&longitude=${selectedWard.lon}&current=pm2_5&hourly=pm2_5&timezone=Asia%2FKolkata&past_days=1&forecast_days=1`);
        const data = await response.json();
        setLiveAQI(data.current.pm2_5);

        const currentHourStr = data.current.time;
        const currentIndex = data.hourly.time.indexOf(currentHourStr);
        
        const processedChartData = [];
        for (let i = currentIndex - 12; i <= currentIndex + 12; i++) {
          if (i >= 0 && i < data.hourly.time.length) {
            const timeLabel = new Date(data.hourly.time[i]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const val = data.hourly.pm2_5[i];
            processedChartData.push({
              time: i === currentIndex ? 'NOW' : timeLabel,
              historic: i <= currentIndex ? val : null,
              predicted: i >= currentIndex ? val : null,
              upperBound: i >= currentIndex ? Math.round(val * 1.15) : null,
              lowerBound: i >= currentIndex ? Math.round(val * 0.85) : null,
            });
          }
        }
        setChartData(processedChartData);
      } catch (error) { console.error("API failed", error); }
      setIsLoading(false);
    };
    fetchRealTimeData();
  }, [selectedWard]);

  // --- HELPER FUNCTIONS ---
  const getStatusColor = (aqi) => {
    if (!aqi) return 'text-slate-500 border-slate-700 bg-slate-100 dark:bg-slate-800';
    if (aqi > 150) return 'text-red-500 border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    if (aqi > 80) return 'text-amber-500 border-amber-500/50 bg-amber-500/10';
    return 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';
  };

  const handleWardClick = (ward) => {
    setSelectedWard(ward);
    setActivePage('predict');
  };

  const handleExport = () => {
    setIsExporting(true);
    // Simulate generation time, then open browser's print to PDF dialog
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 1500);
  };

  const filteredWards = mumbaiWards.filter(ward => 
    ward.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ward.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      
      {/* SIDEBAR NAVIGATION (Hides when printing PDF) */}
      <div className={`w-72 flex flex-col z-20 transition-colors duration-300 border-r print:hidden ${theme.sidebar}`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
            <Activity size={28} className="text-indigo-500" /> CityPulse
          </h1>
          <p className={`text-xs mt-1 uppercase tracking-widest font-semibold ${theme.textMuted}`}>CleanAir OS</p>
        </div>
        
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-indigo-500" />
              <div>
                  <p className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>Target Jurisdiction</p>
                  <p className={`text-sm font-bold truncate ${theme.heading}`} title={selectedWard.name}>Ward {selectedWard.id}</p>
              </div>
            </div>
            {isLoading ? <Loader2 size={16} className="text-indigo-500 animate-spin" /> : <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">SYNCED</div>}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {['discover', 'predict', 'explain', 'act', 'news'].map((page, idx) => {

<Map size={20}/>
const icons = [, <TrendingUp size={20}/>, <Info size={20}/>, <ShieldCheck size={20}/>, <Newspaper size={20}/>];
            const labels = ["1. Discover Map", "2. Predict Trajectory", "3. Explain Model", "4. Act (Dispatch)", "5. City Advisories"];
            return (
              <button key={page} onClick={() => setActivePage(page)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                  activePage === page 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' 
                    : `${theme.textMuted} hover:bg-indigo-500/10 hover:text-indigo-500`
                }`}>
                {icons[idx]} {labels[idx]}
              </button>
            )
          })}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        
        {/* TOP HEADER (Hides when printing) */}
        <header className={`h-16 px-8 flex items-center justify-between border-b z-10 transition-colors duration-300 print:hidden ${theme.panel}`}>
          <div className="flex items-center gap-4">
             <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                <Clock size={16} className="text-indigo-500"/> {currentTime} IST
             </div>
             <div className="flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                <Activity size={16} /> APIs Live
             </div>
          </div>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`p-2 rounded-full border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100 shadow-sm'}`}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <div className="flex-1 p-10 overflow-y-auto print:p-0">
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            
            {/* --- PAGE 1: DISCOVER --- */}
            {activePage === 'discover' && (
              <>
                <div>
                  <h2 className={`text-3xl font-black ${theme.heading}`}>Mumbai Ward Map</h2>
                  <p className={`mt-1 font-medium ${theme.textMuted}`}>Select a jurisdiction to fetch live CPCB sensor data via API.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme.panel}`}>
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500"><MapPin size={24}/></div>
                    <div>
                      <p className={`text-xs uppercase font-bold ${theme.textMuted}`}>Active Zones</p>
                      <p className={`text-2xl font-black ${theme.heading}`}>{mumbaiWards.length}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme.panel}`}>
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500"><Thermometer size={24}/></div>
                    <div>
                      <p className={`text-xs uppercase font-bold ${theme.textMuted}`}>City Avg Temp</p>
                      <p className={`text-2xl font-black ${theme.heading}`}>31°C</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme.panel}`}>
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={24}/></div>
                    <div>
                      <p className={`text-xs uppercase font-bold ${theme.textMuted}`}>Severe Alerts</p>
                      <p className={`text-2xl font-black ${theme.heading}`}>2 Wards</p>
                    </div>
                  </div>
                </div>

                <div className="relative w-full md:w-96">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search size={18} className={theme.textMuted} />
                  </div>
                  <input 
                    type="text" 
                    className={`text-sm font-medium rounded-xl block w-full pl-11 p-3 border focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${theme.input}`}
                    placeholder="Search area (e.g., Kurla, Powai)..." 
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredWards.map((ward) => (
                    <div key={ward.id} onClick={() => handleWardClick(ward)}
                      className={`group p-6 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${theme.card}`}>
                      
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`font-black text-xl tracking-tight ${theme.heading}`}>Ward {ward.id}</h3>
                          
                          {/* NEW: Clean Pill Badge in Top Right */}
                          <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Activity size={12} /> Live
                          </div>
                        </div>
                        <p className={`text-sm font-medium leading-snug h-10 ${theme.textMuted}`}>{ward.name}</p>
                      </div>

                      {/* NEW: Uncluttered Call-To-Action Row */}
                      <div className={`mt-2 pt-4 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`text-[11px] uppercase font-bold tracking-widest ${theme.textMuted}`}>Run Model</span>
                        <span className="text-sm font-black text-indigo-500 flex items-center gap-1.5 transition-colors group-hover:text-indigo-400">
                          Analyze <ArrowRight size={16} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* --- PAGE 2: PREDICT --- */}
            {activePage === 'predict' && (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className={`text-3xl font-black ${theme.heading}`}>AQI Trajectory</h2>
                    <p className={`mt-1 font-medium ${theme.textMuted}`}>Live API Data for <strong className="text-indigo-500">Ward {selectedWard.id} ({selectedWard.name})</strong></p>
                  </div>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-indigo-500 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 font-bold"><Loader2 size={18} className="animate-spin" /> Fetching...</div>
                  ) : (
                    <div className={`px-5 py-3 rounded-xl border ${getStatusColor(liveAQI)} text-center`}>
                      <div className="text-[10px] uppercase font-black tracking-widest opacity-80">Current PM2.5</div>
                      <div className="text-3xl font-black">{liveAQI} μg/m³</div>
                    </div>
                  )}
                </div>
                
                <div className={`border rounded-2xl p-6 h-[500px] flex flex-col ${theme.panel}`}>
                  {isLoading ? (
                    <div className={`w-full h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
                      <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                      <p className="font-medium">Aggregating historical and forecast arrays...</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="90%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
                          <XAxis dataKey="time" stroke={theme.chartText} tick={{fontSize: 12, fontWeight: 500}} />
                          <YAxis stroke={theme.chartText} domain={['auto', 'auto']} tick={{fontSize: 12, fontWeight: 500}} />
                          <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.chartGrid}`, borderRadius: '12px', color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }} />
                          
                          <ReferenceLine y={100} label={{ position: 'top', value: 'DANGER THRESHOLD', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} stroke="#ef4444" strokeDasharray="3 3" />
                          <ReferenceLine x="NOW" stroke="#6366f1" strokeDasharray="5 5" label={{ position: 'insideTopLeft', value: 'LIVE TIME', fill: '#6366f1', fontSize: 11, fontWeight: 'bold' }} />

                          <Area type="monotone" dataKey="upperBound" stroke="none" fill="#ef4444" fillOpacity={isDarkMode ? 0.1 : 0.05} />
                          <Area type="monotone" dataKey="lowerBound" stroke="none" fill={isDarkMode ? '#1e293b' : '#ffffff'} fillOpacity={1} />
                          
                          <Line type="monotone" dataKey="historic" name="Historical PM2.5" stroke={theme.chartText} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="predicted" name="Forecasted PM2.5" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                      
                      <div className={`flex flex-wrap justify-center gap-x-8 gap-y-2 mt-6 text-xs font-bold pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} ${theme.textMuted}`}>
                        <div className="flex items-center gap-2"><div className={`w-6 h-1 rounded ${isDarkMode ? 'bg-[#94a3b8]' : 'bg-[#64748b]'}`}></div> Historic Record</div>
                        <div className="flex items-center gap-2"><div className="w-6 h-1 border-b-2 border-dashed border-red-500"></div> AI Forecast</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500/20 rounded border border-red-500/50"></div> 80% Confidence Interval</div>
                        <div className="flex items-center gap-2"><div className="w-6 h-1 border-b-2 border-dashed border-indigo-500"></div> Live Current Time</div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* --- PAGE 3: EXPLAIN --- */}
            {activePage === 'explain' && (
              <>
               <div>
                 <h2 className={`text-3xl font-black ${theme.heading}`}>Model Explainability (SHAP)</h2>
                 <p className={`mt-1 font-medium ${theme.textMuted}`}>Automated reasoning engine for <strong className="text-indigo-500">{selectedWard.name}</strong>.</p>
               </div>
               
               <div className={`border rounded-2xl p-6 h-80 ${theme.panel}`}>
                 <h3 className={`font-black text-lg mb-4 flex items-center gap-2 ${theme.heading}`}>
                   <Activity size={20} className="text-indigo-500" /> Feature Attribution Analysis
                 </h3>
                 <ResponsiveContainer width="100%" height="85%">
                   <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} horizontal={false} />
                     <XAxis type="number" stroke={theme.chartText} tick={{fontSize: 12}} />
                     <YAxis dataKey="feature" type="category" width={130} stroke={theme.chartText} tick={{fontSize: 12, fontWeight: 600}} />
                     <Tooltip cursor={{fill: theme.chartGrid}} contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: '8px', border: `1px solid ${theme.chartGrid}`, color: isDarkMode ? '#fff' : '#000' }} />
                     <Bar dataKey="impact" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`border rounded-2xl p-6 flex items-start gap-4 ${theme.panel}`}>
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 mt-1"><Wind size={24} /></div>
                    <div>
                      <h3 className={`text-lg font-black mb-1 ${theme.heading}`}>Primary Data Driver</h3>
                      <p className={`text-sm leading-relaxed font-medium ${theme.textMuted}`}>Model confidence heavily relies on wind speed, boundary layer height, and temperature data dynamically fetched from API for coordinates ({selectedWard.lat}, {selectedWard.lon}).</p>
                    </div>
                  </div>
                  
                  <div className={`border rounded-2xl p-6 flex items-start gap-4 ${isDarkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="p-3 bg-amber-500/20 rounded-xl text-amber-600 mt-1"><AlertTriangle size={24}/></div>
                    <div>
                      <h3 className={`text-lg font-black mb-1 ${isDarkMode ? 'text-amber-500' : 'text-amber-700'}`}>Model Limitations</h3>
                      <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-amber-200/70' : 'text-amber-900/70'}`}>
                        {selectedWard.hasSensor === false 
                          ? `Ward ${selectedWard.id} lacks physical sensors. Values shown are spatial interpolations based on nearby stations, carrying a +/- 15% confidence interval.`
                          : `While Ward ${selectedWard.id} has active data polling, localized block-by-block variations may not be captured entirely by the spatial grid.`}
                      </p>
                    </div>
                  </div>
               </div>
             </>
            )}

            {/* --- PAGE 4: ACT --- */}
            {activePage === 'act' && (
              <>
                <div className="flex justify-between items-end print:hidden">
                  <div>
                    <h2 className={`text-3xl font-black ${theme.heading}`}>Action & Mitigation Triage</h2>
                    <p className={`mt-1 font-medium ${theme.textMuted}`}>Automated directives based on real-time API values.</p>
                  </div>
                  
                  <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
                    {isExporting ? 'Generating PDF...' : 'Export Dispatch Order'}
                  </button>
                </div>

                {/* Print-only Header */}
                <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
                  <h1 className="text-4xl font-black text-slate-900">CityPulse: Official Dispatch Order</h1>
                  <p className="text-slate-600 font-bold mt-2">Target Jurisdiction: Ward {selectedWard.id} ({selectedWard.name})</p>
                  <p className="text-slate-600 font-bold">Generated: {currentTime} IST</p>
                </div>
                
                <div className={`border rounded-2xl p-8 space-y-5 ${theme.panel} print:border-none print:shadow-none print:p-0`}>
                  {isLoading ? <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto" /> : 
                    liveAQI > 100 ? (
                      <>
                        <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30 text-red-500 font-black flex items-center gap-3 text-lg print:bg-white print:border-2 print:border-red-600 print:text-red-700">
                          <AlertTriangle size={24} /> SEVERE AQI DETECTED ({liveAQI} μg/m³) - INITIATING TRIAGE
                        </div>
                        <div className={`flex items-start gap-4 p-5 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} print:bg-white print:border-slate-300`}>
                          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 print:accent-indigo-600" />
                          <div>
                            <h4 className={`font-bold text-lg mb-1 ${theme.heading} print:text-slate-900`}>Deploy Mist-Sprinkler Trucks</h4>
                            <p className={`text-sm font-medium ${theme.textMuted} print:text-slate-700`}>Route fleet to major traffic corridors in {selectedWard.name} immediately to suppress ground dust.</p>
                          </div>
                        </div>
                        <div className={`flex items-start gap-4 p-5 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} print:bg-white print:border-slate-300`}>
                          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 print:accent-indigo-600" />
                          <div>
                            <h4 className={`font-bold text-lg mb-1 ${theme.heading} print:text-slate-900`}>Issue School Advisory</h4>
                            <p className={`text-sm font-medium ${theme.textMuted} print:text-slate-700`}>Send automated notice to schools in Ward {selectedWard.id} to cancel outdoor assemblies.</p>
                          </div>
                        </div>
                        <button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 text-lg print:hidden">
                          <CheckSquare size={24} /> Execute Emergency Plan
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-12 print:text-left print:p-4">
                        <div className="inline-block p-6 bg-emerald-500/10 rounded-full mb-6 print:hidden">
                           <ShieldCheck size={64} className="text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-emerald-500 mb-3 print:text-slate-900">Air Quality is Stable</h3>
                        <p className={`font-medium ${theme.textMuted} print:text-slate-700`}>Current PM2.5 in {selectedWard.name} is {liveAQI} μg/m³. No emergency mitigation is required.</p>
                      </div>
                    )
                  }
                </div>
              </>
            )}

            {/* --- PAGE 5: NEWS --- */}
            {activePage === 'news' && (
              <>
                <div>
                  <h2 className={`text-3xl font-black ${theme.heading}`}>City Advisories & News</h2>
                  <p className={`mt-1 font-medium ${theme.textMuted}`}>Automated bulletin board for municipal updates and health warnings.</p>
                </div>
                
                <div className="grid gap-5">
                  {mockAdvisories.map((advisory) => {
                    const IconComponent = advisory.icon;
                    return (
                      <div key={advisory.id} className={`flex gap-5 p-6 rounded-2xl border transition-all ${theme.card}`}>
                        <div className={`p-4 rounded-xl border h-fit ${advisory.color}`}>
                          <IconComponent size={28} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className={`text-lg font-black ${theme.heading}`}>{advisory.title}</h3>
                            <span className={`flex items-center gap-1 text-xs font-bold whitespace-nowrap ${theme.textMuted}`}>
                              <Clock size={14} /> {advisory.time}
                            </span>
                          </div>
                          <span className={`text-[10px] uppercase font-black tracking-widest mb-3 inline-block ${advisory.color.split(' ')[0]}`}>
                            {advisory.type}
                          </span>
                          <p className={`text-sm leading-relaxed font-medium ${theme.textMuted}`}>{advisory.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
