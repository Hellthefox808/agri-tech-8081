'use client';

export default function ArchitectureView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel border border-slate-800/80 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">7-Layer Enterprise Model</h3>
        
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
            <div className="flex justify-between text-xs font-bold font-mono-data text-white">
              <span>Layer 1: Presentation Layer</span>
              <span className="text-[#00D2FF]">Flutter 3.x / React Dashboard</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Responsive dashboards and mobile interfaces containing multi-language localization routers.</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
            <div className="flex justify-between text-xs font-bold font-mono-data text-white">
              <span>Layer 2: Authentication & Identity Layer</span>
              <span className="text-[#00D2FF]">MFA OAuth2 JWT</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Enforces roles and permission scopes along with the 10 state admins licensing check.</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
            <div className="flex justify-between text-xs font-bold font-mono-data text-white">
              <span>Layer 3: Application Layer</span>
              <span className="text-[#00D2FF]">FastAPI Microservices</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Calculates produce registry values, yields, and triggers alerts.</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
            <div className="flex justify-between text-xs font-bold font-mono-data text-white">
              <span>Layer 4: AIoT Processing Layer</span>
              <span className="text-[#00D2FF]">FreeRTOS ESP32-S3</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Executes TensorFlow Lite Micro edge inferences and controls local actuators.</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
            <div className="flex justify-between text-xs font-bold font-mono-data text-white">
              <span>Layer 5: Data Layer</span>
              <span className="text-[#00D2FF]">MongoDB (agri-tech-ai)</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Stores geocoded coordinate profiles and SoilGrids parameters.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
