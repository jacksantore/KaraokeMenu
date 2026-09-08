# Karaokê Menu

Catálogo de músicas do karaokê (Karaokê Party Box) com busca por **nome da música**, **artista** ou **trecho da letra**, e uma área de **cadastro** para incluir, editar e excluir músicas.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 para o visual
- [Framer Motion](https://motion.dev) para as animações
- [Fuse.js](https://fusejs.io) para a busca fuzzy (tolera erros de digitação e acentuação)
- Persistência simples em arquivo JSON (`data/songs.json`) — sem necessidade de banco de dados externo

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

- `/` — busca de músicas
- `/gerenciar` — cadastro (incluir, editar, excluir músicas)

## Dados

O catálogo inicial (`data/songs.json`) foi importado do PDF **"Lista Músicas - Karaokê Party Box 1952 (Sistema 2)"**, com 1.951 músicas únicas (artista + título). O campo `lyrics` (trecho da letra) começa vazio e pode ser preenchido pela tela de cadastro para melhorar a busca por letra.

O script usado para gerar o catálogo inicial a partir da lista bruta está em `scripts/parse-songs.mjs` (lê `scripts/raw-list.txt`).

> `data/songs.json` funciona como um banco de dados simples em arquivo: toda alteração feita em `/gerenciar` (incluir, editar, excluir) é gravada diretamente nesse arquivo pelo servidor. Ele deve continuar versionado no Git para não perder o catálogo.

## Estrutura

```
src/
  app/
    page.tsx                 # tela de busca
    gerenciar/page.tsx       # tela de cadastro (CRUD)
    api/songs/route.ts       # GET (listar) / POST (criar)
    api/songs/[id]/route.ts  # PUT (editar) / DELETE (excluir)
  components/                # UI (cards, modal, navbar, etc.)
  hooks/useSongs.ts           # busca e mutações via API
  lib/
    db.ts                    # leitura/escrita do data/songs.json
    search.ts                # lógica de busca (fuzzy + multi-palavra)
    types.ts
data/songs.json               # catálogo de músicas (dados)
scripts/                      # importação inicial do PDF
```

## Deploy

Qualquer plataforma que rode Node.js (Vercel, Railway, um servidor próprio, etc.) funciona. Como os dados ficam em `data/songs.json` no disco, prefira um host com armazenamento persistente entre deploys (ou adapte `src/lib/db.ts` para outro tipo de storage, se for hospedar em uma plataforma serverless sem disco persistente).
