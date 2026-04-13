/**
 * auto-learn-evolve.js
 * =====================
 * Script otomatis untuk menjalankan /learn dan /evolve
 * pada Meridian DLMM bot secara terjadwal.
 *
 * CARA PAKAI:
 *   node auto-learn-evolve.js
 *
 * Jalankan ini di terminal TERPISAH dari bot utama.
 * Bot utama (npm start) tetap jalan seperti biasa.
 */

const fs   = require("fs");
const path = require("path");

// ─── KONFIGURASI ────────────────────────────────────────────────────────────
const CONFIG = {
  // Path ke state.json milik Meridian (sesuaikan kalau beda folder)
  stateFile:    path.join(__dirname, "state.json"),
  lessonsFile:  path.join(__dirname, "lessons.json"),

  // Jadwal (dalam menit)
  learnEveryMin:  120,   // /learn  → setiap 2 jam
  evolveEveryMin: 480,   // /evolve → setiap 8 jam

  // Minimal closed positions sebelum /evolve boleh jalan
  minClosedForEvolve: 5,

  // Log file
  logFile: path.join(__dirname, "auto-routine.log"),
};
// ────────────────────────────────────────────────────────────────────────────

function log(msg) {
  const ts   = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(CONFIG.logFile, line + "\n");
}

function readState() {
  try {
    if (!fs.existsSync(CONFIG.stateFile)) return null;
    return JSON.parse(fs.readFileSync(CONFIG.stateFile, "utf8"));
  } catch {
    return null;
  }
}

function countClosedPositions() {
  const state = readState();
  if (!state) return 0;
  // state.closed bisa berupa array atau object
  if (Array.isArray(state.closed))       return state.closed.length;
  if (typeof state.closed === "object")  return Object.keys(state.closed).length;
  return 0;
}

function countLessons() {
  try {
    if (!fs.existsSync(CONFIG.lessonsFile)) return 0;
    const data = JSON.parse(fs.readFileSync(CONFIG.lessonsFile, "utf8"));
    return Array.isArray(data) ? data.length : Object.keys(data).length;
  } catch {
    return 0;
  }
}

// ─── TRIGGER LEARN ──────────────────────────────────────────────────────────
async function triggerLearn() {
  log("▶ Memulai rutinitas /learn...");
  try {
    // Import modul Meridian langsung
    const { runLearn } = requireSafe("./lessons");
    if (runLearn) {
      await runLearn();
      log(`✅ /learn selesai. Total lessons: ${countLessons()}`);
    } else {
      log("⚠️  Fungsi runLearn tidak ditemukan di lessons.js — skip.");
    }
  } catch (err) {
    log(`❌ /learn gagal: ${err.message}`);
  }
}

// ─── TRIGGER EVOLVE ─────────────────────────────────────────────────────────
async function triggerEvolve() {
  const closed = countClosedPositions();
  log(`▶ Cek /evolve... (closed positions: ${closed}, minimum: ${CONFIG.minClosedForEvolve})`);

  if (closed < CONFIG.minClosedForEvolve) {
    log(`⏭  /evolve di-skip — butuh minimal ${CONFIG.minClosedForEvolve} closed positions, baru ada ${closed}.`);
    return;
  }

  try {
    const { runEvolve } = requireSafe("./lessons");
    if (runEvolve) {
      await runEvolve();
      log("✅ /evolve selesai. Threshold diperbarui.");
    } else {
      log("⚠️  Fungsi runEvolve tidak ditemukan di lessons.js — skip.");
    }
  } catch (err) {
    log(`❌ /evolve gagal: ${err.message}`);
  }
}

// ─── SAFE REQUIRE ───────────────────────────────────────────────────────────
function requireSafe(mod) {
  try { return require(mod); }
  catch { return {}; }
}

// ─── MAIN LOOP ───────────────────────────────────────────────────────────────
async function main() {
  log("🚀 auto-learn-evolve.js dimulai");
  log(`   /learn  setiap ${CONFIG.learnEveryMin} menit`);
  log(`   /evolve setiap ${CONFIG.evolveEveryMin} menit`);
  log("─".repeat(50));

  // Langsung jalankan sekali saat start
  await triggerLearn();
  await triggerEvolve();

  // Set interval /learn
  setInterval(async () => {
    await triggerLearn();
  }, CONFIG.learnEveryMin * 60 * 1000);

  // Set interval /evolve
  setInterval(async () => {
    await triggerEvolve();
  }, CONFIG.evolveEveryMin * 60 * 1000);

  // Tampilkan status setiap jam
  setInterval(() => {
    const closed  = countClosedPositions();
    const lessons = countLessons();
    log(`📊 Status → closed positions: ${closed} | lessons tersimpan: ${lessons}`);
  }, 60 * 60 * 1000);
}

main().catch(err => {
  log(`💥 Fatal error: ${err.message}`);
  process.exit(1);
});
