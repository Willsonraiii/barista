const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion;

// --- 3D INTERACTIVE WEBGEL CANVA COMPONENT ---
function CoffeeCanvas3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !window.THREE) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 3.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const goldSpotlight = new THREE.SpotLight(0xf59e0b, 3);
    goldSpotlight.position.set(5, 5, 5);
    scene.add(goldSpotlight);

    const pointLight = new THREE.PointLight(0xd97706, 2, 10);
    pointLight.position.set(-2, 1, 2);
    scene.add(pointLight);

    // 3. Create 3D Espresso Cup Group
    const cupGroup = new THREE.Group();

    // Cup Body Material
    const ceramicMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.2,
      metalness: 0.8
    });

    // Cup Geometry
    const cupGeo = new THREE.CylinderGeometry(0.8, 0.5, 1.2, 32, 1, true);
    const cupMesh = new THREE.Mesh(cupGeo, ceramicMaterial);
    cupGroup.add(cupMesh);

    // Cup Bottom Base
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const baseMesh = new THREE.Mesh(baseGeo, ceramicMaterial);
    baseMesh.position.y = -0.6;
    cupGroup.add(baseMesh);

    // Liquid Surface Material (Amber Crema Glow)
    const cremaMaterial = new THREE.MeshStandardMaterial({
      color: 0x824413,
      roughness: 0.1,
      metalness: 0.3
    });
    const liquidGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.05, 32);
    const liquidMesh = new THREE.Mesh(liquidGeo, cremaMaterial);
    liquidMesh.position.y = 0.45;
    cupGroup.add(liquidMesh);

    // Cup Handle
    const handleGeo = new THREE.TorusGeometry(0.35, 0.08, 16, 32, Math.PI);
    const handleMesh = new THREE.Mesh(handleGeo, ceramicMaterial);
    handleMesh.position.set(0.8, 0, 0);
    handleMesh.rotation.z = -Math.PI / 2;
    cupGroup.add(handleMesh);

    // 4. Steam Particles System
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 0.6;
      positions[i + 1] = Math.random() * 1.5 + 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 0.6;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.04,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });

    const steamParticles = new THREE.Points(particleGeo, particleMat);
    cupGroup.add(steamParticles);

    scene.add(cupGroup);

    // 5. Interactive Mouse Rotation Effect
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // 6. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth Rotation
      cupGroup.rotation.y += 0.008;
      cupGroup.rotation.y += (mouseX * 0.5 - cupGroup.rotation.y) * 0.05;
      cupGroup.rotation.x += (-mouseY * 0.3 - cupGroup.rotation.x) * 0.05;

      // Animate Steam Particles Upwards
      const pos = particleGeo.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        pos[i] += 0.008;
        if (pos[i] > 2.0) pos[i] = 0.5;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-64 sm:h-80 cursor-grab active:cursor-grabbing" />;
}

// --- INITIAL DATA ---
const defaultRecipes = [
  {
    id: '1', title: 'Signature Velvet Flat White', category: 'Espresso',
    dose_grams: 19.0, yield_grams: 38.0, time_seconds: 27, temp_celsius: 93.0,
    steps: ['Extract double shot espresso into ceramic cup.', 'Steam whole milk to silky microfoam at 60°C.', 'Pour centered high, finish with close-up latte art.'],
    image_url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '2', title: 'Iced Vanilla Aerocano', category: 'Iced Coffee',
    dose_grams: 18.5, yield_grams: 37.0, time_seconds: 28, temp_celsius: 92.5,
    steps: ['Extract espresso over 100ml water and ice in steaming pitcher.', 'Steam whole mix using steam wand for 5 seconds to aerate.', 'Pour over fresh glass filled with crystal clear ice.'],
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '3', title: 'Kyoto Style Cold Drip', category: 'Filter',
    dose_grams: 50.0, yield_grams: 600.0, time_seconds: 14400, temp_celsius: 4.0,
    steps: ['Dose coarse coffee in drip tower channel.', 'Pre-wet bed with 50g ice cold water.', 'Calibrate drip rate to 1 drop every 1.5 seconds.'],
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
  }
];

const defaultLogs = [
  { id: '1', bean_name: 'Ethiopian Guji Natural', roast_profile: 'Light Roast', grind_setting: '#3.8', dose_grams: 19.5, yield_grams: 44.0, time_seconds: 26, tasting_notes: 'Jasmine floral aroma, peach candy sweetness, vibrant acidity.' },
  { id: '2', bean_name: 'Colombia Pink Bourbon', roast_profile: 'Medium Light', grind_setting: '#4.1', dose_grams: 18.5, yield_grams: 38.0, time_seconds: 29, tasting_notes: 'Pink grapefruit acidity, silky caramel finish.' }
];

// --- MAIN APP COMPONENT ---
function App() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [filter, setFilter] = useState('All');
  const [recipes, setRecipes] = useState(defaultRecipes);
  const [logs, setLogs] = useState(defaultLogs);

  // Modals & Calculator
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [calcDose, setCalcDose] = useState(18);
  const [calcRatio, setCalcRatio] = useState(2.0);

  // Form State
  const [bean, setBean] = useState('');
  const [roast, setRoast] = useState('Light Roast');
  const [grind, setGrind] = useState('');
  const [dose, setDose] = useState('');
  const [yieldVal, setYieldVal] = useState('');
  const [timeVal, setTimeVal] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveLog = (e) => {
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
    setBean(''); setGrind(''); setDose(''); setYieldVal(''); setTimeVal(''); setNotes('');
    setIsLogModalOpen(false);
  };

  const categories = ['All', 'Espresso', 'Iced Coffee', 'Filter'];
  const filteredRecipes = filter === 'All' ? recipes : recipes.filter(r => r.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* --- HERO SECTION WITH 3D CANVAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Precision Brewing Studio
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Craft Extraordinary <br/>
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              Coffee Calibrations
            </span>
          </h1>

          <p className="text-stone-400 text-sm sm:text-base leading-relaxed max-w-xl">
            Specialty barista SOP guidebook, grinder dial-in history, and interactive 3D WebGL ratio calculator.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
            <button 
              onClick={() => setActiveTab('recipes')} 
              className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'recipes' ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20' : 'glass-panel text-stone-400 hover:text-stone-200'}`}
            >
              Explore Recipes
            </button>
            <button 
              onClick={() => setActiveTab('calibration')} 
              className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'calibration' ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20' : 'glass-panel text-stone-400 hover:text-stone-200'}`}
            >
              Dial-In Logs ({logs.length})
            </button>
            <button 
              onClick={() => setIsCalcOpen(true)} 
              className="glass-panel text-amber-400 hover:border-amber-500/50 px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition"
            >
              <span>🧮</span> Ratio Scaler
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Container */}
        <div className="lg:col-span-5 relative">
          <div className="glass-panel rounded-3xl p-4 border border-amber-500/20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 text-[10px] uppercase font-mono font-bold tracking-widest text-amber-500/80 bg-stone-950/80 px-3 py-1 rounded-full border border-stone-800">
              WebGL 3D Engine • Drag to Rotate
            </div>
            <CoffeeCanvas3D />
          </div>
        </div>
      </div>

      {/* --- TAB CONTENT: RECIPES --- */}
      {activeTab === 'recipes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition ${filter === cat ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20' : 'glass-panel text-stone-400 hover:text-stone-200'}`}
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
                  className="glass-panel glass-panel-hover rounded-3xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover transition duration-700 hover:scale-105" />
                      <div className="absolute top-4 left-4 bg-stone-950/90 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-xl border border-stone-800">
                        {recipe.category}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4 text-stone-100">{recipe.title}</h3>

                      <div className="grid grid-cols-3 gap-2 bg-stone-950/80 p-3 rounded-2xl border border-stone-800/80 text-center text-xs mb-5">
                        <div>
                          <span className="block text-stone-500 text-[10px] uppercase font-bold">Dose</span>
                          <span className="font-extrabold text-amber-400 mt-0.5 block">{recipe.dose_grams}g</span>
                        </div>
                        <div className="border-x border-stone-800">
                          <span className="block text-stone-500 text-[10px] uppercase font-bold">Yield</span>
                          <span className="font-extrabold text-amber-400 mt-0.5 block">{recipe.yield_grams}g</span>
                        </div>
                        <div>
                          <span className="block text-stone-500 text-[10px] uppercase font-bold">Time</span>
                          <span className="font-extrabold text-amber-400 mt-0.5 block">{recipe.time_seconds}s</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Brewing SOP Steps</h4>
                      <ol className="space-y-2 text-xs text-stone-300">
                        {recipe.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start bg-stone-950/40 p-2.5 rounded-xl border border-stone-900">
                            <span className="bg-amber-500/20 text-amber-400 font-bold rounded-lg w-5 h-5 flex items-center justify-center shrink-0 text-[10px]">{idx + 1}</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* --- TAB CONTENT: DIAL-IN LOGS --- */}
      {activeTab === 'calibration' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-stone-100">Grinder Dial-In Calibration</h2>
              <p className="text-xs text-stone-400 mt-1">Record shot extractions, grind sizes, and tasting profiles.</p>
            </div>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition"
            >
              + Add Dial-In Entry
            </button>
          </div>

          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-amber-400">{log.bean_name}</h3>
                    <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {log.roast_profile}
                    </span>
                    <span className="bg-stone-950 border border-stone-800 text-stone-300 text-xs font-bold px-3 py-1 rounded-lg">
                      Grind Setting: <strong className="text-amber-400">{log.grind_setting}</strong>
                    </span>
                  </div>
                  {log.tasting_notes && (
                    <p className="text-xs text-stone-400 italic bg-stone-950/60 p-3 rounded-xl border border-stone-800/50">
                      "{log.tasting_notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs text-stone-300 shrink-0">
                  <div>Dose: <strong className="text-amber-400 font-bold">{log.dose_grams}g</strong></div>
                  <div className="text-stone-800">|</div>
                  <div>Yield: <strong className="text-amber-400 font-bold">{log.yield_grams}g</strong></div>
                  <div className="text-stone-800">|</div>
                  <div>Time: <strong className="text-amber-400 font-bold">{log.time_seconds}s</strong></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* --- RATIO CALCULATOR MODAL --- */}
      <AnimatePresence>
        {isCalcOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCalcOpen(false)} className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative glass-panel p-6 rounded-3xl w-full max-w-md border-amber-500/30 z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-amber-400">Interactive Brew Ratio Scaler</h3>
                <button onClick={() => setIsCalcOpen(false)} className="text-stone-500 hover:text-stone-200">✕</button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Coffee Dose (grams)</label>
                  <input type="number" step="0.5" value={calcDose} onChange={(e) => setCalcDose(parseFloat(e.target.value) || 0)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 font-bold focus:outline-none focus:border-amber-500" />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Target Ratio (1 : {calcRatio})</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1.5, 2.0, 2.5, 15.0].map((r) => (
                      <button key={r} onClick={() => setCalcRatio(r)} className={`py-2.5 rounded-xl font-bold transition ${calcRatio === r ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 border border-stone-800 text-stone-400'}`}>1:{r}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/30 flex justify-between items-center mt-4">
                  <span className="text-stone-400 font-medium">Calculated Target Yield</span>
                  <span className="text-2xl font-black text-amber-400">{(calcDose * calcRatio).toFixed(1)}g</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DIAL-IN MODAL --- */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLogModalOpen(false)} className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative glass-panel p-6 rounded-3xl w-full max-w-lg z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-amber-400">Record Grinder Dial-In</h3>
                <button onClick={() => setIsLogModalOpen(false)} className="text-stone-500 hover:text-stone-200">✕</button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1">Bean Variety</label>
                  <input type="text" required placeholder="e.g. Kenya AA Washed" value={bean} onChange={e => setBean(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1">Roast Profile</label>
                    <select value={roast} onChange={e => setRoast(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500">
                      <option>Light Roast</option>
                      <option>Medium Roast</option>
                      <option>Dark Roast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Grind Setting</label>
                    <input type="text" required placeholder="#3.5" value={grind} onChange={e => setGrind(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1">Dose (g)</label>
                    <input type="number" step="0.1" placeholder="18.5" value={dose} onChange={e => setDose(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Yield (g)</label>
                    <input type="number" step="0.1" placeholder="37.0" value={yieldVal} onChange={e => setYieldVal(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Time (sec)</label>
                    <input type="number" placeholder="28" value={timeVal} onChange={e => setTimeVal(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Tasting Notes</label>
                  <textarea rows="2" placeholder="Floral aromas, citric acid, chocolate finish..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsLogModalOpen(false)} className="w-1/2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 rounded-xl transition">Cancel</button>
                  <button type="submit" className="w-1/2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold py-3 rounded-xl transition shadow-lg shadow-amber-500/20">Save Dial-In</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
