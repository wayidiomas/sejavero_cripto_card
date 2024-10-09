const express = require('express');
const { JWK, JWE } = require('node-jose');
require('dotenv').config(); // Carregar variáveis de ambiente do .env
const app = express();

app.use(express.json());

// Chave de API carregada do arquivo .env
const API_TOKEN = process.env.API_TOKEN;

// Chave pública em formato JWK fornecida pela Vero
const publicKeyJWK = {
  kty: 'RSA',
  kid: 'T001',
  use: 'enc',
  alg: 'RSA-OAEP',
  n: '6d3doDEyp88miUlmcu7hb_MJsAustKAVcaA_R5szO913AhTsNCLVwDt7IvAIFU5-LDtOjcRSdcHsiMOg49gwjl5AI2aeQFmnb_y-v2V6_Uj1ioYBJUjUM9jIlfrl2MRRA_sOl8QNWDXbVGmWggg_UgX5Ig-CgOWDUWiKOdvgJ8GcxxE6WWn9zGvd1jhAVV5H7lo_2YU2CAbdSGPuJMSiatA5fxt3-ImQ02sA4xB-A-5BQfQ9D_Fo_0m4SHSByzFtDB5ZgwCcZipucZqu4ZVv0o8BxsdOgIQpTI5shbRQO7okVfoabBc-8ySYWTBzZjg8pjCJGl05bfs1OrWMGwg3-w',
  e: 'AQAB',
};

// Função para criptografar os dados do cartão
async function encryptCardData(cardData) {
  // Importar a chave pública
  const key = await JWK.asKey(publicKeyJWK);
  
  // Opções de criptografia
  const options = {
    compact: true,
    contentAlg: 'A256GCM', // Algoritmo de criptografia de conteúdo
    protect: ['alg', 'kid', 'enc'],
    fields: {
      alg: key.alg,
      kid: key.kid,
      enc: 'A256GCM',
    },
  };
  
  // Cifrar os dados do cartão (PAN)
  const encryptedData = await JWE.createEncrypt(options, key)
    .update(JSON.stringify(cardData), 'utf8')
    .final();
  
  return encryptedData;
}

// Middleware para verificar o token de segurança
function verifyToken(req, res, next) {
  const token = req.headers['x-api-token'];
  
  if (token === API_TOKEN) {
    next(); // Token válido, prossegue com a requisição
  } else {
    res.status(403).json({ error: 'Acesso negado. Token inválido.' });
  }
}

// Rota para realizar a tokenização (proteção adicionada)
app.post('/tokenize', verifyToken, async (req, res) => {
  const { pan, mes, ano, cvv } = req.body;

  if (!pan || !mes || !ano || !cvv) {
    return res.status(400).send('Dados do cartão incompletos');
  }

  try {
    // Dados do cartão em formato JSON
    const cardData = { pan, mes, ano, cvv };

    // Criptografar os dados
    const encryptedData = await encryptCardData(cardData);

    // Retornar os dados criptografados (JWE)
    res.json({
      jwe: encryptedData,
      message: 'Tokenização realizada com sucesso',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao tokenizar os dados do cartão');
  }
});

// Iniciar o servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
