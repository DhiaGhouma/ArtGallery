import { useState, useRef, useEffect, useId, useLayoutEffect } from 'react';
import {  Wand2, Download, Loader, AlertCircle, Sparkles, X } from 'lucide-react';

// ElectricBorder Component
const ElectricBorder = ({ children, color = '#5227FF', speed = 1, chaos = 1, thickness = 2, className, style }) => {
  const rawId = useId().replace(/[:]/g, '');
  const filterId = `turbulent-displace-${rawId}`;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const strokeRef = useRef<HTMLDivElement | null>(null);

  const updateAnim = () => {
    const svg = svgRef.current;
    const host = rootRef.current;
    if (!svg || !host) return;

    if (strokeRef.current) {
      strokeRef.current.style.filter = `url(#${filterId})`;
    }

    const width = Math.max(1, Math.round(host.clientWidth || host.getBoundingClientRect().width || 0));
    const height = Math.max(1, Math.round(host.clientHeight || host.getBoundingClientRect().height || 0));

    const dyNodeList = svg.querySelectorAll('feOffset > animate[attributeName="dy"]') as NodeListOf<SVGAnimationElement>;
    const dyAnims = Array.from(dyNodeList) as SVGAnimationElement[];
    if (dyAnims.length >= 2) {
      dyAnims[0].setAttribute('values', `${height}; 0`);
      dyAnims[1].setAttribute('values', `0; -${height}`);
    }

    const dxNodeList = svg.querySelectorAll('feOffset > animate[attributeName="dx"]') as NodeListOf<SVGAnimationElement>;
    const dxAnims = Array.from(dxNodeList) as SVGAnimationElement[];
    if (dxAnims.length >= 2) {
      dxAnims[0].setAttribute('values', `${width}; 0`);
      dxAnims[1].setAttribute('values', `0; -${width}`);
    }

    const baseDur = 6;
    const dur = Math.max(0.001, baseDur / (speed || 1));
    [...dyAnims, ...dxAnims].forEach((a) => a.setAttribute('dur', `${dur}s`));

    const disp = svg.querySelector('feDisplacementMap') as SVGElement | null;
    if (disp) disp.setAttribute('scale', String(30 * (chaos || 1)));

    const filterEl = svg.querySelector(`#${CSS.escape(filterId)}`) as SVGElement | null;
    if (filterEl) {
      filterEl.setAttribute('x', '-200%');
      filterEl.setAttribute('y', '-200%');
      filterEl.setAttribute('width', '500%');
      filterEl.setAttribute('height', '500%');
    }

    requestAnimationFrame(() => {
      [...dyAnims, ...dxAnims].forEach((a) => {
        // a is an SVGAnimationElement — beginElement may not exist in all browsers, so guard before calling
        if (typeof (a as SVGAnimationElement).beginElement === 'function') {
          try {
            (a as SVGAnimationElement).beginElement();
          } catch {
            console.warn('ElectricBorder: beginElement failed');
          }
        }
      });
    });
  };

  useEffect(() => {
    updateAnim();
  }, [speed, chaos]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const ro = new ResizeObserver(() => updateAnim());
    ro.observe(rootRef.current);
    updateAnim();
    return () => ro.disconnect();
  }, []);

  const vars = {
    '--electric-border-color': color,
    '--eb-border-width': `${thickness}px`
  };

  return (
    <div ref={rootRef} className="electric-border" style={{ ...vars, ...style }}>
      <svg ref={svgRef} style={{ position: 'fixed', left: '-10000px', top: '-10000px', width: '10px', height: '10px', opacity: 0.001, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
              <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
              <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
              <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
              <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
            <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 2 }}>
        <div ref={strokeRef} style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', border: `var(--eb-border-width) solid var(--electric-border-color)`, boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', border: `var(--eb-border-width) solid color-mix(in oklch, var(--electric-border-color) 60%, transparent)`, opacity: 0.5, filter: 'blur(calc(0.5px + (var(--eb-border-width) * 0.25)))', boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', border: `var(--eb-border-width) solid var(--electric-border-color)`, opacity: 0.5, filter: 'blur(calc(2px + (var(--eb-border-width) * 0.5)))', boxSizing: 'border-box' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: -1, transform: 'scale(1.08)', filter: 'blur(32px)', opacity: 0.3, background: 'linear-gradient(-30deg, var(--electric-border-color), transparent, var(--electric-border-color))', pointerEvents: 'none' }} />
      </div>

      <div style={{ position: 'relative', borderRadius: 'inherit', zIndex: 1 }}>{children}</div>
    </div>
  );
};

// Main Component
const AIImageGenerator = () => {
  const [generatedImage, setGeneratedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const presetPrompts = [
    { label: '🎨 Oil Painting', prompt: 'oil painting style, impressionist brushstrokes, artistic masterpiece, vibrant colors, textured canvas' },
    { label: '✨ Fantasy Art', prompt: 'fantasy art, magical glowing effects, ethereal atmosphere, mystical lighting, dreamlike quality' },
    { label: '📷 Photorealistic', prompt: 'photorealistic, ultra detailed, 8k resolution, professional photography, sharp focus, cinematic lighting' },
    { label: '🌸 Anime Style', prompt: 'anime art style, cel shading, vibrant colors, detailed illustration, manga aesthetic' },
    { label: '🎭 Surreal Art', prompt: 'surrealist art, dreamlike imagery, abstract elements, mind-bending composition, vivid imagination' },
    { label: '⚡ Cyberpunk', prompt: 'cyberpunk aesthetic, neon lights, futuristic cityscape, dark atmosphere, high-tech elements, sci-fi' }
  ];

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Using FLUX model via Pollinations AI
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Date.now()}&nologo=true&model=flux&enhance=true`;
      
      let response = await fetch(pollinationsUrl);
      
      if (!response.ok) {
        // Fallback Method 2: Try alternative endpoint
        const altUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', masterpiece, best quality, highly detailed, 8k')}?width=1024&height=1024&nologo=true&model=flux`;
        response = await fetch(altUrl);
      }

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const resultBlob = await response.blob();
      
      // Verify we got an actual image
      if (resultBlob.size < 1000) {
        throw new Error('Invalid image generated');
      }
      
      const resultUrl = URL.createObjectURL(resultBlob);
      setGeneratedImage(resultUrl);
      
    } catch (err) {
      setError('Failed to generate image. Please try a different prompt or check your connection.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'ai-generated-image.png';
    link.click();
  };

  const reset = () => {
    setGeneratedImage(null);
    setPrompt('');
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            AI Image Generator
          </h1>
          <p className="text-xl text-slate-400">
            Transform your ideas into stunning visuals with AI
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Prompt Section */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-400" />
                Your Prompt
              </h2>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the image you want to create..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all min-h-[160px] resize-none mb-4"
              />

              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  {presetPrompts.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(preset.prompt)}
                      className="px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full transition-colors border border-purple-500/30"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-300 font-medium mb-2">💡 Pro Tips:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Be specific and descriptive</li>
                  <li>• Include style keywords (e.g., "photorealistic", "anime")</li>
                  <li>• Add quality terms like "detailed", "8k", "masterpiece"</li>
                  <li>• Press Enter to generate quickly</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                Generated Image
              </h2>
              {generatedImage && (
                <button
                  onClick={reset}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Reset"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </div>

            <div className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {generatedImage ? (
                <ElectricBorder
                  color="#7df9ff"
                  speed={1}
                  chaos={0.5}
                  thickness={3}
                  className="w-full h-full"
                  style={{ borderRadius: 16, width: '100%', height: '100%' }}
                >
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                </ElectricBorder>
              ) : (
                <div className="text-center text-slate-500">
                  <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Your AI-generated image will appear here</p>
                  <p className="text-sm mt-2">with a stunning electric border effect</p>
                </div>
              )}
            </div>

            {generatedImage && (
              <button
                onClick={downloadImage}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Image
              </button>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-slate-400">
            Stay Creative. Explore more AI tools and features on our platform!
          </p>
        
        </div>
      </div>
    </div>
  );
};

export default AIImageGenerator;