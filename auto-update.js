const chokidar = require("chokidar");
const { exec } = require("child_process");
const simpleGit = require("simple-git");
const path = require("path");

const git = simpleGit(__dirname);

// ===============================
// 📊 EXCELS MONITORADOS
// ===============================
const arquivosExcel = [
  "C:/Users/USER/OneDrive/Documents/PRODUÇÃO/2026/Planejamento 2026.xlsx",
  "C:/Users/USER/OneDrive/Documents/PRODUÇÃO/PLANEJAMENTO 2025.xlsx"
];

// ===============================
// 🌾 SAFRAS QUE SERÃO EXPORTADAS
// ===============================
const safras = [
  "soja2526",
  "soja2425",
  "milho25"
];

// Evita rodar múltiplas vezes ao salvar Excel
let timeout = null;

console.log("👀 Monitorando alterações nos arquivos Excel...");

chokidar.watch(arquivosExcel, { ignoreInitial: true })
  .on("change", (filePath) => {

    console.log(`📊 Alteração detectada em: ${filePath}`);

    clearTimeout(timeout);

    timeout = setTimeout(async () => {

      console.log("🚀 Iniciando pipeline automática...\n");

      try {

        // ===============================
        // 1️⃣ EXPORTAR TODAS AS SAFRAS
        // ===============================
        for (const safra of safras) {
          console.log(`🌾 Exportando safra: ${safra}`);

          await new Promise((resolve, reject) => {
            exec(`node exportar-safra.js ${safra}`, { cwd: __dirname }, (err, stdout, stderr) => {

              if (err) {
                console.error(`❌ Erro ao exportar ${safra}:`, stderr);
                reject(err);
              } else {
                console.log(stdout);
                resolve();
              }

            });
          });
        }

        // ===============================
        // 2️⃣ GIT COMMIT AUTOMÁTICO
        // ===============================
        console.log("\n📦 Verificando mudanças no Git...");

        const status = await git.status();

        if (status.files.length === 0) {
          console.log("⚠️ Nenhuma alteração detectada.");
          return;
        }

        await git.add(".");

        const data = new Date().toLocaleString("pt-BR");

        await git.commit(`Atualização automática via Excel - ${data}`);

        console.log("📤 Enviando para GitHub...");

        await git.push("origin", "main");

        console.log("\n🔥 Deploy enviado! Vercel irá atualizar automaticamente.");

      } catch (err) {
        console.error("\n❌ ERRO NA AUTOMAÇÃO:", err.message);
      }

    }, 4000); // espera 4s após salvar Excel
});
