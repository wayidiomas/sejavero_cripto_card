# Definir a imagem base do Node.js 20-alpine
FROM node:20-alpine

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos de package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o restante dos arquivos do projeto para o diretório de trabalho
COPY . .

# Expôr a porta 3000 (ou a porta definida na variável de ambiente PORT)
EXPOSE 3000

# Comando para rodar o servidor Node.js
CMD ["node", "index.js"]
