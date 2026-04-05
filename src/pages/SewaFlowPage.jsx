import { Navbar } from '@/components/Navbar'
import {
  MapPin,
  CheckCircle2,
  Stethoscope,
  ShieldAlert,
  CreditCard,
  ArrowRight,
  User,
  Users,
  Heart,
  MessageCircle,
  Camera,
  Navigation,
  Check,
  AlertTriangle,
  Zap
} from 'lucide-react'

export default function SewaFlowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e0f2f1] font-sans pb-20">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#0077b6] text-white py-12 text-center shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold flex items-center justify-center gap-4 animate-in fade-in slide-in-from-top duration-700">
            <Zap className="h-10 w-10 text-yellow-300" />
            SEWA — UPDATED COMPLETE FLOW
          </h1>
          <p className="text-xl mt-4 opacity-90 font-medium">
            Report → Verify → Respond | One Pipeline. One Bridge Between Need and Help.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 mt-8 space-y-12">
        
        {/* ENTRY POINT */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 transform transition-all hover:scale-[1.01] duration-300 border border-blue-50">
          <h2 className="text-3xl font-bold text-center mb-10 text-[#0077b6] flex items-center justify-center gap-3">
            <span className="p-2 bg-blue-50 rounded-2xl">🚪</span> ENTRY POINT
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            <div className="bg-[#0077b6] text-white px-10 py-6 rounded-3xl text-xl font-bold shadow-lg shadow-blue-200 ring-4 ring-blue-50">
              User Opens SEWA App
            </div>
            <ArrowRight className="hidden md:block h-10 w-10 text-blue-300 animate-pulse" />
            <div className="md:hidden text-4xl text-blue-300">↓</div>
            <div className="bg-[#0077b6] text-white px-10 py-6 rounded-3xl text-xl font-bold shadow-lg shadow-blue-200 ring-4 ring-blue-50">
              Login / Register
            </div>
            <ArrowRight className="hidden md:block h-10 w-10 text-blue-300 animate-pulse" />
            <div className="md:hidden text-4xl text-blue-300">↓</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
              <div className="bg-red-50 text-red-700 px-6 py-6 rounded-3xl font-bold border-2 border-red-100 flex flex-col items-center gap-2">
                <User className="h-6 w-6" />
                PERSON IN NEED
              </div>
              <div className="bg-blue-50 text-blue-700 px-6 py-6 rounded-3xl font-bold border-2 border-blue-100 flex flex-col items-center gap-2">
                <Stethoscope className="h-6 w-6" />
                PROFESSIONAL HELPER
              </div>
              <div className="bg-green-50 text-green-700 px-6 py-6 rounded-3xl font-bold border-2 border-green-100 flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                VOLUNTEER
              </div>
            </div>
          </div>
        </div>

        {/* THREE CORE TASKS GRID */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* TASK 1 */}
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-t-[10px] border-[#00d4aa] flex flex-col">
            <h2 className="text-2xl font-bold mb-8 flex items-start gap-4">
              <div className="bg-[#00d4aa]/10 p-3 rounded-2xl">
                <MapPin className="h-8 w-8 text-[#00d4aa]" />
              </div>
              <span className="leading-tight">TASK 1 — Geo-tagged Problem Feed & Reporting System</span>
            </h2>
            <div className="space-y-6 flex-grow">
              <div className="relative bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-3 font-medium">
                <span className="bg-[#00d4aa] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                Person in Need opens "Report a Problem"
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl flex flex-col items-center gap-2">
                  <Camera className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-semibold">Upload Photo</span>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl flex flex-col items-center gap-2">
                  <Navigation className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-semibold leading-tight">Drop GPS Pin</span>
                  <span className="text-[10px] text-gray-400">(Auto/Manual)</span>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl flex flex-col items-center gap-2">
                  <Heart className="h-5 w-5 text-gray-400" />
                  <span className="text-xs font-semibold leading-tight">Select Category</span>
                </div>
              </div>
              <div className="relative bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-3 font-medium">
                <span className="bg-[#00d4aa] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                Add Description (in their own language)
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 font-bold text-emerald-800 shadow-sm flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                Problem Submitted → Goes to VERIFICATION (Task 3) + Goes LIVE
              </div>
              <div className="bg-gray-100 p-5 rounded-2xl text-center text-sm font-bold text-gray-600 border border-gray-200">
                PROBLEM FEED — Visible to ALL<br/>
                <span className="font-normal text-xs text-gray-500">Sorted by Urgency / Location / Category</span>
              </div>
            </div>
          </div>

          {/* TASK 3 */}
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-t-[10px] border-[#00a3a3] flex flex-col scale-[1.03] z-10 ring-4 ring-white">
            <h2 className="text-2xl font-bold mb-8 flex items-start gap-4">
              <div className="bg-[#00a3a3]/10 p-3 rounded-2xl">
                <CheckCircle2 className="h-8 w-8 text-[#00a3a3]" />
              </div>
              <span className="leading-tight">TASK 3 — ASHA Worker Tagging & Direct Chat</span>
            </h2>
            <div className="space-y-6 flex-grow">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-medium flex items-center gap-3">
                 <span className="bg-[#00a3a3] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                 Problem Submitted
              </div>
              <div className="text-center bg-white p-5 rounded-3xl border-2 border-dotted border-[#00a3a3]">
                <div className="font-bold text-gray-700">Is Reporter an ASHA Worker?</div>
                <div className="flex gap-4 mt-4 justify-center">
                  <div className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-2xl font-bold">YES</div>
                  <div className="bg-orange-100 text-orange-700 px-6 py-2 rounded-2xl font-bold">NO</div>
                </div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl text-center border-2 border-emerald-200">
                <strong className="text-emerald-800">GROUND AI Cross-Check ✅</strong><br/>
                <span className="text-sm text-emerald-700">(Photo + GPS + Badge + Duplicate Detection)</span><br/>
                <span className="text-xs text-gray-400 mt-2 block italic">Community Moderator confirmation</span>
              </div>
              <div className="bg-[#00a3a3] text-white p-5 rounded-2xl font-bold text-center shadow-lg">
                Problem LIVE with Trust Score
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-3xl text-center shadow-md animate-in zoom-in duration-500">
                <div className="text-blue-700 flex flex-col items-center gap-2">
                  <MessageCircle className="h-8 w-8 animate-bounce" />
                  <span className="text-xl font-black">🔔 DIRECT CHAT OPENS</span>
                  <div className="flex items-center gap-4 text-xs font-bold mt-2">
                    <span>GIVER</span>
                    <div className="h-px bg-blue-300 w-12"></div>
                    <span>RECEIVER</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TASK 2 */}
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-t-[10px] border-[#0077b6] flex flex-col">
            <h2 className="text-2xl font-bold mb-8 flex items-start gap-4">
              <div className="bg-[#0077b6]/10 p-3 rounded-2xl">
                <Stethoscope className="h-8 w-8 text-[#0077b6]" />
              </div>
              <span className="leading-tight">TASK 2 — Professional Verification & Response</span>
            </h2>
            <div className="space-y-6 flex-grow">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-medium flex items-center gap-3">
                 <span className="bg-[#0077b6] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                 Professional Registers
              </div>
              <div className="bg-gray-100 p-5 rounded-3xl text-center text-xs font-bold text-gray-600 border border-gray-200">
                BACKEND VERIFICATION<br/>
                <span className="font-normal text-[10px]">NMC / Bar Council / Govt License</span>
              </div>
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 font-bold text-emerald-800 flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-emerald-600" />
                Profile Approved + Badge
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-medium">
                Browses Problem Feed → Accepts a Problem
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-3xl text-center text-xs font-bold text-blue-700 border border-blue-100">
                  Opens Direct Chat
                </div>
                <div className="bg-amber-50 p-4 rounded-3xl text-center text-xs font-bold text-amber-700 border border-amber-100">
                  Travels to Location
                </div>
              </div>
              <div className="bg-emerald-600 text-white p-6 rounded-3xl font-black text-center shadow-xl shadow-emerald-100 flex flex-col items-center gap-2 uppercase tracking-wide">
                <Check className="h-8 w-8" />
                Problem Marked RESOLVED ✅
              </div>
            </div>
          </div>
        </div>

        {/* SOS BAR */}
        <div className="bg-red-50 border-4 border-red-200 rounded-[3rem] p-10 shadow-2xl shadow-red-50">
          <h2 className="text-3xl font-black text-red-700 mb-8 flex items-center gap-4">
            <div className="bg-red-600 p-3 rounded-2xl animate-pulse">
              <ShieldAlert className="h-10 w-10 text-white" />
            </div>
            DISASTER SOS — Universal Catalyst
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 font-bold text-center flex flex-col items-center gap-3 transform hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-black text-xl">1</div>
              SOS Button Tapped
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 font-bold text-center flex flex-col items-center gap-3 transform hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <Navigation className="h-6 w-6" />
              </div>
              Auto GPS Detection
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 font-bold text-center flex flex-col items-center gap-3 transform hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              Simultaneous Broadcast
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 font-bold text-center flex flex-col items-center gap-3 transform hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <Users className="h-6 w-6" />
              </div>
              ASHA Notifications
            </div>
          </div>
          <p className="text-center mt-10 text-red-600 text-xl font-black animate-pulse uppercase tracking-widest">
            Real-time Status Updates until Resolved
          </p>
        </div>

        {/* DONATION FLOW */}
        <div className="bg-blue-50 border-4 border-blue-200 rounded-[3rem] p-10 shadow-2xl shadow-blue-50">
          <h2 className="text-3xl font-black text-blue-700 mb-10 flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            DONATION FLOW — Trust Anchored
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-6">
            <div className="bg-white px-8 py-8 rounded-3xl shadow-md text-center max-w-[200px] border border-blue-100">
              <span className="text-sm font-bold leading-tight block">Donor sees Verified Problem</span>
            </div>
            <ArrowRight className="h-8 w-8 text-blue-300 hidden lg:block" />
            <div className="bg-white px-8 py-8 rounded-3xl shadow-md text-center max-w-[180px] border border-blue-100">
              <span className="text-sm font-bold block">Donates via UPI / Card</span>
            </div>
            <ArrowRight className="h-8 w-8 text-blue-300 hidden lg:block" />
            <div className="bg-white px-8 py-8 rounded-3xl shadow-md text-center max-w-[180px] border border-blue-100 bg-amber-50 ring-2 ring-amber-200 border-none">
              <span className="text-sm font-black text-amber-800 uppercase">ESCROW HOLD</span>
            </div>
            <ArrowRight className="h-8 w-8 text-blue-300 hidden lg:block" />
            <div className="bg-white px-8 py-8 rounded-3xl shadow-md text-center max-w-[180px] border border-blue-100">
              <span className="text-sm font-bold block">Proof Uploaded → Release</span>
            </div>
            <ArrowRight className="h-8 w-8 text-blue-300 hidden lg:block" />
            <div className="bg-emerald-600 text-white px-8 py-8 rounded-3xl shadow-xl text-center max-w-[220px] ring-4 ring-emerald-50">
              <span className="text-sm font-black leading-tight block uppercase tracking-wide">Impact Receipt ✅</span>
              <span className="text-[10px] opacity-80 font-bold block mt-1">Before → Action → After</span>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="bg-gradient-to-r from-[#0077b6] to-[#00d4aa] text-white rounded-[3.5rem] p-12 text-center shadow-[0_20px_50px_rgba(0,119,182,0.3)]">
          <h2 className="text-4xl font-black mb-12 flex items-center justify-center gap-4">
             🗺️ ONE PAGE SUMMARY
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-24">
            <div className="group cursor-pointer">
              <div className="text-7xl mb-4 transform transition-transform group-hover:scale-110 duration-300">📍</div>
              <div className="font-black text-2xl group-hover:text-yellow-300 transition-colors">TASK 1<br/><span className="text-yellow-300 group-hover:text-white">THE EYES</span></div>
            </div>
            <div className="hidden md:block text-5xl opacity-40">→</div>
            <div className="group cursor-pointer">
              <div className="text-7xl mb-4 transform transition-transform group-hover:scale-110 duration-300">✅</div>
              <div className="font-black text-2xl group-hover:text-yellow-300 transition-colors">TASK 3<br/><span className="text-yellow-300 group-hover:text-white">THE TRUST</span></div>
            </div>
            <div className="hidden md:block text-5xl opacity-40">→</div>
            <div className="group cursor-pointer">
              <div className="text-7xl mb-4 transform transition-transform group-hover:scale-110 duration-300">🩺</div>
              <div className="font-black text-2xl group-hover:text-yellow-300 transition-colors">TASK 2<br/><span className="text-yellow-300 group-hover:text-white">THE HANDS</span></div>
            </div>
          </div>
          <div className="mt-16 text-3xl font-black uppercase tracking-widest text-blue-100">
            All three converge into
          </div>
          <div className="inline-block mt-8 bg-white text-[#0077b6] px-16 py-8 rounded-[3rem] text-4xl font-black shadow-2xl transform hover:scale-105 transition-transform cursor-pointer">
            SEWA PLATFORM<br/>
            <span className="text-lg font-bold text-gray-400 mt-2 block tracking-[0.3em]">THE BRIDGE</span>
          </div>
          <p className="mt-16 text-2xl font-black leading-relaxed max-w-3xl mx-auto border-t border-white/20 pt-10">
            These are not separate features.<br/>
            <span className="text-yellow-300">Report → Verify → Respond</span><br/>
            Removing one breaks the bridge.<br/>
            Uniting all creates impact. 🔥
          </p>
        </div>

      </div>

      <footer className="text-center py-10 text-gray-400 text-sm font-bold uppercase tracking-widest">
        SEWA System Flow — Advanced Platform Architecture
      </footer>
    </div>
  )
}
