import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
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
 *  Todo está en milímetros. El soporte mide 596,9 × 228,6 × 114,3, el labio
 *  de adelante baja 23,8 y el pliegue de atrás 57,2. Se arma como se fabrica:
 *  una chapa de 1,5 mm con los pliegues redondeados, las ranuras caladas en la
 *  tapa (como en las fotos, cerca del borde) y las patas apenas abiertas
 *  hacia afuera. Los accesorios también son chapa plegada: una lengüeta que
 *  entra en la ranura, pasa por arriba del borde y baja pegada al labio.
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
/** Radio exterior de los pliegues de las patas y del labio. */
const RADIO = 10;
const RADIO_LABIO = 3;
/** Las patas se abren hacia afuera, como en las fotos del prototipo. */
const APERTURA = THREE.MathUtils.degToRad(8);
/** Las gomas de los pies. */
const GOMA = 2;
/** El centro de las ranuras, medido desde el borde de la tapa: 9,3 + 2,6. */
const BORDE_RANURA = 11.9;
const Z_RANURA = FONDO / 2 - BORDE_RANURA;
const Z_FRENTE = FONDO / 2;
/** Chapa de los accesorios. */
const CHAPA_ACC = 1.2;

// ── Materiales ─────────────────────────────────────────────────

function materiales() {
  const std = (color: string, roughness: number, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const acero = std("#3B3F41", 0.48, 0.35);
  const aceroDoble = acero.clone();
  aceroDoble.side = THREE.DoubleSide;
  return {
    // RAL 7021, gris negruzco, pintura en polvo semimate.
    acero,
    aceroDoble,
    goma: std("#BDBBB5", 0.9),
    plasticoNegro: std("#1D1F21", 0.42),
    aluminio: std("#C8C9C8", 0.32, 0.75),
    tecla: std("#F2F1EE", 0.55),
    blanco: std("#EEEBE5", 0.5),
    almohadilla: std("#DEDAD2", 0.92),
    eva: std("#2A2C2D", 0.95),
    cableBlanco: std("#F1EFEA", 0.42),
    cableNegro: std("#18191A", 0.5),
    lapicera: std("#2F4B3B", 0.32, 0.25),
    metal: std("#D6D6D3", 0.22, 1),
    pizarra: std("#3E4345", 0.85),
  };
}
type Mats = ReturnType<typeof materiales>;

function malla(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[]): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ── Chapa plegada ──────────────────────────────────────────────

type Punto = [number, number];

/** La línea media de una chapa plegada: tramos rectos y, en cada esquina, un
 *  arco con el radio de esa esquina (radio de la línea media, no exterior). */
function plegar(puntos: Punto[], radios: number | number[], pasos = 12): THREE.Vector2[] {
  const radio = (i: number) => (Array.isArray(radios) ? radios[i] : radios);
  const v = puntos.map(([x, y]) => new THREE.Vector2(x, y));
  const linea: THREE.Vector2[] = [v[0].clone()];
  for (let i = 1; i < v.length - 1; i++) {
    const [a, p, b] = [v[i - 1], v[i], v[i + 1]];
    const d1 = p.clone().sub(a).normalize();
    const d2 = b.clone().sub(p).normalize();
    const giro = Math.acos(THREE.MathUtils.clamp(d1.dot(d2), -1, 1));
    const r = radio(i);
    if (giro < 1e-4 || r <= 0) {
      linea.push(p.clone());
      continue;
    }
    const sentido = Math.sign(d1.x * d2.y - d1.y * d2.x);
    const t1 = p.clone().addScaledVector(d1, -r * Math.tan(giro / 2));
    const centro = t1.clone().addScaledVector(new THREE.Vector2(-d1.y, d1.x), r * sentido);
    const a0 = Math.atan2(t1.y - centro.y, t1.x - centro.x);
    for (let k = 0; k <= pasos; k++) {
      const ang = a0 + (sentido * giro * k) / pasos;
      linea.push(new THREE.Vector2(centro.x + r * Math.cos(ang), centro.y + r * Math.sin(ang)));
    }
  }
  linea.push(v[v.length - 1].clone());
  return linea.filter((p, i) => i === 0 || p.distanceTo(linea[i - 1]) > 1e-3);
}

/** Una chapa del espesor dado que sigue `linea` (un perfil) y se extiende
 *  `ancho` mm a lo largo de z (perfil visto de frente, en x/y) o de x (perfil
 *  visto de costado, en z/y). Las caras grandes van suavizadas, así los
 *  pliegues brillan redondos; los cantos quedan vivos. */
function chapa(
  linea: THREE.Vector2[],
  espesor: number,
  ancho: number,
  eje: "z" | "x",
): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const h = espesor / 2;
  const w = ancho / 2;
  const n = linea.length;
  const P = (u: number, v: number, s: number): [number, number, number] =>
    eje === "z" ? [u, v, s] : [s, v, u];

  const tang = linea.map((_, i) =>
    linea[Math.min(n - 1, i + 1)].clone().sub(linea[Math.max(0, i - 1)]).normalize(),
  );
  const norm = tang.map((t) => new THREE.Vector2(-t.y, t.x));

  const vert = (p: [number, number, number], nn: [number, number, number]) => {
    pos.push(...p);
    nor.push(...nn);
    return pos.length / 3 - 1;
  };
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const C = new THREE.Vector3();
  const N = new THREE.Vector3();
  // El orden de los vértices sigue a la normal pedida: así la cara mira
  // hacia donde tiene que mirar, sin depender del sentido del perfil.
  const tri = (a: number, b: number, c: number) => {
    A.fromArray(pos, a * 3);
    B.fromArray(pos, b * 3).sub(A);
    C.fromArray(pos, c * 3).sub(A);
    N.fromArray(nor, a * 3);
    if (B.cross(C).dot(N) < 0) idx.push(a, c, b);
    else idx.push(a, b, c);
  };
  const quad = (a: number, b: number, c: number, d: number) => {
    tri(a, b, c);
    tri(a, c, d);
  };
  const lado = (i: number, s: number) => linea[i].clone().addScaledVector(norm[i], h * s);

  // Las dos caras grandes.
  for (const s of [1, -1]) {
    const fila = linea.map((_, i) => {
      const o = lado(i, s);
      const nn = P(norm[i].x * s, norm[i].y * s, 0);
      return [vert(P(o.x, o.y, -w), nn), vert(P(o.x, o.y, w), nn)];
    });
    for (let i = 0; i < n - 1; i++) quad(fila[i][0], fila[i + 1][0], fila[i + 1][1], fila[i][1]);
  }
  // Los cantos de los costados.
  for (const s of [1, -1]) {
    const nn = P(0, 0, s);
    const fila = linea.map((_, i) => {
      const o = lado(i, 1);
      const d = lado(i, -1);
      return [vert(P(o.x, o.y, s * w), nn), vert(P(d.x, d.y, s * w), nn)];
    });
    for (let i = 0; i < n - 1; i++) quad(fila[i][0], fila[i + 1][0], fila[i + 1][1], fila[i][1]);
  }
  // Las dos puntas del perfil.
  for (const [i, s] of [
    [0, -1],
    [n - 1, 1],
  ]) {
    const nn = P(tang[i].x * s, tang[i].y * s, 0);
    const o = lado(i, 1);
    const d = lado(i, -1);
    quad(
      vert(P(o.x, o.y, -w), nn),
      vert(P(o.x, o.y, w), nn),
      vert(P(d.x, d.y, w), nn),
      vert(P(d.x, d.y, -w), nn),
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return geo;
}

function rectRedondo(ancho: number, alto: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -ancho / 2;
  const y = -alto / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + ancho - r, y);
  s.absarc(x + ancho - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + ancho, y + alto - r);
  s.absarc(x + ancho - r, y + alto - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + alto);
  s.absarc(x + r, y + alto - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Una ranura de 68 × 5,2 con las puntas redondas, como agujero. */
function ranura(x: number, z: number): THREE.Path {
  const r = 2.6;
  const m = 34 - r;
  const p = new THREE.Path();
  p.moveTo(x - m, z - r);
  p.lineTo(x + m, z - r);
  p.absarc(x + m, z, r, -Math.PI / 2, Math.PI / 2, false);
  p.lineTo(x - m, z + r);
  p.absarc(x - m, z, r, Math.PI / 2, Math.PI * 1.5, false);
  return p;
}

// ── El soporte ─────────────────────────────────────────────────

function soporte(m: Mats): THREE.Group {
  const g = new THREE.Group();
  const h = CHAPA / 2;
  const tan = Math.tan(APERTURA);

  // La pata derecha vista de frente: pie hacia adentro, pata abierta y el
  // pliegue de 10 mm que la une con la tapa.
  const xPie = LARGO / 2 - h;
  const yArriba = ALTO - h;
  const xHombro = xPie - (yArriba - (GOMA + h)) * tan;
  const giroHombro = Math.PI / 2 - APERTURA;
  const rHombro = RADIO - h;
  const xTapa = xHombro - rHombro * Math.tan(giroHombro / 2);
  const pata: Punto[] = [
    [LARGO / 2 - PIE, GOMA + h],
    [xPie, GOMA + h],
    [xHombro, yArriba],
    [xTapa, yArriba],
  ];
  const radiosPata = [0, 2.5, rHombro, 0];
  for (const lado of [1, -1]) {
    const puntos = pata.map(([x, y]) => [x * lado, y] as Punto);
    g.add(malla(chapa(plegar(puntos, radiosPata), CHAPA, FONDO, "z"), m.acero));
  }

  // La tapa, con las doce ranuras caladas.
  const zTapa = FONDO / 2 - RADIO_LABIO;
  const tapa = new THREE.Shape();
  tapa.moveTo(-xTapa, -zTapa);
  tapa.lineTo(xTapa, -zTapa);
  tapa.lineTo(xTapa, zTapa);
  tapa.lineTo(-xTapa, zTapa);
  tapa.closePath();
  for (const x of RANURA_X) {
    tapa.holes.push(ranura(x, Z_RANURA), ranura(x, -Z_RANURA));
  }
  const geoTapa = new THREE.ExtrudeGeometry(tapa, {
    depth: CHAPA,
    bevelEnabled: false,
    curveSegments: 6,
  });
  geoTapa.rotateX(-Math.PI / 2);
  geoTapa.translate(0, ALTO - CHAPA, 0);
  g.add(malla(geoTapa, m.acero));

  // El labio de adelante y el pliegue de atrás, cada uno con su retorno.
  const rLabio = RADIO_LABIO - h;
  for (const [lado, baja] of [
    [1, LABIO],
    [-1, PLIEGUE_ATRAS],
  ]) {
    const perfil: Punto[] = [
      [zTapa * lado, yArriba],
      [(FONDO / 2 - h) * lado, yArriba],
      [(FONDO / 2 - h) * lado, ALTO - baja + h],
      [(FONDO / 2 - RETORNO) * lado, ALTO - baja + h],
    ];
    g.add(malla(chapa(plegar(perfil, [0, rLabio, rLabio, 0]), CHAPA, xTapa * 2, "x"), m.acero));
  }

  // Las gomas, adelante y atrás de cada pie.
  const geoGoma = new RoundedBoxGeometry(16, GOMA, 26, 2, 0.8);
  for (const lado of [1, -1]) {
    for (const z of [1, -1]) {
      const goma = malla(geoGoma, m.goma);
      goma.position.set(lado * (LARGO / 2 - 11), GOMA / 2, z * (FONDO / 2 - 22));
      g.add(goma);
    }
  }
  return g;
}

/** Una sombra de contacto suave debajo del soporte: la que la luz directa
 *  no alcanza a dar y que hace que apoye en la mesa en vez de flotar. */
function sombraDeContacto(): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 64, 8, 128, 64, 128);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.setTransform(1, 0, 0, 0.5, 0, 32);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  mat.userData.propio = true;
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(LARGO * 1.35, FONDO * 1.9), mat);
  plano.rotation.x = -Math.PI / 2;
  plano.position.y = 0.2;
  return plano;
}

// ── Lo que está alrededor, para la escala ──────────────────────

/** Un paisaje de montañas con bosque, el fondo de pantalla de las fotos. */
function paisaje(ancho: number, alto: number, reloj?: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = ancho;
  c.height = alto;
  const ctx = c.getContext("2d")!;
  const cielo = ctx.createLinearGradient(0, 0, 0, alto);
  cielo.addColorStop(0, reloj ? "#2C3A3C" : "#B9C3BF");
  cielo.addColorStop(1, reloj ? "#5E716D" : "#E2E5DF");
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ancho, alto);

  const capas = reloj
    ? ["#6F807C", "#566A65", "#40554F", "#2F443D", "#22352F", "#172620"]
    : ["#9AAAA5", "#7B8E88", "#5B716A", "#3F574F", "#2A3F38", "#1C2D27"];
  capas.forEach((color, i) => {
    const base = alto * (0.42 + i * 0.1);
    const amp = alto * (0.06 + i * 0.012);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, alto);
    for (let x = 0; x <= ancho; x += 4) {
      const t = x / ancho;
      const y =
        base -
        amp * Math.sin(t * (3 + i) + i * 1.7) -
        amp * 0.45 * Math.sin(t * (11 + i * 2) + i) -
        amp * 0.2 * Math.sin(t * 29 + i * 3);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(ancho, alto);
    ctx.fill();
    // Las tres capas de adelante llevan pinos.
    if (i >= 3) {
      const paso = ancho / (26 + i * 10);
      for (let x = 0; x < ancho; x += paso * (0.7 + ((x * 7) % 5) / 8)) {
        const t = x / ancho;
        const y =
          base -
          amp * Math.sin(t * (3 + i) + i * 1.7) -
          amp * 0.45 * Math.sin(t * (11 + i * 2) + i) -
          amp * 0.2 * Math.sin(t * 29 + i * 3);
        const alt = paso * (1.6 + ((x * 13) % 7) / 6);
        ctx.beginPath();
        ctx.moveTo(x - paso * 0.38, y + 2);
        ctx.lineTo(x, y - alt);
        ctx.lineTo(x + paso * 0.38, y + 2);
        ctx.fill();
      }
    }
  });

  if (reloj) {
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.textAlign = "center";
    ctx.font = `300 ${ancho * 0.26}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("10:24", ancho / 2, alto * 0.25);
    ctx.font = `400 ${ancho * 0.065}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("lunes, 24 de agosto", ancho / 2, alto * 0.31);
    // La isla de la cámara.
    ctx.fillStyle = "#0B0C0D";
    ctx.beginPath();
    ctx.roundRect(ancho * 0.36, alto * 0.02, ancho * 0.28, alto * 0.035, alto * 0.02);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function pantallaMaterial(tex: THREE.Texture): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: "#050505",
    emissive: "#ffffff",
    emissiveMap: tex,
    emissiveIntensity: 0.92,
    roughness: 0.18,
  });
  mat.userData.propio = true;
  return mat;
}

/** Un monitor de 24", negro y de bordes finos, apoyado en el soporte. */
function monitor(m: Mats): THREE.Group {
  const g = new THREE.Group();
  const piso = ALTO;
  const pie = malla(new RoundedBoxGeometry(250, 7, 180, 3, 3), m.plasticoNegro);
  pie.position.set(0, piso + 3.5, -8);
  g.add(pie);
  const cuello = malla(new RoundedBoxGeometry(64, 230, 16, 2, 4), m.plasticoNegro);
  cuello.position.set(0, piso + 120, -84);
  g.add(cuello);

  const yCentro = piso + 98 + 164;
  const cuerpo = malla(new RoundedBoxGeometry(556, 328, 10, 3, 2), m.plasticoNegro);
  cuerpo.position.set(0, yCentro, -45);
  g.add(cuerpo);
  const espalda = malla(new RoundedBoxGeometry(380, 230, 28, 4, 10), m.plasticoNegro);
  espalda.position.set(0, yCentro - 12, -62);
  g.add(espalda);

  const pantalla = new THREE.Mesh(
    new THREE.PlaneGeometry(540, 304),
    pantallaMaterial(paisaje(1024, 576)),
  );
  pantalla.position.set(0, yCentro + 4, -39.9);
  g.add(pantalla);
  return g;
}

/** Un teclado bajo delante del soporte: muestra el lugar que queda debajo. */
function teclado(m: Mats): THREE.Group {
  const g = new THREE.Group();
  const ancho = 285;
  const fondo = 115;
  const base = new THREE.ExtrudeGeometry(rectRedondo(ancho, fondo, 7), {
    depth: 6,
    bevelEnabled: true,
    bevelThickness: 1.2,
    bevelSize: 1.2,
    bevelSegments: 3,
    curveSegments: 8,
  });
  base.rotateX(-Math.PI / 2);
  base.translate(0, 1.2, 0);
  g.add(malla(base, m.aluminio));

  const paso = 19;
  const geoTecla = new RoundedBoxGeometry(16, 2.6, 16, 2, 1.6);
  const teclas = new THREE.InstancedMesh(geoTecla, m.tecla, 14 * 5 + 9);
  teclas.castShadow = true;
  teclas.receiveShadow = true;
  const mat4 = new THREE.Matrix4();
  const escala = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  let i = 0;
  const poner = (x: number, z: number, sx = 1, sz = 1) => {
    mat4.compose(new THREE.Vector3(x, 9.6, z), quat, escala.set(sx, 1, sz));
    teclas.setMatrixAt(i++, mat4);
  };
  const x0 = -((14 - 1) * paso) / 2;
  // La fila de funciones, más baja.
  for (let c = 0; c < 14; c++) poner(x0 + c * paso, -fondo / 2 + 10, 1, 0.55);
  for (let f = 0; f < 4; f++) {
    for (let c = 0; c < 14; c++) poner(x0 + c * paso, -fondo / 2 + 27 + f * paso);
  }
  // La última fila: cuatro teclas, la barra y cuatro más.
  const zUlt = -fondo / 2 + 27 + 4 * paso;
  for (let c = 0; c < 4; c++) poner(x0 + c * paso, zUlt);
  poner(0, zUlt, 6.8, 1);
  for (let c = 0; c < 4; c++) poner(-x0 - c * paso, zUlt);
  teclas.count = i;
  g.add(teclas);

  g.position.set(0, 0, Z_FRENTE + 42);
  return g;
}

// ── Los accesorios ─────────────────────────────────────────────
// Cada uno se arma con el origen en el centro de su ranura, a ras de la tapa,
// y +z hacia afuera del soporte. Después se ubica en la ranura (y se gira si
// va atrás). El borde del soporte queda en z = BORDE_RANURA.

/** Lo que tienen todos: la lengüeta que entra en la ranura, el puente que
 *  pasa por arriba del borde y la placa que baja pegada al labio. Desde ahí
 *  sigue cada accesorio con sus propios pliegues. */
function gancho(sigue: Punto[]): Punto[] {
  const hc = CHAPA_ACC / 2;
  const frente = BORDE_RANURA + hc;
  return [[0, -7], [0, hc], [frente, hc], ...sigue.map(([z, y]) => [frente + z, y] as Punto)];
}

function piezaDeChapa(m: Mats, puntos: Punto[], ancho: number, radio = 1.4): THREE.Mesh {
  return malla(chapa(plegar(puntos, radio), CHAPA_ACC, ancho, "x"), m.acero);
}

function celular(m: Mats): THREE.Group {
  const g = new THREE.Group();
  // Baja por el labio, sale una repisa de 29 mm y levanta un tope.
  const repisa = -28;
  g.add(piezaDeChapa(m, gancho([[0, repisa], [29, repisa], [29, repisa + 9]]), 76));
  // Dos alas a los costados, que lo encajonan.
  for (const lado of [-1, 1]) {
    const ala = malla(new RoundedBoxGeometry(CHAPA_ACC, 26, 18, 1, 0.5), m.acero);
    ala.position.set(lado * 37.4, repisa + 13, BORDE_RANURA + 10);
    g.add(ala);
  }

  // El celular, apoyado en la repisa y a 75°: la espalda toca el borde.
  const tel = new THREE.Group();
  const cuerpo = new THREE.ExtrudeGeometry(rectRedondo(70, 145, 9), {
    depth: 6,
    bevelEnabled: true,
    bevelThickness: 0.9,
    bevelSize: 0.9,
    bevelSegments: 3,
    curveSegments: 10,
  });
  cuerpo.translate(0, 145 / 2 + 0.9, 0.9);
  tel.add(malla(cuerpo, m.plasticoNegro));

  const geoPantalla = new THREE.ShapeGeometry(rectRedondo(66, 141, 8), 10);
  const uv = geoPantalla.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) / 66 + 0.5, uv.getY(i) / 141 + 0.5);
  }
  const pantalla = new THREE.Mesh(geoPantalla, pantallaMaterial(paisaje(330, 705, true)));
  pantalla.position.set(0, 145 / 2 + 0.9, 7.85);
  tel.add(pantalla);

  const inclinacion = THREE.MathUtils.degToRad(15);
  tel.rotation.x = -inclinacion;
  const apoyo = repisa + CHAPA_ACC / 2;
  tel.position.set(0, apoyo, BORDE_RANURA + CHAPA_ACC + (CHAPA_ACC - apoyo) * Math.tan(inclinacion));
  g.add(tel);
  return g;
}

/** Una bandeja de paredes inclinadas y esquinas redondas, hecha por anillos:
 *  cara de afuera, borde, cara de adentro, piso y base. */
function geoBandeja(
  ancho: number,
  fondo: number,
  alto: number,
  abre: number,
  esp: number,
): THREE.BufferGeometry {
  const seg = 6;
  const anillo = (w: number, d: number, r: number, y: number) => {
    const pts: THREE.Vector3[] = [];
    const esquinas: [number, number, number][] = [
      [w / 2 - r, d / 2 - r, 0],
      [-w / 2 + r, d / 2 - r, Math.PI / 2],
      [-w / 2 + r, -d / 2 + r, Math.PI],
      [w / 2 - r, -d / 2 + r, Math.PI * 1.5],
    ];
    for (const [cx, cz, a0] of esquinas) {
      for (let k = 0; k <= seg; k++) {
        const a = a0 + ((Math.PI / 2) * k) / seg;
        pts.push(new THREE.Vector3(cx + r * Math.cos(a), y, cz + r * Math.sin(a)));
      }
    }
    return pts;
  };
  const r0 = 7;
  const r1 = r0 + abre;
  const anillos = [
    anillo(ancho, fondo, r0, 0),
    anillo(ancho + 2 * abre, fondo + 2 * abre, r1, alto),
    anillo(ancho + 2 * abre - 2 * esp, fondo + 2 * abre - 2 * esp, r1 - esp, alto),
    anillo(ancho - 2 * esp, fondo - 2 * esp, r0 - esp, esp),
  ];
  const pos: number[] = [];
  const idx: number[] = [];
  const agregar = (pts: THREE.Vector3[]) => {
    const base = pos.length / 3;
    for (const p of pts) pos.push(p.x, p.y, p.z);
    return base;
  };
  const tira = (a: THREE.Vector3[], b: THREE.Vector3[]) => {
    const ia = agregar(a);
    const ib = agregar(b);
    const n = a.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      idx.push(ia + i, ib + i, ib + j, ia + i, ib + j, ia + j);
    }
  };
  const tapa = (a: THREE.Vector3[]) => {
    const centro = agregar([new THREE.Vector3(0, a[0].y, 0)]);
    const ia = agregar(a);
    for (let i = 0; i < a.length; i++) idx.push(centro, ia + i, ia + ((i + 1) % a.length));
  };
  tira(anillos[0], anillos[1]);
  tira(anillos[1], anillos[2]);
  tira(anillos[2], anillos[3]);
  tapa(anillos[3]);
  tapa(anillos[0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function lapicera(m: Mats): THREE.Group {
  const g = new THREE.Group();
  const cuerpo = malla(new THREE.CylinderGeometry(4.6, 4.6, 108, 24), m.lapicera);
  g.add(cuerpo);
  const capuchon = malla(new THREE.CylinderGeometry(4.8, 4.8, 9, 24), m.metal);
  capuchon.position.y = 58;
  g.add(capuchon);
  const anillo = malla(new THREE.CylinderGeometry(4.75, 4.75, 2, 24), m.metal);
  anillo.position.y = 18;
  g.add(anillo);
  const punta = malla(new THREE.CylinderGeometry(1.2, 4.6, 14, 24), m.metal);
  punta.position.y = -61;
  g.add(punta);
  const clip = malla(new RoundedBoxGeometry(2.4, 34, 1.4, 1, 0.5), m.metal);
  clip.position.set(0, 42, 5.2);
  g.add(clip);
  return g;
}

function bandeja(m: Mats): THREE.Group {
  const g = new THREE.Group();
  // La bandeja cuelga debajo del labio: así el celular puede ir encima.
  const borde = -31;
  const alto = 30;
  const abre = 5;
  const prof = 75;
  const zAtras = BORDE_RANURA + CHAPA_ACC;
  g.add(piezaDeChapa(m, gancho([[0, borde - 12]]), 60));
  const caja = malla(geoBandeja(220, prof, alto, abre, CHAPA_ACC), m.aceroDoble);
  const zCentro = zAtras + prof / 2 + abre;
  caja.position.set(0, borde - alto, zCentro);
  g.add(caja);

  // Un cargador enrollado y una lapicera, como en la foto.
  const piso = borde - alto + CHAPA_ACC;
  const geoVuelta = new THREE.TorusGeometry(19, 2.2, 10, 56);
  for (let k = 0; k < 4; k++) {
    const vuelta = malla(geoVuelta, m.cableBlanco);
    vuelta.rotation.x = Math.PI / 2;
    vuelta.scale.set(1.45, 1, 1);
    vuelta.position.set(-38 + k * 2.2, piso + 2.2 + k * 3.6, zCentro + (k % 2 ? 1.5 : -1.5));
    g.add(vuelta);
  }
  const ficha = malla(new RoundedBoxGeometry(10, 7, 24, 2, 2), m.cableBlanco);
  ficha.position.set(-2, piso + 4, zCentro + 18);
  ficha.rotation.y = 0.5;
  g.add(ficha);

  const lap = lapicera(m);
  lap.rotation.z = Math.PI / 2 - 0.16;
  lap.rotation.y = -0.22;
  lap.position.set(28, piso + 15, zCentro - 4);
  g.add(lap);
  return g;
}

function auriculares(m: Mats): THREE.Group {
  const g = new THREE.Group();
  // Baja por el labio y sale una cuna en forma de C, con EVA arriba.
  const cuna = -30;
  const largo = 36;
  g.add(piezaDeChapa(m, gancho([[0, cuna], [largo, cuna], [largo, cuna + 9]]), 38, 2));
  const zCuna = BORDE_RANURA + CHAPA_ACC + largo / 2;
  const eva = malla(new RoundedBoxGeometry(38, 2.6, largo - 4, 1, 0.8), m.eva);
  eva.position.set(0, cuna + CHAPA_ACC / 2 + 1.3, zCuna);
  g.add(eva);

  // Los auriculares, colgados de la vincha. Origen arriba de la vincha.
  const aur = new THREE.Group();
  const radio = 50;
  const yArco = -55;
  const arco = new THREE.CatmullRomCurve3(
    Array.from({ length: 25 }, (_, i) => {
      const a = (Math.PI * i) / 24;
      return new THREE.Vector3(radio * Math.cos(a), yArco + radio * Math.sin(a), 0);
    }),
  );
  const vincha = new THREE.TubeGeometry(arco, 64, 5, 14);
  vincha.scale(1, 1, 1.9);
  aur.add(malla(vincha, m.blanco));
  const arcoInterior = new THREE.CatmullRomCurve3(
    Array.from({ length: 13 }, (_, i) => {
      const a = Math.PI * (0.3 + (0.4 * i) / 12);
      return new THREE.Vector3((radio - 5) * Math.cos(a), yArco + (radio - 5) * Math.sin(a), 0);
    }),
  );
  const acolchado = new THREE.TubeGeometry(arcoInterior, 32, 3.6, 10);
  acolchado.scale(1, 1, 2.2);
  aur.add(malla(acolchado, m.almohadilla));

  const perfil = [
    [0, -13],
    [17, -13],
    [23, -11.5],
    [26.5, -7],
    [27.5, 0],
    [26.5, 7],
    [23, 11.5],
    [17, 13],
    [0, 13],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geoCopa = new THREE.LatheGeometry(perfil, 40);
  geoCopa.rotateZ(Math.PI / 2);
  geoCopa.scale(1, 1.14, 1);
  const geoCojin = new THREE.TorusGeometry(18, 7, 14, 40);
  geoCojin.rotateY(Math.PI / 2);
  geoCojin.scale(1, 1.14, 1);
  const yCopa = yArco - 26;
  for (const lado of [-1, 1]) {
    const copa = malla(geoCopa, m.blanco);
    copa.position.set(lado * 50, yCopa, 0);
    aur.add(copa);
    const cojin = malla(geoCojin, m.almohadilla);
    cojin.position.set(lado * 32, yCopa, 0);
    aur.add(cojin);
    const horquilla = malla(new RoundedBoxGeometry(7, 16, 12, 1, 2.5), m.blanco);
    horquilla.position.set(lado * radio, yArco - 4, 0);
    aur.add(horquilla);
  }

  // Cuelgan sin tocar la mesa.
  const apoyo = cuna + CHAPA_ACC / 2 + 2.6;
  const altoTotal = -(yCopa - 27.5 * 1.14);
  const escala = Math.min(1, (ALTO + apoyo - 3) / altoTotal);
  aur.scale.setScalar(escala);
  aur.position.set(0, apoyo, zCuna);
  g.add(aur);
  return g;
}

/** La lista del día escrita a mano sobre el panel, en tiza. */
function texturaPanel(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 840;
  c.height = 560;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(243,241,236,0.92)";
  ctx.strokeStyle = "rgba(243,241,236,0.85)";
  ctx.font = `64px "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive`;
  ctx.textBaseline = "middle";
  ["Ideas", "tareas", "resultados"].forEach((palabra, i) => {
    const y = 110 + i * 112;
    ctx.beginPath();
    ctx.arc(92, y + 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(palabra, 130, y);
  });
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(130, 470);
  ctx.quadraticCurveTo(330, 458, 560, 452);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function panel(m: Mats): THREE.Group {
  const g = new THREE.Group();
  const inclinacion = THREE.MathUtils.degToRad(15);
  // La lengüeta entra en la ranura y sigue hacia arriba, inclinada, como
  // respaldo del panel.
  const hc = CHAPA_ACC / 2;
  const respaldo = 46;
  g.add(
    piezaDeChapa(
      m,
      [
        [0, -7],
        [0, 0],
        [-respaldo * Math.sin(inclinacion), respaldo * Math.cos(inclinacion)],
      ],
      60,
      3,
    ),
  );

  // El panel de 210 × 140 apoya en la tapa, delante del respaldo.
  const p = new THREE.Group();
  const tabla = new THREE.ExtrudeGeometry(rectRedondo(210, 140, 8), {
    depth: 2,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.6,
    bevelSegments: 2,
    curveSegments: 8,
  });
  tabla.translate(0, 70.6, 0.6);
  p.add(malla(tabla, m.pizarra));
  const escrito = new THREE.MeshBasicMaterial({
    map: texturaPanel(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  escrito.userData.propio = true;
  const texto = new THREE.Mesh(new THREE.PlaneGeometry(196, 130), escrito);
  texto.position.set(-6, 71, 3.3);
  p.add(texto);

  // La fibra, enganchada al costado derecho.
  const fibra = new THREE.Group();
  const cuerpo = malla(new THREE.CylinderGeometry(5, 5, 96, 20), m.plasticoNegro);
  fibra.add(cuerpo);
  const tapita = malla(new THREE.CylinderGeometry(5.4, 5.4, 26, 20), m.plasticoNegro);
  tapita.position.y = 58;
  fibra.add(tapita);
  const punta = malla(new THREE.CylinderGeometry(2, 4.6, 8, 20), m.plasticoNegro);
  punta.position.y = -52;
  fibra.add(punta);
  fibra.position.set(88, 72, 8.6);
  p.add(fibra);

  p.rotation.x = -inclinacion;
  p.position.set(0, 0, hc + 0.2);
  g.add(p);
  return g;
}

function guiaCables(m: Mats): THREE.Group {
  const g = new THREE.Group();
  // Baja por el pliegue de atrás; afuera lleva un canal de 18 × 30 por el que
  // pasa el cable vertical.
  g.add(piezaDeChapa(m, gancho([[0, -34]]), 30));
  const zCanal = BORDE_RANURA + CHAPA_ACC + 11;
  const canal = new THREE.Shape();
  canal.copy(rectRedondo(30, 22, 4));
  canal.holes.push(rectRedondo(26, 18, 2.4));
  const geoCanal = new THREE.ExtrudeGeometry(canal, {
    depth: 29,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.4,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geoCanal.rotateX(Math.PI / 2);
  const mCanal = malla(geoCanal, m.acero);
  mCanal.position.set(0, -0.5, zCanal);
  g.add(mCanal);

  // El cable baja de atrás del monitor, entra por arriba y sigue a la mesa.
  const camino = new THREE.CatmullRomCurve3(
    [
      [0, 240, -40],
      [0, 120, -8],
      [0, 34, 14],
      [0, 6, zCanal],
      [0, -30, zCanal],
      [0, -80, zCanal + 2],
      [0, -108, zCanal + 16],
      [0, -ALTO + 2.6, zCanal + 60],
      [14, -ALTO + 2.6, zCanal + 140],
      [46, -ALTO + 2.6, zCanal + 210],
    ].map(([px, py, pz]) => new THREE.Vector3(px, py, pz)),
    false,
    "catmullrom",
    0.3,
  );
  g.add(malla(new THREE.TubeGeometry(camino, 120, 2.6, 10), m.cableNegro));
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
    grupo.position.set(RANURA_X[ranura], ALTO, Z_RANURA);
  } else {
    // Mirando desde atrás, la ranura 1 es la de la izquierda.
    grupo.position.set(RANURA_X[RANURAS - 1 - ranura], ALTO, -Z_RANURA);
    grupo.rotation.y = Math.PI;
  }
}

// ── La escena ──────────────────────────────────────────────────

const DIRECCION: Record<ArmadoCara, THREE.Spherical> = {
  frente: new THREE.Spherical(1, THREE.MathUtils.degToRad(68), THREE.MathUtils.degToRad(16)),
  atras: new THREE.Spherical(1, THREE.MathUtils.degToRad(64), THREE.MathUtils.degToRad(205)),
};

/** Qué tan apaisado es el visor, de 0 (cuadrado o más alto que ancho, el
 *  de escritorio) a 1 (16/10 o más, el del celular y la tablet). */
function apaisado(aspect: number): number {
  return THREE.MathUtils.clamp((aspect - 1) / 0.6, 0, 1);
}

/** Adónde mira la cámara. En el visor apaisado va corrida a la izquierda,
 *  así los auriculares no quedan debajo de los botones de vista; en el alto
 *  sobra lugar abajo y va centrada, un poco más arriba para que entre el
 *  monitor. */
function objetivoPara(aspect: number, v: THREE.Vector3): THREE.Vector3 {
  const k = apaisado(aspect);
  return v.set(-45 * k, THREE.MathUtils.lerp(175, 128, k), 20);
}

/** Lo que tiene que entrar de ancho en cuadro: el soporte con los
 *  auriculares y la bandeja colgando. En el visor alto hace falta más margen,
 *  porque de cerca la perspectiva abre las patas y el teclado. */
function distanciaPara(camara: THREE.PerspectiveCamera): number {
  const ancho = THREE.MathUtils.lerp(720, 840, apaisado(camara.aspect));
  const vfov = THREE.MathUtils.degToRad(camara.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camara.aspect);
  return ancho / 2 / Math.tan(hfov / 2);
}

function liberar(obj: THREE.Object3D) {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const mat of mats) {
        if (!mat.userData.propio) continue;
        if ("map" in mat && mat.map instanceof THREE.Texture) mat.map.dispose();
        if ("emissiveMap" in mat && mat.emissiveMap instanceof THREE.Texture) {
          mat.emissiveMap.dispose();
        }
        mat.dispose();
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(28, 1, 10, 10000);

  // Un cuarto neutro de fondo para los reflejos: es lo que hace que la
  // pintura en polvo y el plástico se lean como materiales y no como color.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = entorno;
  scene.environmentIntensity = 0.62;

  // La ventana, arriba a la izquierda, como en las fotos.
  const sol = new THREE.DirectionalLight("#FFF6EA", 2.1);
  sol.position.set(-420, 900, 620);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -560;
  sol.shadow.camera.right = 560;
  sol.shadow.camera.top = 560;
  sol.shadow.camera.bottom = -560;
  sol.shadow.camera.far = 2600;
  sol.shadow.bias = -0.0003;
  sol.shadow.normalBias = 0.6;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight("#E9EEF2", 0.45);
  relleno.position.set(600, 300, -500);
  scene.add(relleno);

  // La mesa no se dibuja: solo recibe la sombra, y el fondo es el de la página.
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.ShadowMaterial({ opacity: 0.2 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);
  scene.add(sombraDeContacto());

  const m = materiales();
  scene.add(soporte(m));
  scene.add(monitor(m));
  scene.add(teclado(m));

  const objetivo = objetivoPara(1.6, new THREE.Vector3());
  const controles = new OrbitControls(camara, canvas);
  controles.target.copy(objetivo);
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
    const antes = objetivo.clone();
    objetivoPara(camara.aspect, objetivo);
    controles.target.copy(objetivo);
    const d = distanciaPara(camara);
    controles.minDistance = d * 0.5;
    controles.maxDistance = d * 1.5;
    const off = new THREE.Vector3().subVectors(camara.position, antes);
    const esf = new THREE.Spherical().setFromVector3(off);
    esf.radius = d;
    camara.position.setFromSpherical(esf).add(objetivo);
  };

  camara.position.setFromSpherical(DIRECCION.frente).add(objetivo);
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
      camara.position.setFromSpherical(s).add(objetivo);
      if (giro.t >= 1) giro = null;
    }

    for (const [grupo, t] of bajando) {
      const nuevo = Math.min(1, t + dt / 0.45);
      const k = 1 - Math.pow(1 - nuevo, 3);
      grupo.position.y = grupo.userData.base + (1 - k) * 70;
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
        new THREE.Vector3().subVectors(camara.position, objetivo),
      );
      if (sinMovimiento) {
        camara.position.setFromSpherical(hasta).add(objetivo);
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
      entorno.dispose();
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
