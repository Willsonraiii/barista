const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion;

// --- WEB AUDIO SYNTHESIZER (ZERO EXTERNAL FILES) ---
const playSound = (type = 'click') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'pour') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Audio Context silenced if user hasn't interacted yet
  }
};

// --- DYNAMIC 3D WEBGEL ENGINE WITH SHOT POUR SIMULATION ---
function CoffeeCanvas3D({ isPouring, setIsPouring }) {
  const mountRef = useRef(null);
  const liquidMeshRef = useRef(null);
  const streamMeshRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !window.THREE) return;

    // 1. Scene & Lighting Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.3, 3.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainGoldLight = new THREE.SpotLight(0xf59e0b, 4);
    mainGoldLight.position.set(5, 6, 4);
    scene.add(mainGoldLight);

    const backRimLight = new THREE.PointLight(0xd97706, 2, 10);
    backRimLight.position.set(-3, 2, -2);
    scene.add(backRimLight);

    // 2. Cup Object
    const cupGroup = new THREE.Group();

    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x171513, roughness: 0.15, metalness: 0.85 });
    
    // Outer Shell
    const cupGeo = new THREE.CylinderGeometry(0.82, 0.52, 1.25, 32, 1, true);
    const cupMesh = new THREE.Mesh(cupGeo, ceramicMat);
    cupGroup.add(cupMesh);

    // Bottom Base
    const baseGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.1, 32);
    const baseMesh = new THREE.Mesh(baseGeo, ceramicMat);
    baseMesh.position.y = -0.62;
    cupGroup.add(baseMesh);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.36, 0.08, 16, 32, Math.PI);
    const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
    handleMesh.position.set(0.82, 0, 0);
    handleMesh.rotation.z = -Math.PI / 2;
    cupGroup.add(handleMesh);

    // Liquid Crema Surface
    const cremaMat = new THREE.MeshStandardMaterial({ color: 0x924b16, roughness: 0.2, metalness: 0.1 });
    const liquidGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.05, 32);
    const liquidMesh = new THREE.Mesh(liquidGeo, cremaMat);
    liquidMesh.position.y = 0.1; // Starts lower for pour animation
    liquidMeshRef.current = liquidMesh;
    cupGroup.add(liquidMesh);

    // Extraction Liquid Stream Mesh
    const streamGeo = new THREE.CylinderGeometry(0.03, 0.02, 2.5, 16);
    const streamMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.1, transparent: true, opacity: 0 });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.position.set(0, 1.4, 0);
    streamMeshRef.current = streamMesh;
    cupGroup.add(streamMesh);

    // 3. Dynamic Steam Particles
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 0.5;
      positions[i + 1] = Math.random() * 1.8 + 0.3;
      positions[i + 2] = (Math.random() - 0.5) * 0.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const steamParticles = new THREE.Points(particleGeo, particleMat);
    cupGroup.add(steamParticles);
    scene.add(cupGroup);

    // Mouse Tracking Rotation
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      // Ambient dynamic cursor glow
      const ambientGlow = document.getElementById('ambient-glow');
      if (ambientGlow) {
        ambientGlow.style.background = `radial-gradient(600px at ${e.clientX}px ${e.clientY}px, rgba(245, 158, 11, 0.15), transparent 80%)`;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    // Render Loop
    let animId;
    let streamOpacity = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth Rotation
      cupGroup.rotation.y += 0.006;
      cupGroup.rotation.y += (mouseX * 0.4 - cupGroup.rotation.y) * 0.04;
      cupGroup.rotation.x += (-mouseY * 0.2 - cupGroup.rotation.x) * 0.04;

      // Animate Steam
      const pos = particleGeo.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        pos[i] += 0.009;
        if (pos[i] > 2.2) pos[i] = 0.3;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Shot Pour Logic Animation
      if (streamMeshRef.current && liquidMeshRef.current) {
        if (isPouring) {
          if (streamOpacity < 0.9) streamOpacity += 0.05;
          if (liquidMeshRef.current.position.y < 0.48) liquidMeshRef.current.position.y += 0.004;
        } else {
          if (streamOpacity > 0) streamOpacity -= 0.05;
        }
        streamMeshRef.current.material.opacity = Math.max(0, streamOpacity);
      }

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
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPouring]);

  return <div ref={mountRef} className="w-full h-72 sm:h-80 cursor-grab active:cursor-grabbing" />;
}

// --- INITIAL DEFAULT DATA ---
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

// --- MAIN APPLICATION ---
function App() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [filter, setFilter] = useState('All');
  const [recipes, setRecipes] = useState(defaultRecipes);
  const [logs, setLogs] = useState(defaultLogs);

  // 3D Shot Simulator State
  const [isPouring, setIsPouring] = useState(false);

  // Scaler Calculator State
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcDose, setCalcDose] = useState(18);
  const [calcRatio, setCalcRatio] = useState(2.0);

  // Dial-In Form Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [bean, setBean] = useState('');
  const [roast, setRoast] = useState('Light Roast');
  const [grind, setGrind] = useState('');
  const [dose, setDose] = useState('18.5');
  const [yieldVal, setYieldVal] = useState('37.0');
  const [timeVal, setTimeVal] = useState('28');
  const [notes, setNotes] = useState('');

  // Live Assistant Flavor Health Feedback Calculation
  const calculateFlavorFeedback = () => {
    const d = parseFloat(dose) || 1;
    const y = parseFloat(yieldVal) || 1;
    const t = parseInt(timeVal) || 1;
    const ratio = y / d;

    if (t < 22 || ratio > 2.5) {
      return { status: 'Under-Extracted (Sour)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', tip: 'Grind finer or decrease yield. Shot running too fast.' };
    } else if (t > 32 || ratio < 1.5) {
      return { status: 'Over-Extracted (Bitter)', color: 'text-red-400 bg-red-500/10 border-red-500/30', tip: 'Grind coarser or increase yield. Flow is restricted.' };
    }
    return { status: 'Ideal Gold Extraction ✨', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', tip: 'Balanced sweetness, pleasant acidity, rich body.' };
  };

  const flavorFeedback = calculateFlavorFeedback();

  const handlePourSimulate = () => {
    playSound('pour');
    setIsPouring(true);
    setTimeout(() => {
      setIsPouring(false);
      playSound('success');
    }, 3500);
  };

  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!bean || !grind) return;

    playSound('success');
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
    setBean(''); setGrind(''); setNotes('');
    setIsLogModalOpen(false);
  };

  const categories = ['All', 'Espresso', 'Iced Coffee', 'Filter'];
  const filteredRecipes = filter === 'All' ? recipes : recipes.filter(r => r.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* --- HERO SECTION WITH WEBGEL 3D CANVAS & SHOT SIMULATOR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span> Live Interactive Barista Studio
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
            Master Every Shot with <br/>
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              Precision SOPs
            </span>
          </h1>

          <p className="text-stone-400 text-sm sm:text-base leading-relaxed max-w-xl">
            Dial-in grinder calibrations, view animated 3D shot extractions, and calculate optimal espresso ratios in real time.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
            <button 
              onClick={() => { playSound('click'); setActiveTab('recipes'); }} 
              className={`px-6 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition ${activeTab === 'recipes' ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/25 scale-105' : 'glass-panel text-stone-300 hover:text-white'}`}
            >
              📖 Recipes SOP
            </button>
            <button 
              onClick={() => { playSound('click'); setActiveTab('calibration'); }} 
              className={`px-6 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition ${activeTab === 'calibration' ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/25 scale-105' : 'glass-panel text-stone-300 hover:text-white'}`}
            >
              ☕ Dial-In History ({logs.length})
            </button>
            <button 
              onClick={() => { playSound('click'); setIsCalcOpen(true); }} 
              className="glass-panel hover:border-amber-500/50 text-amber-400 px-5 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition"
            >
              🧮 Ratio Scaler
            </button>
          </div>
        </div>

        {/* 3D WebGL Glass Container with Simulated Extraction Trigger */}
        <div className="lg:col-span-5 relative">
          <div className="glass-panel rounded-3xl p-4 border border-amber-500/20 relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-500/80 bg-stone-950/80 px-3 py-1 rounded-full border border-stone-800">
                Interactive 3D Engine
              </span>
              <button
                onClick={handlePourSimulate}
                disabled={isPouring}
                className={`text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl border transition ${isPouring ? 'bg-amber-500 text-stone-950 border-amber-400 animate-pulse' : 'bg-stone-900 border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-stone-950'}`}
              >
                {isPouring ? '⚡ Extracting...' : '▶ Simulate Shot Pour'}
              </button>
            </div>

            <CoffeeCanvas3D isPouring={isPouring} setIsPouring={setIsPouring} />
          </div>
        </div>
      </div>

      {/* --- TAB CONTENT 1: RECIPES WITH IMAGE HOVER & STEP BADGES --- */}
      {activeTab === 'recipes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { playSound('click'); setFilter(cat); }}
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
                  className="glass-panel glass-card-interactive rounded-3xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover transition duration-700 hover:scale-110" />
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

      {/* --- TAB CONTENT 2: DIAL-IN HISTORY LOGS --- */}
      {activeTab === 'calibration' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-stone-100">Grinder Dial-In Calibration</h2>
              <p className="text-xs text-stone-400 mt-1">Record shot extractions, grind sizes, and tasting profiles.</p>
            </div>
            <button
              onClick={() => { playSound('click'); setIsLogModalOpen(true); }}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition"
            >
              + Add Dial-In Entry
            </button>
          </div>

          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="glass-panel glass-card-interactive p-6 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-amber-400">{log.bean_name}</h3>
                    <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {log.roast_profile}
                    </span>
                    <span className="bg-stone-950 border border-stone-800 text-stone-300 text-xs font-bold px-3 py-1 rounded-lg">
                      Grind: <strong className="text-amber-400">{log.grind_setting}</strong>
                    </span>
                  </div>
                  {log.tasting_notes && (
                    <p className="text-xs text-stone-300 italic bg-stone-950/60 p-3 rounded-xl border border-stone-800/50">
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

      {/* --- RATIO CALCULATOR SCALER MODAL --- */}
      <AnimatePresence>
        {isCalcOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCalcOpen(false)} className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative glass-panel p-6 rounded-3xl w-full max-w-md border-amber-500/30 z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-amber-400">Interactive Brew Ratio Scaler</h3>
                <button onClick={() => setIsCalcOpen(false)} className="text-stone-500 hover:text-stone-200">✕</button>
              </div>

              <div className="space-y-5 text-xs">
                <div>
                  <div className="flex justify-between text-stone-400 mb-1 font-semibold">
                    <span>Coffee Dose</span>
                    <span className="text-amber-400 font-bold">{calcDose}g</span>
                  </div>
                  <input type="range" min="10" max="30" step="0.5" value={calcDose} onChange={(e) => { playSound('click'); setCalcDose(parseFloat(e.target.value)); }} className="w-full accent-amber-500 bg-stone-950 rounded-lg h-2 cursor-pointer" />
                </div>

                <div>
                  <label className="block text-stone-400 mb-2 font-semibold">Target Brew Ratio (1 : {calcRatio})</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1.5, 2.0, 2.5, 15.0].map((r) => (
                      <button key={r} onClick={() => { playSound('click'); setCalcRatio(r); }} className={`py-2.5 rounded-xl font-bold transition ${calcRatio === r ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'}`}>1:{r}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-950 p-5 rounded-2xl border border-amber-500/30 flex justify-between items-center mt-4">
                  <span className="text-stone-400 font-medium">Target Yield Output</span>
                  <span className="text-3xl font-black text-amber-400">{(calcDose * calcRatio).toFixed(1)}g</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DIAL-IN MODAL WITH LIVE FLAVOR FEEDBACK ENGINE --- */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLogModalOpen(false)} className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative glass-panel p-6 rounded-3xl w-full max-w-lg z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-amber-400">Record Grinder Dial-In</h3>
                <button onClick={() => setIsLogModalOpen(false)} className="text-stone-500 hover:text-stone-200">✕</button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Bean Variety / Origin</label>
                  <input type="text" required placeholder="e.g. Kenya AA Washed" value={bean} onChange={e => setBean(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Roast Profile</label>
                    <select value={roast} onChange={e => setRoast(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500">
                      <option>Light Roast</option>
                      <option>Medium Roast</option>
                      <option>Dark Roast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Grind Setting</label>
                    <input type="text" required placeholder="#3.5" value={grind} onChange={e => setGrind(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Dose (g)</label>
                    <input type="number" step="0.1" placeholder="18.5" value={dose} onChange={e => setDose(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500 font-bold text-amber-400" />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Yield (g)</label>
                    <input type="number" step="0.1" placeholder="37.0" value={yieldVal} onChange={e => setYieldVal(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500 font-bold text-amber-400" />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Time (sec)</label>
                    <input type="number" placeholder="28" value={timeVal} onChange={e => setTimeVal(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500 font-bold text-amber-400" />
                  </div>
                </div>

                {/* LIVE ASSISTANT EXTRACTION HEALTH METER */}
                <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition ${flavorFeedback.color}`}>
                  <div className="font-extrabold flex items-center gap-1.5 mb-0.5">
                    <span>⚡ Extraction Diagnostic:</span>
                    <span>{flavorFeedback.status}</span>
                  </div>
                  <p className="text-[11px] opacity-80">{flavorFeedback.tip}</p>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Tasting Profile & Notes</label>
                  <textarea rows="2" placeholder="Floral aromas, citric acid, chocolate finish..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsLogModalOpen(false)} className="w-1/2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3.5 rounded-xl transition">Cancel</button>
                  <button type="submit" className="w-1/2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20">Save Dial-In</button>
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
