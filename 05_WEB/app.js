const map=L.map('map',{zoomControl:false,preferCanvas:true});
L.control.zoom({position:'bottomright'}).addTo(map);
const imagery=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Tiles © Esri'}).addTo(map);
const labels=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,pane:'overlayPane'}).addTo(map);
const topo=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenTopoMap'});
const layers={}, towerIndex=new Map();
const loading=document.getElementById('loading');
const safe=v=>v??'—';
const nav=(lat,lng)=>`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
async function json(path){const r=await fetch(path);if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()}
function towerIcon(f){const p=f.properties||{},anchor=/AMARRO/i.test(p.tipo||'');return L.divIcon({className:'',html:`<div class="tower-icon" style="background:${anchor?'#e11928':'#fff'};color:${anchor?'#fff':'#263746'};border:2px solid ${anchor?'#fff':'#7d8b99'}">${safe(p.torre_id)}</div>`,iconSize:[19,19],iconAnchor:[9,9]})}
function towerPopup(f,ll){const p=f.properties||{};return `<div class="popup-title">Sostegno ${safe(p.torre_id)}</div><div class="popup-grid"><b>Tipo</b><span>${safe(p.tipo)}</span><b>Tratto</b><span>${safe(p.tramo)}</span><b>Quota</b><span>${safe(p.cota_z)} m</span><b>Altezza</b><span>${safe(p.altura_m)} m</span><b>UTM Est</b><span>${safe(p.utm_este)}</span><b>UTM Nord</b><span>${safe(p.utm_norte)}</span></div><a class="maps-link" target="_blank" href="${nav(ll.lat,ll.lng)}">Apri navigazione</a>`}
const defs=[
 ['linea/buffer_400m.geojson','Buffer operativo 400 m',{style:{color:'#ffd400',weight:1.5,fillColor:'#ffd400',fillOpacity:.05,dashArray:'7 6'}}],
 ['linea/ejes_linea.geojson','Asse della linea',{style:{color:'#e11928',weight:4}}],
 ['wbk/accessi_temporanei.geojson','Accessi temporanei',{style:{color:'#00b7d9',weight:4}}],
 ['wbk/strade_temporanee_3_5m.geojson','Strade temporanee 3,5 m',{style:{color:'#007d9b',weight:1.5,fillColor:'#00d9ff',fillOpacity:.5}}],
 ['wbk/aree_macchine.geojson','Aree argano e freno',{style:{color:'#680068',weight:2,fillColor:'#e000e0',fillOpacity:.5},popup:p=>`<div class="popup-title">Area macchina</div><div class="popup-grid"><b>Tirata</b><span>${safe(p.tirada)}</span><b>Ruolo</b><span>${safe(p.rol)}</span><b>Sostegno</b><span>${safe(p.torre_id||p.torre_nombre)}</span><b>Distanza</b><span>${safe(p.distanza_m)} m</span><b>Stato</b><span>${safe(p.estado)}</span></div>`}],
 ['environment/habitat_natura2000.geojson','Habitat Natura 2000',{style:{color:'#8e44ad',weight:2,fillColor:'#9b59b6',fillOpacity:.3}}],
 ['environment/pericolosita_alluvione.geojson','Pericolosità alluvionale',{style:f=>{const n=Number(f.properties?.pericolo||1);return{color:'#1769a6',weight:1,fillColor:n>=3?'#2455a4':n===2?'#3f88c5':'#72b7dc',fillOpacity:.32}},popup:p=>`<div class="popup-title">Pericolosità alluvionale</div><div class="popup-grid"><b>Classe</b><span>${safe(p.pericolo)}</span><b>Ambito</b><span>${safe(p.ambito)}</span><b>Nome</b><span>${safe(p.name)}</span></div>`}],
 ['infrastructure/red_viaria.geojson','Rete viaria',{style:f=>({color:f.properties?.paved?'#ff9f1c':'#f5f5f5',weight:f.properties?.paved?2.6:1.5,opacity:.85}),popup:p=>`<div class="popup-title">Viabilità</div><div class="popup-grid"><b>Tipo</b><span>${safe(p.highway)}</span><b>Superficie</b><span>${safe(p.surface)}</span><b>Nome</b><span>${safe(p.name)}</span></div>`}],
 ['catasto/fabbricati.geojson','Fabbricati catastali',{style:{color:'#50b5ff',weight:1,fillColor:'#50b5ff',fillOpacity:.08}}],
 ['catasto/parcelle.geojson','Particelle catastali',{style:{color:'#f47c00',weight:.8,fillOpacity:0},popup:p=>`<div class="popup-title">Particella catastale</div><div class="popup-grid"><b>Comune</b><span>${safe(p.ct24_cod_com)}</span><b>Foglio</b><span>${safe(p.ct24_foglio)}</span><b>Particella</b><span>${safe(p.ct24_numero)}</span><b>Area</b><span>${safe(p.ct24_area)} m²</span></div>`}]
];
async function buildLayer(path,name,opt){const data=await json(`data/${path}`);const layer=L.geoJSON(data,{style:opt.style,onEachFeature:(f,l)=>{if(opt.popup)l.bindPopup(opt.popup(f.properties||{}));}});layers[name]=layer;return layer}
async function init(){try{
 const [buffer,axis]=await Promise.all(defs.slice(0,2).map(d=>buildLayer(...d)));buffer.addTo(map);axis.addTo(map);map.fitBounds(buffer.getBounds(),{padding:[20,20]});
 const towers=await json('data/linea/apoyos.geojson');layers['Sostegni']=L.geoJSON(towers,{pointToLayer:(f,ll)=>L.marker(ll,{icon:towerIcon(f)}),onEachFeature:(f,l)=>{const id=String(f.properties?.torre_id||'').toUpperCase();towerIndex.set(id,l);l.bindPopup(towerPopup(f,l.getLatLng()))}}).addTo(map);document.getElementById('metric-towers').textContent=towers.features.length;
 const overlays={'Sostegni':layers['Sostegni'],'Asse della linea':axis,'Buffer operativo 400 m':buffer};
 for(const d of defs.slice(2)){const layer=await buildLayer(...d);overlays[d[1]]=layer;if(['Accessi temporanei','Aree argano e freno','Habitat Natura 2000'].includes(d[1]))layer.addTo(map)}
 L.control.layers({'Esri Satellite':imagery,'Carta topografica':topo},{'Etichette geografiche':labels,...overlays},{collapsed:false,position:'topright'}).addTo(map);
}catch(e){console.error(e);loading.textContent='Errore nel caricamento dei dati';return}loading.remove()}
function searchTower(){const q=document.getElementById('tower-search').value.trim().toUpperCase().replace('PORT.','PORTALE');const result=document.getElementById('search-result');let pair=[...towerIndex].find(([id])=>id===q)||[...towerIndex].find(([id])=>id.includes(q));if(!q||!pair){result.textContent='Sostegno non trovato';return}const l=pair[1];map.setView(l.getLatLng(),18);l.openPopup();result.textContent=`Sostegno ${pair[0]} selezionato`}
document.getElementById('search-btn').onclick=searchTower;document.getElementById('tower-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchTower()});document.getElementById('sidebar-toggle').onclick=()=>document.getElementById('sidebar').classList.toggle('open');init();
