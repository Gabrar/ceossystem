const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const csv = require("csv-parser");

// 1. Carrega a chave privada
const serviceAccount = require("./serviceAccountKey.json");

// 2. Inicializa o Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

async function executarMigracao() {
  const usuarios = [];

  console.log("📂 Lendo o arquivo usuarios_supabase.csv...");

  fs.createReadStream("usuarios_supabase.csv")
    .pipe(csv())
    .on("data", (row) => {
      if (row.uid && row.email) {
        // Tenta capturar tanto 'password_hash' quanto 'encrypted_password'
        let hash = row.encrypted_password || row.password_hash;
        
        // Limpa aspas ou espaços fantasmas vindos do CSV
        if (hash) {
            hash = hash.replace(/['"]/g, "").trim();
        }

        usuarios.push({
          ...row,
          email: row.email.trim(),
          password_hash_limpo: hash || null
        });
      }
    })
    .on("end", async () => {
      console.log(`\n✅ Total de usuários encontrados no CSV: ${usuarios.length}`);

      // 1. IMPORTAR CREDENCIAIS NO FIREBASE AUTHENTICATION (BCRYPT)
      console.log("\n🔑 Importando senhas e contas para o Firebase Auth...");

      const AUTH_BATCH_SIZE = 1000;
      for (let i = 0; i < usuarios.length; i += AUTH_BATCH_SIZE) {
        const chunk = usuarios.slice(i, i + AUTH_BATCH_SIZE);

        const userRecords = chunk
          .filter(u => u.password_hash_limpo) // Pega só quem realmente tem senha extraída corretamente
          .map((user) => ({
            uid: user.uid.trim(),
            email: user.email,
            // O Buffer vai encapsular o hash perfeito para o BCRYPT do Firebase
            passwordHash: Buffer.from(user.password_hash_limpo, 'utf8'),
          }));

        if (userRecords.length > 0) {
          try {
            const result = await auth.importUsers(userRecords, {
              hash: { algorithm: "BCRYPT" },
            });
            console.log(`  Lote Auth (${i + 1} a ${i + chunk.length}): ${result.successCount} importados com sucesso.`);
            if (result.failureCount > 0) {
              console.error(`  ⚠️ ${result.failureCount} falhas no lote Auth. Exemplo:`, result.errors[0].error.message);
            }
          } catch (err) {
            console.error("  ❌ Erro ao importar lote no Auth:", err);
          }
        } else {
            console.log(`  Lote Auth (${i + 1} a ${i + chunk.length}): Nenhuma senha encontrada para esses usuários.`);
        }
      }

      // 2. CRIAR OS DOCUMENTOS DE PERFIL NO FIRESTORE (COLLECTION 'users')
      console.log("\n📁 Criando documentos de perfil na coleção 'users'...");

      const FIRESTORE_BATCH_SIZE = 400;
      for (let i = 0; i < usuarios.length; i += FIRESTORE_BATCH_SIZE) {
        const chunk = usuarios.slice(i, i + FIRESTORE_BATCH_SIZE);
        const batch = db.batch();

        chunk.forEach((user) => {
          const userRef = db.collection("users").doc(user.uid.trim());
          batch.set(userRef, {
            uid: user.uid.trim(),
            nome: user.nome || "",
            email: user.email,
            document: user.cpf || "",
            phone: user.telefone || "",
            role: user.tipo_usuario || "client",
            instituicao: user.instituicao || "",
            curso: user.curso || "",
            cidade: user.cidade || "",
            state: user.estado || "",
            country: user.pais || "Brasil",
            createdAt: user.created_at ? new Date(user.created_at) : new Date(),
          }, { merge: true }); // Merge true evita apagar campos caso o documento já exista
        });

        await batch.commit();
        console.log(`  Lote Firestore (${i + 1} a ${i + chunk.length}) gravado no banco.`);
      }

      console.log("\n🚀 Migração 100% concluída! Tente logar com a conta antiga agora.");
      process.exit(0);
    });
}

executarMigracao();
