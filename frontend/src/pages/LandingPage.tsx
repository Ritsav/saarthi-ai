import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, FileText, CheckCircle, UploadCloud, PlaneTakeoff } from 'lucide-react';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  
  // Hero headline sliding up and fading out as you scroll down
  const heroY = useTransform(scrollYProgress, [0, 0.15], ['0%', '-50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Feature grid sliding up
  const gridY = useTransform(scrollYProgress, [0.1, 0.3], ['20%', '0%']);
  const gridOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden font-sans">
      
      {/* Sticky Top Header */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">S</div>
            <span className="text-sm font-semibold tracking-tight">Saarthi</span>
          </div>
          <Button asChild className="rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all">
            <Link to="/signup">Add to Browser - It's Free</Link>
          </Button>
        </div>
      </header>

      {/* 1. The "Pain-Point" Hook (Hero Section) */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-20">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-5xl text-center space-y-6"
        >
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[1.1]"
          >
            &gt; DON'T LET A TYPO DELAY YOUR TRAVELS.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium"
          >
            The smartest, fastest way to prepare and autofill your Nepal passport application. No manual typing required.
          </motion.p>
        </motion.div>
      </section>

      {/* 2. "Show, Don't Tell" Feature Grid (The Magic) */}
      <section className="relative px-6 py-32 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            style={{ y: gridY, opacity: gridOpacity }}
            className="grid gap-8 md:grid-cols-3"
          >
            {/* Card 1: AI Document Reading */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="h-48 mb-6 rounded-2xl bg-slate-100 flex items-center justify-center relative overflow-hidden">
                {/* Abstract ID Card with Scanning Laser */}
                <div className="relative w-32 h-20 bg-white border-2 border-slate-200 rounded-lg shadow-sm p-2 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                    <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
                  </div>
                  {/* Laser effect */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="absolute left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] z-10"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">Flawless Extraction</h3>
              <p className="text-slate-600 leading-relaxed">
                Upload your Nagarikta or old passport. Our AI instantly reads and categorizes your details with zero typos.
              </p>
            </div>

            {/* Card 2: The Review Layer */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform md:translate-y-8">
              <div className="h-48 mb-6 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                <div className="space-y-4 w-4/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <div className="h-2 w-full bg-emerald-100 rounded-full">
                      <motion.div 
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 0.95, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, times: [0, 0.5, 1] }}
                    className="h-8 w-24 bg-slate-900 rounded-lg mx-auto flex items-center justify-center text-white text-[10px] font-bold"
                  >
                    Confirm Info
                  </motion.div>
                </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">Your Digital Profile</h3>
              <p className="text-slate-600 leading-relaxed">
                Review your extracted data in a clean, stress-free dashboard before you ever touch the official portal.
              </p>
            </div>

            {/* Card 3: The Extension at Work */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300">
               <div className="h-48 mb-6 rounded-2xl bg-slate-100 flex items-center justify-center p-4 relative">
                 <div className="flex w-full h-full gap-2">
                   {/* App Side */}
                   <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex flex-col items-center justify-center opacity-70">
                     <FileText className="w-8 h-8 text-slate-400 mb-2" />
                     <div className="h-1 w-8 bg-slate-200 rounded-full" />
                   </div>
                   {/* Official Portal side */}
                   <div className="flex-[2] bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-2 relative">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-4 w-full bg-slate-100 rounded flex items-center px-2">
                           <motion.div 
                             initial={{ opacity: 0, width: 0 }}
                             whileInView={{ opacity: 1, width: '60%' }}
                             transition={{ delay: i * 0.2, duration: 0.5 }}
                             className="h-1.5 bg-green-400 rounded-full"
                           />
                        </div>
                      ))}
                      <motion.div
                        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 m-auto w-4 h-4 bg-black rounded-full/50 text-white flex items-center justify-center"
                        style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
                      />
                   </div>
                 </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">One-Click Autofill</h3>
              <p className="text-slate-600 leading-relaxed">
                Open the government portal and let our browser extension securely drop your verified data into the right boxes.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. The Typographic Scroll (The Workflow) */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto space-y-32">
          {[
            { word: "SNAP.", desc: "Snap a photo of your documents. We securely extract the data in seconds." },
            { word: "CHECK.", desc: "Verify the AI's work. You have total control over the final details." },
            { word: "FILL.", desc: "Navigate to the official portal. Our extension does the heavy lifting so you can just hit submit." }
          ].map((item, i) => (
            <motion.div 
              key={item.word}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row md:items-center gap-6 md:gap-16"
            >
              <h2 className="text-7xl md:text-[12rem] font-black tracking-tighter text-slate-100">
                {item.word}
              </h2>
              <p className="text-xl md:text-3xl text-slate-600 font-medium max-w-sm -mt-10 md:mt-0">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. The Trust & Security Bar */}
      <section className="py-16 bg-slate-900 text-white px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
          <div className="p-4 bg-slate-800 rounded-full">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Bank-Level Security</h3>
            <p className="text-slate-400 mt-2 text-lg">
              Your documents are used strictly for extraction and are <strong className="text-white">never shared</strong>. You control your data.
            </p>
          </div>
        </div>
      </section>

      {/* 5. The Memorable Send-Off (Footer) */}
      <footer className="relative py-40 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           whileInView={{ scale: 1, opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="z-10 relative"
        >
          <div className="mb-12 flex justify-center">
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="p-6 bg-slate-50 rounded-full shadow-2xl border border-slate-100 text-slate-900"
            >
              <PlaneTakeoff className="w-16 h-16" />
            </motion.div>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10">
            Ready to skip the typing?
          </h2>
          <Button asChild size="lg" className="h-16 px-10 text-xl rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <Link to="/signup">Start Your Application</Link>
          </Button>
        </motion.div>
        
        {/* Subtle background element */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-slate-50/50" />
      </footer>
    </div>
  );
}

