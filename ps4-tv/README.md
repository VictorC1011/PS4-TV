# PS4 TV

Interface estática para organizar canais em uma grade navegável pelo navegador do PS4.

## Arquivos
- `index.html`: página principal.
- `style.css`: visual responsivo para TV.
- `app.js`: filtros, categorias, favoritos, último canal e navegação por teclado.
- `channels.json`: lista de categorias e canais importada do arquivo fornecido.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub, por exemplo `ps4-tv`.
2. Envie os quatro arquivos para a raiz do repositório (`index.html`, `style.css`, `app.js`, `channels.json`).
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`; clique em **Save**.
6. Aguarde o endereço publicado aparecer nessa mesma seção. Abra-o no navegador do PS4.

## Testar localmente
Como a página carrega `channels.json` com `fetch`, abra-a por um servidor HTTP local, não diretamente como `file://`.
Se tiver Python instalado, abra o terminal na pasta e rode:

```bash
python -m http.server 8000
```

Depois visite `http://localhost:8000`.

## Reprodução
Ao selecionar um canal, a interface tenta carregar a URL fornecida em um `iframe`. Alguns sites impedem incorporação por política de segurança; nesse caso, use **Abrir link** para testar a página original. A compatibilidade de codecs, DRM, autenticação e recursos do navegador depende do fornecedor e do navegador do PS4.

## Observações
- Favoritos e último canal ficam salvos no `localStorage` do navegador.
- O site estático não faz proxy nem hospeda as transmissões.
- Se os endereços dos canais mudarem, atualize `channels.json` e envie a alteração ao repositório.
