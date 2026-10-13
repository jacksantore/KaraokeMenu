# Karaokê Menu

Catálogo de músicas do karaokê (Karaokê Party Box) com busca por **nome da música**, **artista**, **código** (o número usado para selecionar a música no equipamento) ou **trecho da letra**, listagem completa ordenável (A→Z / Z→A, código crescente/decrescente) e paginável, capa de álbum/foto do artista e prévia de áudio (Deezer), detalhes da música/artista (clique no título — compositor, origem, bio) via Wikipédia/MusicBrainz, e uma área de **cadastro** para incluir, editar e excluir músicas.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript, Tailwind CSS v4, Framer Motion, Fuse.js (busca fuzzy)
- **SQLite** embutido no Node (`node:sqlite`, nenhuma dependência nativa) — um único arquivo, sem servidor de banco, sem plano gratuito que "pausa" por inatividade
- APIs públicas sem chave: Deezer (capa/foto/prévia), Wikipédia (pt) e MusicBrainz (detalhes)
- Docker + [Caddy](https://caddyserver.com) (HTTPS automático) para publicar

## Como os dados são guardados

Tudo fica em **um arquivo** (`karaoke.db`, modo WAL): músicas, e o cache de imagens e de detalhes (que se refaz sozinho se for apagado). O app abre o arquivo direto, sem rede — por isso uma leitura de catálogo leva ~30 ms e um item em cache ~4 ms.

| Tabela | Conteúdo |
| --- | --- |
| `songs` | catálogo (id, `code` único, artista, título, trecho de letra) |
| `song_artwork` | cache de capa/foto/"tem prévia" (Deezer) |
| `song_info` | cache de detalhes (Wikipédia/MusicBrainz) |

As tabelas são criadas automaticamente na primeira execução (`src/lib/sqlite.ts`). O caminho do arquivo vem de `DATABASE_PATH` (padrão local: `data/karaoke.db`).

Segurança/performance já embutidas: WAL (leitores nunca bloqueiam o gravador e uma queda não corrompe o arquivo), `busy_timeout`, `foreign_keys`, queries parametrizadas (sem SQL injection) e validação do payload nas rotas.

## Rodando localmente

```bash
npm install
node scripts/import-songs.mjs data/songs.json   # carga inicial (1.951 músicas do PDF original)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000): `/` busca, `/gerenciar` cadastro.

## Publicando em um servidor próprio (VPS / Oracle Cloud Free)

Requisitos: uma máquina Linux com Docker + Docker Compose e um **domínio** apontando para o IP dela (pode ser gratuito, ex. DuckDNS). Portas 80 e 443 liberadas.

```bash
git clone https://github.com/jacksantore/KaraokeMenu.git && cd KaraokeMenu
cp .env.example .env          # preencha DOMAIN, ADMIN_USER e ADMIN_PASSWORD_HASH (instruções dentro)
docker compose up -d --build
```

Carga inicial dos dados (uma vez):

```bash
# catálogo original do PDF
docker compose exec app node scripts/import-songs.mjs /app/seed/songs.json
# ou um export mais recente (ver "Migrando do Supabase"):
docker compose cp songs-export.json app:/tmp/songs.json
docker compose exec app node scripts/import-songs.mjs /tmp/songs.json
```

O Caddy emite e renova o certificado HTTPS sozinho. **Busca/listagem são públicas; `/gerenciar` e qualquer gravação (`POST/PUT/DELETE /api/songs*`) exigem usuário e senha** (HTTP Basic, definidos no `.env`).

### Backup

O serviço `backup` copia o banco todo dia (`VACUUM INTO`, seguro com o app rodando) para o volume `karaoke-backups`, mantendo as 30 últimas. Para guardar uma cópia **fora** do servidor (recomendado):

```bash
docker run --rm -v karaoke-menu_karaoke-backups:/b -v "$PWD":/out alpine tar czf /out/backups.tgz -C /b .
scp usuario@servidor:~/KaraokeMenu/backups.tgz .
```

Restaurar: pare o app, copie o `.db` desejado para o volume `karaoke-data` como `karaoke.db` (apague `karaoke.db-wal`/`-shm`) e suba de novo.

### Atualizar

```bash
git pull && docker compose up -d --build
```

O volume de dados não é tocado no rebuild.

## Migrando do Supabase (uma vez)

Com o projeto antigo ativo (ele pausa após ~7 dias sem uso — reative em supabase.com/dashboard se preciso), exporte o catálogo pela API publicada:

```bash
curl -s https://karaoke-menu.vercel.app/api/songs -o songs-export.json
node scripts/import-songs.mjs songs-export.json
```

Só as músicas precisam ser migradas; imagens e detalhes são recalculados sob demanda.

## Detalhes de funcionamento

- **Imagens e prévia de áudio**: cada card busca (só quando aparece na tela) capa/foto na Deezer e guarda em `song_artwork`. O link de áudio da Deezer é assinado e expira em minutos, então **nunca é guardado**: só "tem prévia" fica no banco, e o link é pedido na hora do play (`GET /api/songs/[id]/preview`).
- **Detalhes da música/artista** (`src/lib/songInfo.ts`): Wikipédia (artigo da canção, quando existe — costuma citar o compositor — e bio do artista) + MusicBrainz (origem). Só aceita um resultado cujo nome realmente aparece na consulta, para não mostrar dado de outro artista quando o "artista" do catálogo é genérico (ex.: "Anime Beyblade - Abertura"). Faixas obscuras ficam só com o que existir.
- **Trecho da letra**: o campo existe e já entra na busca. Preenchimento é manual, pelo formulário de edição (o botão "Buscar letra" só abre a busca do letras.mus.br em outra aba).
- Editar artista/título de uma música limpa o cache de imagem/detalhes dela.

## Estrutura

```
src/app/            páginas (/, /gerenciar) e rotas /api
src/components/     UI (cards, modais, controles de lista…)
src/hooks/          useSongs, useArtwork, usePreviewPlayer, useSongInfo
src/lib/            sqlite.ts (conexão/esquema), db.ts (CRUD), artwork.ts, songInfo.ts, search.ts
scripts/            import-songs.mjs, backup.mjs, parse-songs.mjs (PDF → JSON)
data/songs.json     semente do catálogo original
Dockerfile, docker-compose.yml, Caddyfile
```
