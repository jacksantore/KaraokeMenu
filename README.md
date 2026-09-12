# Karaokê Menu

Catálogo de músicas do karaokê (Karaokê Party Box) com busca por **nome da música**, **artista**, **código** (o número usado para selecionar a música no equipamento) ou **trecho da letra**, listagem completa ordenável e paginável, capa de álbum/foto do artista buscadas automaticamente, e uma área de **cadastro** para incluir, editar e excluir músicas.

Em produção: https://karaoke-menu.vercel.app

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 para o visual
- [Framer Motion](https://motion.dev) para as animações
- [Fuse.js](https://fusejs.io) para a busca fuzzy (tolera erros de digitação e acentuação)
- Postgres (Supabase) via [`postgres`](https://github.com/porsager/postgres) para persistência
- [API pública do Deezer](https://developers.deezer.com/api) para buscar capa do álbum, foto do artista e uma prévia de 30s da música (sem necessidade de chave de API)

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

## Imagens e prévia de áudio

Cada card de música busca, sob demanda (só quando o card entra na tela), a capa do álbum e a foto do artista na API pública do Deezer (`src/lib/artwork.ts`), e guarda o resultado em cache na tabela `song_artwork` — assim cada música só é consultada na Deezer uma vez. Quando não há correspondência, o card mantém o visual em gradiente com o código da música (sempre em destaque, em fonte grande) e não mostra botão de tocar.

Quando a música tem prévia disponível, o card mostra um botão de play (`src/hooks/usePreviewPlayer.ts`) — tocar uma música pausa automaticamente qualquer outra que esteja tocando. **O link de áudio em si nunca é cacheado**: só guardamos se a música *tem* prévia (`has_preview`, permanente); o link assinado da Deezer expira em minutos, então ele é buscado sempre na hora do clique (`GET /api/songs/[id]/preview`, sem cache — foi esse cache que quebrava a prévia depois de um tempo).

No cadastro (`/gerenciar`), o formulário tem um botão **"Buscar imagem"** para pré-visualizar a capa/foto antes de salvar (usa `GET /api/artwork/search`, sem gravar no cache ainda), e também busca automaticamente em segundo plano assim que a música é criada ou editada, para que a imagem já esteja em cache na primeira vez que o card aparecer em qualquer listagem. Editar o artista ou o título de uma música limpa o cache dela, para não ficar com uma imagem de uma combinação antiga.

A tabela `song_artwork` é criada por:

```bash
node --env-file=.env.local scripts/add-artwork-table.mjs
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
    api/songs/route.ts               # GET (listar) / POST (criar)
    api/songs/[id]/route.ts          # PUT (editar) / DELETE (excluir)
    api/songs/[id]/artwork/route.ts  # GET (capa/foto, com cache)
  components/                # UI (cards, modal, navbar, controles de lista, etc.)
  hooks/
    useSongs.ts              # busca e mutações via API
    useArtwork.ts            # busca preguiçosa (IntersectionObserver) de capa/foto
  lib/
    sql.ts                   # conexão com o Postgres
    db.ts                    # queries (getAllSongs/createSong/updateSong/deleteSong)
    artwork.ts                # busca na API do Deezer + cache em song_artwork
    search.ts                 # lógica de busca (fuzzy + multi-palavra)
    validateSongInput.ts      # validação compartilhada do payload das rotas
    types.ts
data/songs.json               # semente inicial do catálogo (não lido em runtime)
scripts/                      # importação do PDF -> JSON -> Postgres
```

## Deploy

O deploy roda na Vercel (projeto `santore1/karaoke-menu`). Como a persistência é via Postgres (não arquivo em disco), funciona normalmente em ambiente serverless — cada função só precisa da variável `POSTGRES_URL`.

```bash
vercel --prod
```
