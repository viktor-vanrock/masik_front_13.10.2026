import { AnimationScope, fitCanvas, lerp } from './animationScope';

const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uEnergy, uReveal, uR, uShock; uniform vec2 uMouse, uSpin;
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;mat3 m=mat3(0.,.8,.6,-.8,.36,-.48,-.6,-.48,.64);for(int i=0;i<5;i++){s+=a*noise(p);p=m*p*2.03;a*=.5;}return s;}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
 float d=length(uv), r=d/uR;
 vec3 c0=vec3(.016,.02,.086), c1=vec3(.106,.125,.33), c2=vec3(.345,.396,.788), c3=vec3(.70,.745,.953), cv=vec3(.50,.345,.75), cw=vec3(.92,.94,1.);
 vec3 col=vec3(0.); float a=0.;
 // halo
 float h=max(r-1.,0.);
 float halo=exp(-h*5.2)*(.26+.5*uEnergy) + exp(-h*1.6)*(.07+.12*uEnergy);
 // energy ring pulse
 float pulse=fract(uTime*.35)*uEnergy; halo+=smoothstep(.04,0.,abs(h-pulse*.9))*.25*uEnergy*(1.-pulse);
 float sk=step(.001,uShock)*(1.-uShock); halo+=smoothstep(.06,0.,abs(h-uShock*1.05))*1.1*sk + exp(-h*3.)*.35*sk;
 if(r<1.){
  float z=sqrt(1.-r*r); vec3 n=vec3(uv/uR,z);
  float t=uTime*(.05+.22*uEnergy);
  vec3 p=rY(t+uMouse.x*.7+uSpin.x)*rX(-uMouse.y*.5+.25+uSpin.y)*n;
  // swirl: twist around vertical axis by depth/energy
  float tw=(1.-z)*(.6+2.2*uEnergy)*sin(uTime*.3);
  p=rY(tw)*p;
  vec3 q=p*1.55+vec3(0.,0.,uTime*.035);
  vec3 w=vec3(fbm(q+vec3(1.7,9.2,0.)+uTime*.05),fbm(q+vec3(8.3,2.8,1.)-uTime*.04),fbm(q+vec3(3.1,4.4,7.)));
  float f=fbm(q+(1.5+1.6*uEnergy)*w);
  vec3 neb=mix(c0,c1,smoothstep(.18,.5,f));
  neb=mix(neb,c2,smoothstep(.42,.72,f));
  neb=mix(neb,c3,smoothstep(.66,.95,f)*.85);
  neb+=cv*.35*smoothstep(.45,.8,w.x)*(1.-f);
  // flowing filaments (isolines of the field)
  float iso=abs(fract(f*6.-uTime*.08)-.5);
  neb+=c3*smoothstep(.05,0.,iso)*(.12+.35*uEnergy)*z;
  // measurement shell: latitudes + meridians on rotated sphere
  vec3 s=rY(uTime*.04)*n;
  float lat=abs(fract(s.y*7.+.5)-.5);
  float lon=abs(fract(atan(s.z,s.x)/6.2831853*24.)-.5);
  float wdt=.018/max(z,.25);
  float grid=smoothstep(wdt,0.,lat)*.5+smoothstep(wdt*1.3,0.,lon)*.3*(1.-abs(s.y));
  grid*=(.18+.45*uEnergy)*(.35+.65*pow(1.-z,.6));
  // light
  vec3 L=normalize(vec3(-.5+uMouse.x*.35,.6+uMouse.y*.25,.75));
  float diff=max(dot(n,L),0.);
  neb*=.42+.75*diff;
  neb+=c2*.32*pow(z,3.)*(.3+.9*uEnergy)*(.4+.6*f);
  float fres=pow(1.-z,2.4);
  col=neb+grid*c3+fres*mix(c2,c3,.55)*1.15;
  vec3 H=normalize(L+vec3(0.,0.,1.));
  col+=cw*pow(max(dot(n,H),0.),220.)*.75;
  col+=c3*pow(max(dot(n,H),0.),14.)*.10;
  // lower inner reflection crescent
  col+=c3*.22*smoothstep(.78,1.,r)*smoothstep(.1,.7,-uv.y/uR);
  // reveal: fog parts at the centre so the prophecy reads
  col+=c3*sk*.35*(1.-r)*step(.001,uShock);
  col=mix(col,c0*.7+col*.2,uReveal*smoothstep(.98,.1,r)*.9);
  float aa=2./(uR*min(uRes.x,uRes.y));
  a=smoothstep(1.,1.-aa,r);
  col*=a;
 }
 float m=max(abs(uv.x),abs(uv.y)); halo*=smoothstep(.5,.36,m);
 vec3 hc=mix(c2,cv,.25)*halo;
 col+=hc*(1.-a);
 float alpha=clamp(a+halo*.55*(1.-a),0.,1.);
 gl_FragColor=vec4(col,alpha);
}`;

export function makeOrb(scope: AnimationScope, canvas: HTMLCanvasElement, opts: { R: number; baseEnergy?: number; seed?: number; maxDpr?: number }) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  scope.cleanup(() => shaders.forEach(shader => gl.deleteShader(shader)));
  const sh = (type: number, src: string) => { const s = gl.createShader(type); if (!s) return null; shaders.push(s); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;
  const pr = gl.createProgram(); if (!pr) return null; scope.cleanup(() => { gl.useProgram(null); gl.deleteProgram(pr); }); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const b = gl.createBuffer(); if (!b) return null; scope.cleanup(() => gl.deleteBuffer(b)); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U: Record<string, WebGLUniformLocation | null> = {}; ['uRes', 'uTime', 'uEnergy', 'uReveal', 'uR', 'uMouse', 'uShock', 'uSpin'].forEach(n => U[n] = gl.getUniformLocation(pr, n));
  const st = { energy: 0, reveal: 0, mx: 0, my: 0, tEnergy: opts.baseEnergy || 0, tReveal: 0, tmx: 0, tmy: 0, time: 0, last: 0, shock: 0, shockOn: false, sx: 0, sy: 0, vsx: 0, vsy: 0 };
  const draw = (sec: number) => {
    const dt = Math.max(0, Math.min(.05, sec - st.last || .016)); st.last = sec;
    st.energy = lerp(st.energy, st.tEnergy, 1 - Math.pow(.02, dt));
    st.reveal = lerp(st.reveal, st.tReveal, 1 - Math.pow(.05, dt));
    st.mx = lerp(st.mx, st.tmx, 1 - Math.pow(.08, dt)); st.my = lerp(st.my, st.tmy, 1 - Math.pow(.08, dt));
    st.time += dt * (1 + st.energy * 2.2);
    if (st.shockOn) { st.shock += dt / 1.1; if (st.shock >= 1) { st.shock = 0; st.shockOn = false; } }
    st.sx += st.vsx * dt; st.sy += st.vsy * dt; const damp = Math.pow(.08, dt); st.vsx *= damp; st.vsy *= damp;
    const { w, h } = fitCanvas(canvas, opts.maxDpr || 1.5);
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uTime, st.time + (opts.seed || 0));
    gl.uniform1f(U.uEnergy, st.energy); gl.uniform1f(U.uReveal, st.reveal); gl.uniform1f(U.uR, opts.R);
    gl.uniform2f(U.uMouse, st.mx, st.my); gl.uniform1f(U.uShock, st.shock); gl.uniform2f(U.uSpin, st.sx, st.sy);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const lp = scope.loop(canvas, draw);
  if (scope.reducedMotion) { draw(1.2); }
  return { st, kick: lp.kick, draw, shock() { st.shock = 0.0001; st.shockOn = true; lp.kick(); } };
}


export type Orb = ReturnType<typeof makeOrb>;
