/* ═══════════════════════════════════════════
   NG Offers — 3D Sandbox + D3 Controls
   Three.js handles the 3D sandbox view
   D3 handles data loading, filtering, bar chart
   ═══════════════════════════════════════════ */

// ── Colour scale (shared by Three.js and D3 bar chart) ──
const waitColorScale = d3.scaleLinear()
  .domain([0, 4, 8, 14, 18])
  .range(['#d4af37','#e09040','#b83010','#7a0d05','#3b0202'])
  .clamp(true);

// ── Fallback data ──
const FALLBACK=[
  {name:'Toronto (Downtown)',lon:-79.38,lat:43.65,offers:520,avgWait:4.8,internPct:68,region:'GTA'},
  {name:'Toronto (North York)',lon:-79.41,lat:43.77,offers:185,avgWait:5.5,internPct:60,region:'GTA'},
  {name:'Toronto (Scarborough)',lon:-79.23,lat:43.77,offers:95,avgWait:6.2,internPct:52,region:'GTA'},
  {name:'Toronto (Etobicoke)',lon:-79.56,lat:43.65,offers:78,avgWait:6.0,internPct:55,region:'GTA'},
  {name:'Mississauga',lon:-79.65,lat:43.59,offers:210,avgWait:5.2,internPct:58,region:'GTA'},
  {name:'Brampton',lon:-79.76,lat:43.73,offers:65,avgWait:7.5,internPct:38,region:'GTA'},
  {name:'Markham',lon:-79.26,lat:43.87,offers:145,avgWait:4.9,internPct:65,region:'GTA'},
  {name:'Vaughan',lon:-79.50,lat:43.84,offers:72,avgWait:6.3,internPct:48,region:'GTA'},
  {name:'Richmond Hill',lon:-79.44,lat:43.88,offers:68,avgWait:5.8,internPct:55,region:'GTA'},
  {name:'Oakville',lon:-79.69,lat:43.45,offers:55,avgWait:5.5,internPct:52,region:'GTA'},
  {name:'Burlington',lon:-79.80,lat:43.33,offers:42,avgWait:6.5,internPct:45,region:'GTA'},
  {name:'Ajax / Pickering',lon:-79.02,lat:43.85,offers:35,avgWait:7.2,internPct:40,region:'GTA'},
  {name:'Oshawa',lon:-78.87,lat:43.90,offers:28,avgWait:8.1,internPct:35,region:'GTA'},
  {name:'Waterloo',lon:-80.52,lat:43.47,offers:280,avgWait:3.5,internPct:82,region:'KW'},
  {name:'Kitchener',lon:-80.49,lat:43.42,offers:165,avgWait:4.0,internPct:75,region:'KW'},
  {name:'Cambridge',lon:-80.31,lat:43.36,offers:30,avgWait:6.8,internPct:45,region:'KW'},
  {name:'Guelph',lon:-80.25,lat:43.55,offers:38,avgWait:6.5,internPct:50,region:'KW'},
  {name:'Ottawa (Downtown)',lon:-75.70,lat:45.42,offers:310,avgWait:4.2,internPct:70,region:'Ottawa'},
  {name:'Kanata',lon:-75.91,lat:45.34,offers:175,avgWait:3.8,internPct:72,region:'Ottawa'},
  {name:'Orléans',lon:-75.50,lat:45.47,offers:45,avgWait:5.6,internPct:58,region:'Ottawa'},
  {name:'Hamilton',lon:-79.87,lat:43.26,offers:55,avgWait:7.2,internPct:42,region:'Other South'},
  {name:'London',lon:-81.25,lat:42.98,offers:62,avgWait:6.5,internPct:48,region:'Other South'},
  {name:'Kingston',lon:-76.49,lat:44.23,offers:32,avgWait:7.8,internPct:45,region:'Other South'},
  {name:'St. Catharines',lon:-79.24,lat:43.16,offers:18,avgWait:9.0,internPct:30,region:'Other South'},
  {name:'Barrie',lon:-79.69,lat:44.39,offers:22,avgWait:8.5,internPct:35,region:'Other South'},
  {name:'Peterborough',lon:-78.32,lat:44.30,offers:12,avgWait:9.5,internPct:28,region:'Other South'},
  {name:'Windsor',lon:-83.04,lat:42.31,offers:25,avgWait:9.8,internPct:28,region:'Other South'},
  {name:'Brantford',lon:-80.26,lat:43.14,offers:10,avgWait:10.2,internPct:22,region:'Other South'},
  {name:'Sudbury',lon:-81.00,lat:46.49,offers:8,avgWait:12.5,internPct:18,region:'North'},
  {name:'Thunder Bay',lon:-89.25,lat:48.38,offers:6,avgWait:13.5,internPct:12,region:'North'},
  {name:'Sault Ste. Marie',lon:-84.33,lat:46.52,offers:5,avgWait:14.0,internPct:10,region:'North'},
  {name:'North Bay',lon:-79.46,lat:46.31,offers:4,avgWait:13.0,internPct:15,region:'North'},
  {name:'Timmins',lon:-81.33,lat:48.47,offers:2,avgWait:15.5,internPct:5,region:'North'},
];

/* ═══════════════════════════════════════════
   THREE.JS — 3D Sandbox Scene
   ═══════════════════════════════════════════ */
const mapPanel = document.getElementById('map-panel');
const canvas = document.getElementById('three-canvas');
const tip = document.getElementById('tooltip');
let W, H;
function dim() { const r = mapPanel.getBoundingClientRect(); W = r.width; H = r.height; }
dim();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xede6d8);
scene.fog = new THREE.FogExp2(0xede6d8, 0.012);

const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 200);
// 1. Theta(水平旋转): 接近正南往北看，带一点点右侧倾角展现立体感
// 2. Phi(俯仰角): 放低一点 (0.58) 让柱子的高低错落感更拔群
// 3. R(距离): 拉远到 55，把整个安省版图完美收进画框
let camTheta = 0.15, camPhi = 0.58, camR = 55; 

// 4. lookAt(视觉焦点): X轴往东移(4)，Z轴往南移(8)，直接把多伦多/滑铁卢设为沙盘旋转的绝对C位！
const lookAt = new THREE.Vector3(4, 0, 8);

function updateCamera() {
  camera.position.set(
    camR * Math.cos(camPhi) * Math.sin(camTheta),
    camR * Math.sin(camPhi),
    camR * Math.cos(camPhi) * Math.cos(camTheta)
  );
  camera.lookAt(lookAt);
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ── Lighting ──
scene.add(new THREE.AmbientLight(0xfff2e4, 0.5));
const sun = new THREE.DirectionalLight(0xfffaf0, 1.5);
sun.position.set(-10, 25, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25; sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25;
sun.shadow.bias = -0.001;
scene.add(sun);
scene.add(new THREE.DirectionalLight(0xdde8ff, 0.2).translateX(12).translateY(5).translateZ(-10));
scene.add(new THREE.DirectionalLight(0xffe8d0, 0.25).translateX(5).translateY(8).translateZ(15));

// ── Ground shadow catcher ──
const groundGeo = new THREE.PlaneGeometry(60, 60);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.12 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

// ── Geo → 3D coordinate mapping (Using D3 Projection) ──
const proj = d3.geoConicConformal().parallels([44, 50]).rotate([82, 0]).center([0, 48]);

function geoTo3D(lon, lat) {
  const [x, y] = proj([lon, lat]);
  return [x, y]; 
}

// ── Ontario Map Platform ──
const HD_MAP_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson';

function buildMapShape(coords) {
  const shape = new THREE.Shape();
  const [fx, fz] = geoTo3D(coords[0][0], coords[0][1]);
  // 取负号修复 Three.js 挤出旋转后的 Y 轴翻转问题
  shape.moveTo(fx, -fz); 
  for (let i = 1; i < coords.length; i++) {
    const [x, z] = geoTo3D(coords[i][0], coords[i][1]);
    shape.lineTo(x, -z); 
  }
  shape.closePath();
  return shape;
}

function createMapPlatform(geoFeature) {
  // 增加 Padding，让地图完美嵌入沙盘居中
  proj.fitExtent([[-15, -15], [15, 15]], geoFeature);

  let allRings = [];
  if (geoFeature.geometry.type === 'MultiPolygon') {
    geoFeature.geometry.coordinates.forEach(poly => {
      allRings.push(poly[0]); 
    });
  } else {
    allRings.push(geoFeature.geometry.coordinates[0]);
  }

  const extrudeSettings = {
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2
  };

  const surfaceMat = new THREE.MeshPhongMaterial({
    color: 0xc4b080,
    shininess: 2,
    specular: new THREE.Color(0.02, 0.015, 0.01),
  });

  const edgeMat = new THREE.MeshPhongMaterial({
    color: 0xa08858,
    shininess: 2,
  });

  allRings.forEach(coords => {
    if (coords.length < 20) return; // 忽略细碎岛屿

    const shape = buildMapShape(coords);
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // 细微地形起伏
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z > 0.35) pos.setZ(i, z + (Math.random() - 0.3) * 0.04);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, surfaceMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const edgeMesh = new THREE.Mesh(geo.clone(), edgeMat);
    edgeMesh.rotation.x = -Math.PI / 2;
    edgeMesh.position.y = -0.08;
    edgeMesh.receiveShadow = true;
    scene.add(edgeMesh);
  });
}

// ── City Columns ──
let allCities = [], filtered = [], maxOffers = 1;
const columnMeshes = []; 
const columnGroup = new THREE.Group();
scene.add(columnGroup);

function buildColumns(data, animate = false) {
  columnMeshes.forEach(c => columnGroup.remove(c.mesh));
  columnMeshes.length = 0;

  const heightScale = d3.scaleSqrt().domain([0, maxOffers]).range([0.12, 9]);

  data.forEach(d => {
    const [x, z] = geoTo3D(d.lon, d.lat);
    const h = heightScale(d.offers);
    const baseR = 0.08 + (d.offers / maxOffers) * 0.14;
    const colStr = waitColorScale(d.avgWait);
    const col = new THREE.Color(colStr);

    // 金边材质模拟 (Internship >= 50%)
    let metalness = 0.1, roughness = 0.8;
    if (d.internPct >= 50) {
      col.r = Math.min(1, col.r * 1.1 + 0.1);
      col.g = Math.min(1, col.g * 1.1 + 0.1);
      col.b *= 0.6;
      metalness = 0.4;
      roughness = 0.4;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: col,
      metalness: metalness,
      roughness: roughness,
      flatShading: true,
    });

    const geo = new THREE.CylinderGeometry(baseR * 0.85, baseR, animate ? 0.01 : h, 6);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, animate ? 0.45 : h / 2 + 0.42, z); // z 已经由 D3 正确映射
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = d;
    columnGroup.add(mesh);
    columnMeshes.push({ mesh, data: d, targetH: h, currentH: animate ? 0.01 : h });
  });

  if (animate) startGrowAnimation();
}

// ── Growth animation ──
let animating = false, animStart = 0;
const ANIM_DURATION = 2500; 

function startGrowAnimation() {
  animating = true;
  animStart = performance.now();
}

function updateAnimation(now) {
  if (!animating) return;
  const elapsed = now - animStart;
  const progress = Math.min(elapsed / ANIM_DURATION, 1);

  columnMeshes.forEach((c, i) => {
    const delay = (i / columnMeshes.length) * 0.5;
    const t = Math.max(0, Math.min((progress - delay) / (1 - 0.5), 1));
    const eased = 1 - Math.pow(1 - t, 3); 
    const h = Math.max(0.01, c.targetH * eased);

    c.mesh.geometry.dispose();
    const baseR = 0.08 + (c.data.offers / maxOffers) * 0.14;
    c.mesh.geometry = new THREE.CylinderGeometry(baseR * 0.85, baseR, h, 6);
    c.mesh.position.y = h / 2 + 0.42;
    c.currentH = h;
  });

  if (progress >= 1) animating = false;
}

// ── Text labels (canvas sprites) ──
const labelSprites = [];
function createLabels(data) {
  labelSprites.forEach(s => scene.remove(s));
  labelSprites.length = 0;

  const labelCities = [];
  const torontos = data.filter(d => d.name.startsWith('Toronto'));
  if (torontos.length) {
    const best = torontos.reduce((a, b) => a.offers > b.offers ? a : b);
    labelCities.push({ ...best, label: 'Toronto' });
  }
  const others = data.filter(d => !d.name.startsWith('Toronto'));
  const ottawas = others.filter(d => ['Ottawa (Downtown)','Kanata','Orléans'].includes(d.name));
  if (ottawas.length) {
    const best = ottawas.reduce((a, b) => a.offers > b.offers ? a : b);
    labelCities.push({ ...best, label: 'Ottawa' });
  }
  const kws = others.filter(d => ['Waterloo','Kitchener','Cambridge'].includes(d.name));
  if (kws.length) {
    const best = kws.reduce((a, b) => a.offers > b.offers ? a : b);
    labelCities.push({ ...best, label: 'Waterloo / KW' });
  }
  const skip = new Set(['Ottawa (Downtown)','Kanata','Orléans','Waterloo','Kitchener','Cambridge']);
  others.filter(d => !d.name.startsWith('Toronto') && !skip.has(d.name) && d.offers >= 20)
    .forEach(d => labelCities.push({ ...d, label: d.name }));

  labelCities.forEach(d => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 80;
    const ctx = c.getContext('2d');
    const isLarge = d.offers > 100;
    const fontSize = isLarge ? 44 : 30;
    ctx.font = `italic ${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Outline for readability
    ctx.strokeStyle = 'rgba(237,230,216,0.85)';
    ctx.lineWidth = isLarge ? 8 : 6;
    ctx.lineJoin = 'round';
    ctx.strokeText(d.label, 256, 40);
    ctx.fillStyle = isLarge ? '#1a0e06' : '#3a2210';
    ctx.fillText(d.label, 256, 40);

    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: isLarge ? 0.95 : 0.7, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    const [x, z] = geoTo3D(d.lon, d.lat);
    const hScale = d3.scaleSqrt().domain([0, maxOffers]).range([0.12, 9]);
    const colH = hScale(d.offers);
    sprite.position.set(x, colH + 1.5, z + 0.5);
    sprite.scale.set(isLarge ? 4.2 : 3.0, isLarge ? 0.65 : 0.47, 1);
    scene.add(sprite);
    labelSprites.push(sprite);
  });

  // "ONTARIO" watermark — large and visible
  const wc = document.createElement('canvas');
  wc.width = 2048; wc.height = 384;
  const wctx = wc.getContext('2d');
  wctx.font = 'italic 200px Georgia, serif';
  wctx.fillStyle = 'rgba(120,85,40,0.14)';
  wctx.textAlign = 'center';
  wctx.textBaseline = 'middle';
  wctx.fillText('O N T A R I O', 1024, 192);
  const wtex = new THREE.CanvasTexture(wc);
  wtex.minFilter = THREE.LinearFilter;
  const wmat = new THREE.SpriteMaterial({ map: wtex, transparent: true, depthTest: false });
  const wsprite = new THREE.Sprite(wmat);
  wsprite.position.set(1, 0.52, -3);
  wsprite.scale.set(24, 4.5, 1);
  scene.add(wsprite);
  labelSprites.push(wsprite);
}

// ── Mouse interaction: FREE PAN + TILT (not orbit) ──
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9999, -9999);
let isDragging = false, isRightDrag = false, lastX = 0, lastY = 0, hovMesh = null;

mapPanel.addEventListener('contextmenu', e => e.preventDefault()); // disable right-click menu

mapPanel.addEventListener('mousedown', e => {
  isDragging = true;
  isRightDrag = e.button === 2 || e.shiftKey; // right-click or shift = tilt/rotate
  lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener('mouseup', () => { isDragging = false; isRightDrag = false; });

mapPanel.addEventListener('mousemove', e => {
  const rect = mapPanel.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  let tx = e.clientX + 16, ty = e.clientY - 10;
  if (tx + 200 > window.innerWidth) tx = e.clientX - 210;
  if (ty + 140 > window.innerHeight) ty = e.clientY - 150;
  tip.style.left = tx + 'px'; tip.style.top = ty + 'px';

  if (isDragging) {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (isRightDrag) {
      // Right-drag / shift-drag: orbit (tilt + rotate)
      camTheta -= dx * 0.006;
      camPhi = Math.max(0.15, Math.min(1.35, camPhi + dy * 0.004));
    } else {
      // Left-drag: FREE PAN — move both camera and lookAt together
      // Calculate pan direction based on current camera orientation
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const panSpeed = camR * 0.0015;
      const panX = -dx * panSpeed;
      const panZ = -dy * panSpeed;

      lookAt.add(right.multiplyScalar(panX));
      lookAt.add(forward.multiplyScalar(panZ));
    }
    lastX = e.clientX; lastY = e.clientY;
    updateCamera();
  }
});

mapPanel.addEventListener('wheel', e => {
  camR = Math.max(12, Math.min(80, camR + e.deltaY * 0.04));
  updateCamera();
}, { passive: true });
mapPanel.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

// Touch: single finger = pan, two fingers = zoom
let touchDist = 0;
mapPanel.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    touchDist = Math.sqrt(dx*dx + dy*dy);
  }
}, { passive: true });
mapPanel.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const panSpeed = camR * 0.0015;
    lookAt.add(right.multiplyScalar(-dx * panSpeed));
    lookAt.add(forward.multiplyScalar(-dy * panSpeed));
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    updateCamera();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const d = Math.sqrt(dx*dx + dy*dy);
    camR = Math.max(12, Math.min(80, camR - (d - touchDist) * 0.06));
    touchDist = d; updateCamera();
  }
}, { passive: false });
mapPanel.addEventListener('touchend', () => { isDragging = false; });

// ── Render loop ──
const monthNames = ['Sept','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec','Jan','Feb','Mar'];

function renderLoop(now) {
  requestAnimationFrame(renderLoop);
  updateAnimation(now);

  raycaster.setFromCamera(mouse, camera);
  const meshes = columnMeshes.map(c => c.mesh);
  const hits = raycaster.intersectObjects(meshes);

  if (hits.length) {
    const d = hits[0].object.userData;
    if (d && d.name) {
      tip.style.display = 'block';
      document.getElementById('tip-name').textContent = d.name;
      document.getElementById('tip-offers').textContent = d.offers.toLocaleString() + ' candidates';
      document.getElementById('tip-wait').textContent = d.avgWait.toFixed(1) + ' mo (~' + monthNames[Math.round(d.avgWait)] + ')';
      document.getElementById('tip-intern').textContent = d.internPct + '%';
      document.getElementById('tip-region').textContent = d.region;
      document.getElementById('tip-bar').style.width = (d.offers / maxOffers * 100) + '%';
      
      d3.selectAll('.bar-rect').attr('opacity', b => b.name === d.name ? 1 : 0.25);

      if (hovMesh !== hits[0].object) {
        if (hovMesh) hovMesh.material.emissive.setScalar(0);
        hovMesh = hits[0].object;
        hovMesh.material.emissive.setScalar(0.18);
      }
    }
  } else {
    tip.style.display = 'none';
    if (hovMesh) { hovMesh.material.emissive.setScalar(0); hovMesh = null; }
    d3.selectAll('.bar-rect').attr('opacity', 1);
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(renderLoop);

/* ═══════════════════════════════════════════
   D3 — Bar Chart + Stats + Filters
   ═══════════════════════════════════════════ */
const barSvg = d3.select('#bar-chart-svg');
const bM = { t: 4, r: 36, b: 4, l: 95 }, bW = 280 - bM.l - bM.r;

function drawBars(data) {
  const top12 = [...data].sort((a, b) => b.offers - a.offers).slice(0, 12);
  const bH = top12.length * 22 + bM.t + bM.b;
  barSvg.attr('height', bH).attr('viewBox', `0 0 280 ${bH}`);
  const g = barSvg.selectAll('.bar-g').data([0]).join('g').attr('class','bar-g').attr('transform',`translate(${bM.l},${bM.t})`);
  const yS = d3.scaleBand().domain(top12.map(d => d.name)).range([0, bH - bM.t - bM.b]).padding(.25);
  const xS = d3.scaleLinear().domain([0, d3.max(top12, d => d.offers)]).range([0, bW]);

  const bars = g.selectAll('.bar-rect').data(top12, d => d.name);
  bars.exit().transition().duration(300).attr('width', 0).remove();
  bars.enter().append('rect').attr('class','bar-rect').attr('x',0).attr('height', yS.bandwidth()).attr('rx',2).attr('width',0)
    .merge(bars)
    .on('mouseenter', function(e, d) {
      columnMeshes.forEach(c => {
        c.mesh.material.opacity = c.data.name === d.name ? 1 : 0.15;
        c.mesh.material.transparent = true;
      });
    })
    .on('mouseleave', function() {
      columnMeshes.forEach(c => { c.mesh.material.opacity = 1; c.mesh.material.transparent = false; });
    })
    .transition().duration(500)
    .attr('y', d => yS(d.name)).attr('height', yS.bandwidth())
    .attr('width', d => xS(d.offers)).attr('fill', d => waitColorScale(d.avgWait));

  const l = g.selectAll('.bar-label').data(top12, d => d.name); l.exit().remove();
  l.enter().append('text').attr('class','bar-label').merge(l).transition().duration(500)
    .attr('x', -4).attr('y', d => yS(d.name) + yS.bandwidth()/2 + 3.5).attr('text-anchor','end')
    .text(d => { let n = d.name.replace(/ \(.*\)/,''); return n.length > 15 ? n.slice(0,14)+'…' : n; });

  const v = g.selectAll('.bar-value').data(top12, d => d.name); v.exit().remove();
  v.enter().append('text').attr('class','bar-value').merge(v).transition().duration(500)
    .attr('x', d => xS(d.offers) + 4).attr('y', d => yS(d.name) + yS.bandwidth()/2 + 3.5).text(d => d.offers);
}

function updateStats(data) {
  document.getElementById('stat-cities').textContent = data.length;
  document.getElementById('stat-offers').textContent = d3.sum(data, d => d.offers).toLocaleString();
  const avg = d3.mean(data, d => d.avgWait);
  document.getElementById('stat-wait').textContent = avg ? avg.toFixed(1) : '—';
}

// ── Filters ──
let reg = 'all', mxW = 18, sH = true, sL = true;
function applyFilters() {
  filtered = allCities.filter(d => {
    if (d.avgWait > mxW) return false;
    if (reg !== 'all' && d.region !== reg) return false;
    if (!sH && d.internPct >= 50) return false;
    if (!sL && d.internPct < 50) return false;
    return true;
  });
  buildColumns(filtered, false);
  createLabels(filtered);
  drawBars(filtered);
  updateStats(filtered);
}

document.getElementById('wait-slider').addEventListener('input', function() {
  mxW = +this.value;
  document.getElementById('wait-val').textContent = mxW.toFixed(1);
  applyFilters();
});
document.getElementById('chk-intern-high').addEventListener('change', function() { sH = this.checked; applyFilters(); });
document.getElementById('chk-intern-low').addEventListener('change', function() { sL = this.checked; applyFilters(); });
document.querySelectorAll('.region-btn').forEach(b => b.addEventListener('click', function() {
  document.querySelectorAll('.region-btn').forEach(x => x.classList.remove('active'));
  this.classList.add('active');
  reg = this.dataset.region;
  applyFilters();
}));

// ── Replay ──
document.getElementById('play-btn').addEventListener('click', function() {
  buildColumns(filtered, true);
});

// ── Sidebar Toggle ──
const appEl = document.getElementById('app');
const toggleBtn = document.getElementById('toggle-btn');
toggleBtn.addEventListener('click', function() {
  appEl.classList.toggle('sidebar-hidden');
  const isHidden = appEl.classList.contains('sidebar-hidden');
  toggleBtn.querySelector('span').textContent = isHidden ? 'Show Controls' : 'Controls';
  setTimeout(() => {
    dim();
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }, 420);
});

// ── Resize ──
window.addEventListener('resize', () => {
  dim();
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
});

/* ═══════════════════════════════════════════
   INIT — Load data + build scene
   ═══════════════════════════════════════════ */
Promise.all([
  d3.json(HD_MAP_URL).catch(() => null),
  d3.csv('ng_offers_ontario.csv').catch(() => FALLBACK)
]).then(([mapData, raw]) => {
  if (mapData && mapData.features) {
    const ontario = mapData.features.find(f => f.properties.name === 'Ontario');
    if (ontario) createMapPlatform(ontario);
  }

  const data = Array.isArray(raw) && raw.length && typeof raw[0] === 'object' && 'name' in raw[0]
    ? raw.map(d => ({ name: d.name, lon: +d.lon, lat: +d.lat, offers: +d.offers, avgWait: +d.avgWait, internPct: +d.internPct, region: d.region }))
    : FALLBACK;

  allCities = data;
  filtered = [...data];
  maxOffers = d3.max(data, d => d.offers);

  const el = document.getElementById('loading');
  if (el) el.remove();

  buildColumns(data, true);
  createLabels(data);
  drawBars(data);
  updateStats(data);
});