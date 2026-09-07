const { useState, useEffect } = React;
const { motion, AnimatePresence } = window.Motion;

// Optional: Add your Supabase credentials here for persistence
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabase = null;
if (SUPABASE_URL !== "YOUR_SUPABASE_URL" && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Initial Data
const defaultRecipes = [
  {
    id: '1', title: 'Signature Iced Latte', category: 'Iced Coffee',
    dose_grams: 18.5, yield_grams: 38.0, time_seconds: 28, temp_celsius: 92.5, grind_setting: 'Fine (#4)',
    steps: ['Fill glass completely with ice cubes.', 'Pour 150ml cold fresh milk and sweetener syrup.', 'Extract a double espresso shot over top and stir gently.'],
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '2', title: 'Classic Espresso Shot', category: 'Espresso',
    dose_grams: 20.0, yield_grams: 42.0, time_seconds: 27, temp_celsius: 93.0, grind_setting: 'Fine-Medium (#3.5)',
    steps: ['Purge and dry portafilter basket.', 'Dose 20g freshly ground coffee evenly with WDT tool.', 'Tamp flat, lock in portafilter, and extract immediately.'],
    image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '3', title: 'Strawberry Matcha Latte', category: 'Matcha & Tea',
    dose_grams: 3.0, yield_grams: 50.0, time_seconds: 45, temp_celsius: 80.0, grind_setting: 'Powder',
    steps: ['Add 30ml strawberry puree to bottom of glass with ice.', 'Pour cold milk leaving room at top.', 'Whisk matcha powder with warm water until frothy and layer on top.'],
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80'
  }
];

const defaultLogs = [
  { id: '1', bean_name: 'Ethiopia Yirgacheffe', roast_profile: 'Light Roast', grind_setting: '#4.2', dose_grams: 19.0, yield_grams: 40.5, time_seconds: 26, tasting_notes: 'Bright citrus acidity, delicate floral notes.' },
  { id: '2', bean_name: 'House Blend Dark', roast_profile: 'Dark Roast', grind_setting: '#3.8', dose_grams: 18.5, yield_grams: 37.0, time_seconds: 30, tasting_notes: 'Deep dark chocolate body, thick crema.' }
];

function App() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [filter, setFilter] = useState('All');
  const [recipes, setRecipes] = useState(defaultRecipes);
  const [logs, setLogs] = useState(defaultLogs);
  
  // Modals
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Calculator State
  const [calcDose, setCalcDose] = useState(18);
  const [calcRatio, setCalcRatio] = useState(2);
  const [calcCups, setCalcCups] = useState(1);

  // Log Form State
  const [bean, setBean] = useState('');
  const [roast, setRoast] = useState('Medium Roast');
  const [grind, setGrind] = useState('');
  const [dose, setDose] = useState('');
  const [yieldVal, setYieldVal] = useState('');
  const [timeVal, setTimeVal] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (supabase) {
      supabase.from('recipes').select('*').then(({ data }) => { if (data?.length) setRecipes(data); });
      supabase.from('dial_in_logs').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data?.length) setLogs(data); });
    }
  }, []);

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!bean || !grind) return;

    const newEntry = {
      id: Date.now().toString(),
      bean_name: bean,
      roast_profile: roast,
      grind_setting: grind,
      dose_grams: parseFloat(dose) || 0,
      yield_grams: parseFloat(yieldVal) || 0,
      time_seconds: parseInt(timeVal) || 0,
      tasting_notes: notes
    };

    setLogs([newEntry, ...logs]);
    if (supabase) {
      await supabase.from('dial_in_logs').insert([newEntry]);
    }

    setBean(''); setGrind(''); setDose(''); setYieldVal(''); setTimeVal(''); setNotes('');
    setIsLogModalOpen(false);
  };

  const categories = ['All', 'Espresso', 'Iced Coffee', 'Matcha & Tea'];
  const filteredRecipes = filter === 'All' ? recipes : recipes.filter(r => r.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-amber-500 text-xs font-semibold uppercase tracking-widest mb-4">
          <span>☕</span> Specialty Barista Companion
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent">
          Barista Guidebook
        </h1>
        <p className="text-stone-400 text-sm mt-2 max-w-md mx-auto">
          Precision brewing SOPs and real-time grinder dial-in calibration log.
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <div className="flex items-center bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 backdrop-blur-md shadow-inner">
            {['recipes', 'calibration'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === tab ? 'text-stone-950 font-extrabold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute inset-0 bg-amber-500 rounded-xl shadow-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {tab === 'recipes' ? 'Recipe SOPs' : `Dial-In Logs (${logs.length})`}
                </span>
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCalcOpen(true)}
            className="bg-stone-900 border border-amber-500/30 hover:border-amber-500 text-amber-400 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition backdrop-blur-md shadow-lg"
          >
            <span>🧮</span> Ratio Calculator
          </motion.button>
        </div>
      </motion.header>

      {/* TAB 1: RECIPES */}
      {activeTab === 'recipes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-2xl text-xs font-bold transition ${
                  filter === cat ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20' : 'bg-stone-900 border border-stone-800 text-stone-400 hover:bg-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRecipes.map((recipe) => (
                <motion.div
                  layout
                  key={recipe.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -6 }}
                  className="bg-stone-900/60 border border-stone-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md group hover:border-amber-500/40 transition"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl border border-stone-800">
                      {recipe.category}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 group-hover:text-amber-400 transition">{recipe.title}</h3>

                    <div className="grid grid-cols-3 gap-2 bg-stone-950/90 p-3 rounded-2xl border border-stone-800/80 text-center text-xs mb-4 shadow-inner">
                      <div>
                        <span className="block text-stone-500 text-[10px] uppercase font-medium">Dose</span>
                        <span className="font-bold text-stone-200 mt-0.5">{recipe.dose_grams}g</span>
                      </div>
                      <div className="border-x border-stone-800">
                        <span className="block text-stone-500 text-[10px] uppercase font-medium">Yield</span>
                        <span className="font-bold text-stone-200 mt-0.5">{recipe.yield_grams}g</span>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[10px] uppercase font-medium">Time</span>
                        <span className="font-bold text-stone-200 mt-0.5">{recipe.time_seconds}s</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Preparation Steps</h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-stone-300 leading-relaxed bg-stone-950/40 p-3 rounded-xl border border-stone-900">
                      {recipe.steps.map((step, idx) => (
                        <li key={idx} className="marker:text-amber-500 marker:font-bold">{step}</li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* TAB 2: CALIBRATION LOGS */}
      {activeTab === 'calibration' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-900/60 p-5 rounded-3xl border border-stone-800/80 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-bold text-stone-100">Grinder Dial-In Logs</h2>
              <p className="text-xs text-stone-400 mt-1">Record shot timing, grind sizes, and tasting profiles.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLogModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition"
            >
              + Log Dial-In Entry
            </motion.button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-stone-900/70 border border-stone-800/80 p-5 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4 backdrop-blur-md shadow-xl"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-amber-400 text-base">{log.bean_name}</h3>
                      {log.roast_profile && (
                        <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {log.roast_profile}
                        </span>
                      )}
                      <span className="bg-stone-950 border border-stone-800 text-stone-300 text-xs font-semibold px-3 py-0.5 rounded-lg">
                        Grind: <strong className="text-amber-400">{log.grind_setting}</strong>
                      </span>
                    </div>
                    {log.tasting_notes && (
                      <p className="text-xs text-stone-400 italic bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/50">
                        "{log.tasting_notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 bg-stone-950 p-3 rounded-2xl border border-stone-800/80 text-xs text-stone-300">
                    <div>Dose: <strong className="text-amber-400 font-bold">{log.dose_grams}g</strong></div>
                    <div className="text-stone-800">|</div>
                    <div>Yield: <strong className="text-amber-400 font-bold">{log.yield_grams}g</strong></div>
                    <div className="text-stone-800">|</div>
                    <div>Time: <strong className="text-amber-400 font-bold">{log.time_seconds}s</strong></div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* RATIO CALCULATOR MODAL */}
      <AnimatePresence>
        {isCalcOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCalcOpen(false)} className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-stone-900 border border-stone-800 p-6 rounded-3xl w-full max-w-md shadow-2xl z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-amber-500">Brewing Ratio Scaler</h3>
                <button onClick={() => setIsCalcOpen(false)} className="text-stone-500 hover:text-stone-200">✕</button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1">Dose Per Shot (g)</label>
                  <input type="number" step="0.1" value={calcDose} onChange={(e) => setCalcDose(parseFloat(e.target.value) || 0)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 font-bold focus:outline-none focus:border-amber-500" />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Ratio (1 : {calcRatio})</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1.5, 2.0, 2.5, 15.0].map((r) => (
                      <button key={r} onClick={() => setCalcRatio(r)} className={`py-2 rounded-xl font-bold ${calcRatio === r ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 border border-stone-800 text-stone-400'}`}>1:{r}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Servings / Cups</label>
                  <input type="number" min="1" value={calcCups} onChange={(e) => setCalcCups(parseInt(e.target.value) || 1)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 font-bold focus:outline-none focus:border-amber-500" />
                </div>

                <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/30 flex justify-between items-center mt-4">
                  <span className="text-stone-400 font-medium">Target Liquid Yield</span>
                  <span className="text-2xl font-black text-amber-400">{(calcDose * calcRatio * calcCups).toFixed(1)}g</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW DIAL-IN LOG MODAL */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLogModalOpen(false)} className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-stone-900 border border-stone-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-amber-500">Record Dial-In Log</h3>
                <button onClick={() => setIsLogModalOpen(false)} className="text-stone-500 hover:text-stone-200">✕</button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1">Bean Name / Roast</label>
                  <input type="text" required placeholder="e.g. Colombia Nariño" value={bean} onChange={e => setBean(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:outline-none focus:border-amber-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1">Roast Profile</label>
                    <select value={roast} onChange={e => setRoast(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:outline-none focus:border-amber-500">
                      <option>Light Roast</option>
                      <option>Medium Roast</option>
                      <option>Dark Roast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Grind Setting</label>
                    <input type="text" required placeholder="#4.0" value={grind} onChange={e => setGrind(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1">Dose (g)</label>
                    <input type="number" step="0.1" placeholder="18.5" value={dose} onChange={e => setDose(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Yield (g)</label>
                    <input type="number" step="0.1" placeholder="37.0" value={yieldVal} onChange={e => setYieldVal(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Time (sec)</label>
                    <input type="number" placeholder="28" value={timeVal} onChange={e => setTimeVal(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Tasting Notes</label>
                  <textarea rows="2" placeholder="Balanced body, floral aromas..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:outline-none focus:border-amber-500" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsLogModalOpen(false)} className="w-1/2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 rounded-xl transition">Cancel</button>
                  <button type="submit" className="w-1/2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20">Save Log</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Render React App to DOM
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
