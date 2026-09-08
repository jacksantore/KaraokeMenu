# Karaokê Menu

Catálogo de músicas do karaokê (Karaokê Party Box) com busca por **nome da música**, **artista** ou **trecho da letra**, e uma área de **cadastro** para incluir, editar e excluir músicas.

Em produção: https://karaoke-menu.vercel.app

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 para o visual
- [Framer Motion](https://motion.dev) para as animações
- [Fuse.js](https://fusejs.io) para a busca fuzzy (tolera erros de digitação e acentuação)
- Postgres (Supabase) via [`postgres`](https://github.com/porsager/postgres) para persistência

## Rodando localmente

1. Copie `.env.example` para `.env.local` e preencha `POSTGRES_URL` (veja abaixo).
2. Instale e rode:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

- `/` — busca de músicas
- `/gerenciar` — cadastro (incluir, editar, excluir músicas)

## Dados

O catálogo inicial foi importado do PDF **"Lista Músicas - Karaokê Party Box 1952 (Sistema 2)"**, com 1.951 músicas únicas (artista + título). O campo `lyrics` (trecho da letra) começa vazio e pode ser preenchido pela tela de cadastro para melhorar a busca por letra.

As músicas ficam em uma tabela `songs` no Postgres (ver `scripts/migrate-to-postgres.mjs`). O fluxo de importação:

1. `scripts/parse-songs.mjs` lê `scripts/raw-list.txt` (lista bruta extraída do PDF) e gera `data/songs.json` (usado só como semente/backup, não é lido em tempo de execução).
2. `scripts/migrate-to-postgres.mjs` cria a tabela `songs` (se não existir) e importa `data/songs.json` para o banco, uma única vez.

```bash
node --env-file=.env.local scripts/migrate-to-postgres.mjs
```

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `POSTGRES_URL` | Connection string pooled (porta 6543), usada em runtime pela aplicação (`src/lib/sql.ts`) |
| `POSTGRES_URL_NON_POOLING` | Connection string direta (porta 5432), usada só pelo script de migração |

No projeto da Vercel essas variáveis já estão configuradas (Production/Preview/Development).

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
    sql.ts                   # conexão com o Postgres
    db.ts                    # queries (getAllSongs/createSong/updateSong/deleteSong)
    search.ts                # lógica de busca (fuzzy + multi-palavra)
    types.ts
data/songs.json               # semente inicial do catálogo (não lido em runtime)
scripts/                      # importação do PDF -> JSON -> Postgres
```

## Deploy

O deploy roda na Vercel (projeto `santore1/karaoke-menu`). Como a persistência é via Postgres (não arquivo em disco), funciona normalmente em ambiente serverless — cada função só precisa da variável `POSTGRES_URL`.

```bash
vercel --prod
```
