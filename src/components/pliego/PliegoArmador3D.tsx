import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  ARMADO_ORDEN,
  RANURAS,
  RANURA_X,
  REGLAS,
  type Armado,
  type ArmadoCara,
  type ArmadoSlug,
} from "../../lib/pliego-armado";

/** El Soporte 24 en 3D, con los accesorios del armado en sus ranuras.
 *
 *  Todo está en milímetros, con las medidas del plano de fabricación: el
 *  soporte mide 596,9 × 228,6 × 114,3, el labio de adelante baja 23,8 y el
 *  pliegue de atrás 57,2. Las piezas son volúmenes simples, sin texturas:
 *  alcanza para ver qué va dónde y cuánto ocupa, que es lo que se decide acá.
 *
 *  Este archivo trae three.js (~150 kB comprimido), así que se carga aparte,
 *  solo cuando el armador entra en pantalla. */

type Props = {
  armado: Armado;
  vista: ArmadoCara;
  /** Sube cada vez que se pide una vista, aunque sea la misma de antes (la
   *  persona giró a mano y vuelve a tocar "Frente"). */
  pedido: number;
  descripcion: string;
  /** Sin WebGL (navegador viejo, aceleración apagada): el armador muestra la
   *  foto en su lugar. */
  onError: () => void;
  /** Cuando la persona gira el soporte a mano, para que los botones de vista
   *  no queden marcando una que ya no es. */
  onGiro?: () => void;
};

// ── Medidas (mm) ───────────────────────────────────────────────

const LARGO = 596.9;
const FONDO = 228.6;
const ALTO = 114.3;
const CHAPA = 1.5;
const LABIO = 23.8;
const PLIEGUE_ATRAS = 57.2;
const RETORNO = 14;
const PIE = 22;
const RADIO = 10;
/** Altura del centro de las ranuras: a 9,3 + 2,6 mm del borde superior. */
const Y_RANURA = ALTO - 9.3 - 2.6;
const Z_FRENTE = FONDO / 2;

// ── Materiales ─────────────────────────────────────────────────

function materiales() {
  const mate = (color: string, roughness = 0.75, metalness = 0.25) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    // RAL 7021, gris negruzco, pintura en polvo mate.
    acero: mate("#3A3E40", 0.72, 0.35),
    ranura: mate("#141617", 0.9, 0),
    // El monitor va claro, como maqueta: está para la escala, no para mirarlo.
    monitor: mate("#D3CFC7", 0.8, 0),
    pantalla: mate("#E6E3DC", 0.6, 0),
    celular: mate("#1C1E20", 0.4, 0.3),
    pantallaCelular: mate("#46555A", 0.25, 0.1),
    blanco: mate("#ECE9E2", 0.6, 0),
    eva: mate("#55595A", 0.95, 0),
    cable: mate("#E2DFD8", 0.55, 0),
    lapicera: mate("#2E3A33", 0.5, 0.2),
  };
}
type Mats = ReturnType<typeof materiales>;

function caja(
  ancho: number,
  alto: number,
  prof: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, prof), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ── El soporte ─────────────────────────────────────────────────

/** El perfil de la vista frontal (patas, pies y tapa con los radios de 10
 *  mm), extruido a lo largo de la profundidad: una sola chapa plegada. */
function perfil(): THREE.Shape {
  const s = new THREE.Shape();
  const L = LARGO;
  const ri = RADIO - CHAPA;
  s.moveTo(PIE, 0);
  s.lineTo(0, 0);
  s.lineTo(0, ALTO - RADIO);
  s.quadraticCurveTo(0, ALTO, RADIO, ALTO);
  s.lineTo(L - RADIO, ALTO);
  s.quadraticCurveTo(L, ALTO, L, ALTO - RADIO);
  s.lineTo(L, 0);
  s.lineTo(L - PIE, 0);
  s.lineTo(L - PIE, CHAPA);
  s.lineTo(L - CHAPA, CHAPA);
  s.lineTo(L - CHAPA, ALTO - RADIO);
  s.quadraticCurveTo(L - CHAPA, ALTO - CHAPA, L - CHAPA - ri, ALTO - CHAPA);
  s.lineTo(CHAPA + ri, ALTO - CHAPA);
  s.quadraticCurveTo(CHAPA, ALTO - CHAPA, CHAPA, ALTO - RADIO);
  s.lineTo(CHAPA, CHAPA);
  s.lineTo(PIE, CHAPA);
  s.closePath();
  return s;
}

function soporte(m: Mats): THREE.Group {
  const g = new THREE.Group();

  const geo = new THREE.ExtrudeGeometry(perfil(), {
    depth: FONDO,
    bevelEnabled: false,
    curveSegments: 10,
  });
  geo.translate(-LARGO / 2, 0, -FONDO / 2);
  const cuerpo = new THREE.Mesh(geo, m.acero);
  cuerpo.castShadow = true;
  cuerpo.receiveShadow = true;
  g.add(cuerpo);

  const adentro = LARGO - 2 * CHAPA - 2 * RADIO;
  // Labio de adelante y su retorno hacia adentro.
  g.add(caja(adentro, LABIO, CHAPA, m.acero, 0, ALTO - LABIO / 2, Z_FRENTE - CHAPA / 2));
  g.add(
    caja(adentro, CHAPA, RETORNO, m.acero, 0, ALTO - LABIO + CHAPA / 2, Z_FRENTE - RETORNO / 2),
  );
  // Pliegue de atrás, más alto, con su retorno.
  g.add(
    caja(adentro, PLIEGUE_ATRAS, CHAPA, m.acero, 0, ALTO - PLIEGUE_ATRAS / 2, -Z_FRENTE + CHAPA / 2),
  );
  g.add(
    caja(
      adentro,
      CHAPA,
      RETORNO,
      m.acero,
      0,
      ALTO - PLIEGUE_ATRAS + CHAPA / 2,
      -Z_FRENTE + RETORNO / 2,
    ),
  );

  // Las doce ranuras: 68 × 5,2 mm, apenas salidas del frente para que se vean.
  const geoRanura = new RoundedBoxGeometry(68, 5.2, 0.6, 2, 2.4);
  for (const x of RANURA_X) {
    for (const z of [Z_FRENTE + 0.2, -Z_FRENTE - 0.2]) {
      const r = new THREE.Mesh(geoRanura, m.ranura);
      r.position.set(x, Y_RANURA, z);
      g.add(r);
    }
  }
  return g;
}

/** Un monitor genérico encima, para la escala. */
function monitor(m: Mats): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(240, 8, 170, 2, 3), m.monitor);
  base.position.set(0, ALTO + 4, -25);
  base.castShadow = true;
  g.add(base);
  g.add(caja(46, 150, 22, m.monitor, 0, ALTO + 80, -60));
  const marco = new THREE.Mesh(new RoundedBoxGeometry(560, 330, 22, 2, 4), m.monitor);
  marco.position.set(0, ALTO + 140 + 165, -48);
  marco.castShadow = true;
  g.add(marco);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(544, 306), m.pantalla);
  pantalla.position.set(0, ALTO + 140 + 168, -36.9);
  g.add(pantalla);
  return g;
}

// ── Los accesorios ─────────────────────────────────────────────
// Cada uno se arma con el origen en el centro de su ranura y +z hacia afuera
// del soporte. Después se ubica en la ranura (y se gira si va atrás).

/** La lengüeta que entra en la ranura y la placa que baja pegada al labio. */
function enganche(m: Mats, ancho: number, bajo: number): THREE.Object3D[] {
  return [
    caja(ancho - 10, 4, 6, m.acero, 0, 0, -2),
    caja(ancho, bajo + 6, 1.2, m.acero, 0, -bajo / 2 + 3, 1.2),
  ];
}

function celular(m: Mats): THREE.Group {
  const g = new THREE.Group();
  const fondoRepisa = -26;
  g.add(...enganche(m, 64, 26));
  // Repisa y labio que frenan el celular.
  g.add(caja(64, 1.2, 24, m.acero, 0, fondoRepisa, 12));
  g.add(caja(64, 9, 1.2, m.acero, 0, fondoRepisa + 4.5, 24));

  // El celular, apoyado en la repisa y a 75°.
  const tel = new THREE.Group();
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(72, 148, 8, 3, 6), m.celular);
  cuerpo.castShadow = true;
  tel.add(cuerpo);
  const pantalla = new THREE.Mesh(new RoundedBoxGeometry(66, 140, 0.4, 2, 5), m.pantallaCelular);
  pantalla.position.z = 4.1;
  tel.add(pantalla);
  const inclinacion = THREE.MathUtils.degToRad(15);
  tel.rotation.x = -inclinacion;
  const base = new THREE.Vector3(0, fondoRepisa + 0.6, 17);
  const arriba = new THREE.Vector3(0, Math.cos(inclinacion), -Math.sin(inclinacion));
  tel.position.copy(base).addScaledVector(arriba, 74);
  g.add(tel);
  return g;
}

function bandeja(m: Mats): THREE.Group {
  const g = new THREE.Group();
  g.add(...enganche(m, 60, 16));
  // La bandeja cuelga debajo del labio: 220 × 75 de base, 30 de alto.
  const arriba = -14;
  const alto = 30;
  const y = arriba - alto / 2;
  const z0 = 2;
  const prof = 75;
  g.add(caja(220, CHAPA, prof, m.acero, 0, arriba - alto, z0 + prof / 2));
  g.add(caja(220, alto, CHAPA, m.acero, 0, y, z0));
  g.add(caja(220, alto, CHAPA, m.acero, 0, y, z0 + prof));
  g.add(caja(CHAPA, alto, prof, m.acero, -110, y, z0 + prof / 2));
  g.add(caja(CHAPA, alto, prof, m.acero, 110, y, z0 + prof / 2));

  // Un cable enrollado y una lapicera.
  const rollo = new THREE.Mesh(new THREE.TorusGeometry(22, 3, 10, 40), m.cable);
  rollo.rotation.x = Math.PI / 2;
  rollo.position.set(-45, arriba - alto + 4, z0 + prof / 2);
  rollo.castShadow = true;
  g.add(rollo);
  const rollo2 = rollo.clone();
  rollo2.position.y += 6;
  rollo2.position.x += 3;
  g.add(rollo2);
  const lapicera = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 140, 16), m.lapicera);
  lapicera.rotation.z = Math.PI / 2 - 0.12;
  lapicera.rotation.y = 0.25;
  lapicera.position.set(30, arriba - alto + 12, z0 + prof / 2);
  lapicera.castShadow = true;
  g.add(lapicera);
  return g;
}

function auriculares(m: Mats): THREE.Group {
  const g = new THREE.Group();
  g.add(...enganche(m, 38, 18));
  // Brazo que sale del labio y cuna de 38 mm con EVA.
  const yBrazo = -18;
  g.add(caja(38, CHAPA, 30, m.acero, 0, yBrazo, 16));
  g.add(caja(38, 4, 26, m.eva, 0, yBrazo - 2.6, 17));

  // Los auriculares, colgados de la vincha.
  const radio = 52;
  const centro = yBrazo - 4.6 - 8 - radio;
  const zAur = 20;
  const vincha = new THREE.Mesh(new THREE.TorusGeometry(radio, 8, 14, 48, Math.PI), m.blanco);
  vincha.position.set(0, centro, zAur);
  vincha.castShadow = true;
  g.add(vincha);
  for (const lado of [-1, 1]) {
    const copa = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 26, 28), m.blanco);
    copa.rotation.z = Math.PI / 2;
    copa.position.set(lado * (radio - 4), centro - 6, zAur);
    copa.castShadow = true;
    g.add(copa);
  }
  return g;
}

/** La lista del día dibujada sobre el panel: tres viñetas con su renglón. */
function texturaPanel(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 420;
  c.height = 280;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#4A4F51";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#E9E6DF";
  ctx.fillStyle = "#E9E6DF";
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  const largos = [180, 230, 270];
  largos.forEach((largo, i) => {
    const y = 70 + i * 62;
    ctx.beginPath();
    ctx.arc(50, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(78, y);
    // Un trazo apenas ondulado, como escrito con fibra.
    for (let x = 78; x <= 78 + largo; x += 12) {
      ctx.lineTo(x, y + Math.sin(x * 0.21 + i) * 3);
    }
    ctx.stroke();
  });
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, 252);
  ctx.lineTo(330, 244);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function panel(m: Mats): THREE.Group {
  const g = new THREE.Group();
  g.add(...enganche(m, 60, 10));
  const yApoyo = -10;
  g.add(caja(60, CHAPA, 16, m.acero, 0, yApoyo, 9));

  // El panel de 210 × 140 sube por delante del monitor, a 75°.
  const p = new THREE.Group();
  const textura = texturaPanel();
  const frente = new THREE.MeshStandardMaterial({ map: textura, roughness: 0.85 });
  frente.userData.propio = true;
  const caras = [m.acero, m.acero, m.acero, m.acero, frente, m.acero];
  const tabla = new THREE.Mesh(new THREE.BoxGeometry(210, 140, 3), caras);
  tabla.castShadow = true;
  p.add(tabla);
  const fibra = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 110, 14), m.celular);
  fibra.position.set(92, -4, 6);
  p.add(fibra);
  const inclinacion = THREE.MathUtils.degToRad(15);
  p.rotation.x = -inclinacion;
  const base = new THREE.Vector3(0, yApoyo + 1, 14);
  const arriba = new THREE.Vector3(0, Math.cos(inclinacion), -Math.sin(inclinacion));
  p.position.copy(base).addScaledVector(arriba, 70);
  g.add(p);
  return g;
}

function guiaCables(m: Mats): THREE.Group {
  const g = new THREE.Group();
  g.add(...enganche(m, 68, 32));
  // Canal de 18 × 30: piso y pared exterior.
  const piso = -30;
  g.add(caja(68, CHAPA, 18, m.acero, 0, piso, 10));
  g.add(caja(68, 14, CHAPA, m.acero, 0, piso + 7, 19));
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 220, 12), m.cable);
  cable.rotation.z = Math.PI / 2;
  cable.position.set(0, piso + 4, 10);
  cable.castShadow = true;
  g.add(cable);
  return g;
}

const ARMAR: Record<ArmadoSlug, (m: Mats) => THREE.Group> = {
  "soporte-celular": celular,
  bandeja,
  "porta-auriculares": auriculares,
  "panel-de-flujo": panel,
  "guia-de-cables": guiaCables,
};

function ubicar(grupo: THREE.Group, cara: ArmadoCara, ranura: number) {
  if (cara === "frente") {
    grupo.position.set(RANURA_X[ranura], Y_RANURA, Z_FRENTE);
  } else {
    // Mirando desde atrás, la ranura 1 es la de la izquierda.
    grupo.position.set(RANURA_X[RANURAS - 1 - ranura], Y_RANURA, -Z_FRENTE);
    grupo.rotation.y = Math.PI;
  }
}

// ── La escena ──────────────────────────────────────────────────

const OBJETIVO = new THREE.Vector3(0, 125, 0);
/** Lo que tiene que entrar de ancho en cuadro: el soporte con los
 *  auriculares y la bandeja colgando. */
const ANCHO_CUADRO = 900;
const DIRECCION: Record<ArmadoCara, THREE.Spherical> = {
  frente: new THREE.Spherical(1, THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(18)),
  atras: new THREE.Spherical(1, THREE.MathUtils.degToRad(64), THREE.MathUtils.degToRad(205)),
};

function distanciaPara(camara: THREE.PerspectiveCamera): number {
  const vfov = THREE.MathUtils.degToRad(camara.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camara.aspect);
  return ANCHO_CUADRO / 2 / Math.tan(hfov / 2);
}

function liberar(obj: THREE.Object3D) {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial && mat.map) mat.map.dispose();
        if (mat.userData.propio) mat.dispose();
      }
    }
  });
}

type Escena = {
  armar: (armado: Armado) => void;
  mirar: (vista: ArmadoCara) => void;
  destruir: () => void;
};

function crearEscena(
  contenedor: HTMLDivElement,
  canvas: HTMLCanvasElement,
  onGiro: () => void,
): Escena {
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tactil = window.matchMedia("(pointer: coarse)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(28, 1, 10, 10000);

  scene.add(new THREE.HemisphereLight("#ffffff", "#d9d4c9", 1.9));
  const sol = new THREE.DirectionalLight("#ffffff", 2.4);
  sol.position.set(350, 900, 650);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -520;
  sol.shadow.camera.right = 520;
  sol.shadow.camera.top = 520;
  sol.shadow.camera.bottom = -520;
  sol.shadow.camera.far = 2500;
  sol.shadow.bias = -0.0004;
  sol.shadow.radius = 4;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight("#ffffff", 0.7);
  relleno.position.set(-500, 300, -600);
  scene.add(relleno);

  // La mesa no se dibuja: solo recibe la sombra, y el fondo es el de la página.
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.ShadowMaterial({ opacity: 0.16 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);

  const m = materiales();
  scene.add(soporte(m));
  scene.add(monitor(m));

  const controles = new OrbitControls(camara, canvas);
  controles.target.copy(OBJETIVO);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.enablePan = false;
  controles.minPolarAngle = THREE.MathUtils.degToRad(25);
  controles.maxPolarAngle = THREE.MathUtils.degToRad(88);
  // En el celular el dedo tiene que poder seguir bajando la página: el
  // arrastre vertical scrollea y el horizontal gira. Sin zoom con pellizco.
  if (tactil) {
    controles.enableZoom = false;
    canvas.style.touchAction = "pan-y";
  } else {
    controles.enableZoom = true;
    controles.zoomSpeed = 0.6;
  }

  // Giro animado entre vistas, en coordenadas esféricas para que pase por el
  // costado y no atraviese el soporte.
  let giro: { desde: THREE.Spherical; hasta: THREE.Spherical; t: number } | null = null;
  controles.addEventListener("start", () => {
    giro = null;
    onGiro();
  });

  // Accesorios puestos, por "slug:cara:ranura", y los que están bajando.
  const puestos = new Map<string, THREE.Group>();
  const bajando = new Map<THREE.Group, number>();

  const ajustar = () => {
    const { clientWidth: w, clientHeight: h } = contenedor;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    const d = distanciaPara(camara);
    controles.minDistance = d * 0.55;
    controles.maxDistance = d * 1.5;
    const off = new THREE.Vector3().subVectors(camara.position, OBJETIVO);
    const esf = new THREE.Spherical().setFromVector3(off);
    esf.radius = d;
    camara.position.setFromSpherical(esf).add(OBJETIVO);
  };

  camara.position.setFromSpherical(DIRECCION.frente).add(OBJETIVO);
  ajustar();

  const reloj = new THREE.Clock();
  let visible = true;
  let cuadro = 0;

  const paso = () => {
    cuadro = requestAnimationFrame(paso);
    if (!visible) return;
    const dt = Math.min(reloj.getDelta(), 0.05);

    if (giro) {
      giro.t = Math.min(1, giro.t + dt / 0.9);
      const k = 1 - Math.pow(1 - giro.t, 3);
      let dTheta = giro.hasta.theta - giro.desde.theta;
      dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
      const s = new THREE.Spherical(
        THREE.MathUtils.lerp(giro.desde.radius, giro.hasta.radius, k),
        THREE.MathUtils.lerp(giro.desde.phi, giro.hasta.phi, k),
        giro.desde.theta + dTheta * k,
      );
      camara.position.setFromSpherical(s).add(OBJETIVO);
      if (giro.t >= 1) giro = null;
    }

    for (const [grupo, t] of bajando) {
      const nuevo = Math.min(1, t + dt / 0.45);
      const k = 1 - Math.pow(1 - nuevo, 3);
      grupo.userData.offset.y = (1 - k) * 70;
      grupo.position.y = grupo.userData.base + grupo.userData.offset.y;
      if (nuevo >= 1) bajando.delete(grupo);
      else bajando.set(grupo, nuevo);
    }

    controles.update();
    renderer.render(scene, camara);
  };
  paso();

  const ro = new ResizeObserver(ajustar);
  ro.observe(contenedor);
  // Fuera de pantalla no se dibuja: la página sigue liviana al scrollear.
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    reloj.getDelta();
  });
  io.observe(contenedor);

  return {
    armar(armado) {
      const quedan = new Set<string>();
      for (const slug of ARMADO_ORDEN) {
        const { cara } = REGLAS[slug];
        for (const ranura of armado[slug] ?? []) {
          const clave = `${slug}:${cara}:${ranura}`;
          quedan.add(clave);
          if (puestos.has(clave)) continue;
          const grupo = ARMAR[slug](m);
          ubicar(grupo, cara, ranura);
          grupo.userData.base = grupo.position.y;
          grupo.userData.offset = new THREE.Vector3();
          scene.add(grupo);
          puestos.set(clave, grupo);
          if (!sinMovimiento) bajando.set(grupo, 0);
        }
      }
      for (const [clave, grupo] of puestos) {
        if (quedan.has(clave)) continue;
        scene.remove(grupo);
        bajando.delete(grupo);
        liberar(grupo);
        puestos.delete(clave);
      }
    },
    mirar(vista) {
      const hasta = DIRECCION[vista].clone();
      hasta.radius = distanciaPara(camara);
      const desde = new THREE.Spherical().setFromVector3(
        new THREE.Vector3().subVectors(camara.position, OBJETIVO),
      );
      if (sinMovimiento) {
        camara.position.setFromSpherical(hasta).add(OBJETIVO);
        giro = null;
      } else {
        giro = { desde, hasta, t: 0 };
      }
    },
    destruir() {
      cancelAnimationFrame(cuadro);
      ro.disconnect();
      io.disconnect();
      controles.dispose();
      liberar(scene);
      for (const mat of Object.values(m)) mat.dispose();
      renderer.dispose();
    },
  };
}

export default function PliegoArmador3D({
  armado,
  vista,
  pedido,
  descripcion,
  onError,
  onGiro,
}: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const escenaRef = useRef<Escena | null>(null);
  const onGiroRef = useRef(onGiro);
  onGiroRef.current = onGiro;
  const primeraVista = useRef(true);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    const canvas = canvasRef.current;
    if (!contenedor || !canvas) return;
    try {
      escenaRef.current = crearEscena(contenedor, canvas, () => onGiroRef.current?.());
    } catch {
      onError();
      return;
    }
    return () => {
      escenaRef.current?.destruir();
      escenaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    escenaRef.current?.armar(armado);
  }, [armado]);

  useEffect(() => {
    // La primera vez la cámara ya arranca de frente.
    if (primeraVista.current) {
      primeraVista.current = false;
      return;
    }
    escenaRef.current?.mirar(vista);
  }, [vista, pedido]);

  return (
    <div ref={contenedorRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={descripcion}
        className="block h-full w-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
