# Toy Pad virtual para LEGO Dimensions no PS4 (GoldHEN)

Painel web para escolher as figuras e veículos do LEGO Dimensions pelo **celular ou PC**, sem o Toy Pad físico.
O jogo roda normalmente no PS4, e um plugin do GoldHEN faz o jogo achar que o portal está conectado.

> **Painel criado por RafaZin77.** Versão 1.5.0. Os créditos completos estão no fim deste arquivo, em `THIRD_PARTY.md`
> e na própria tela do painel (aba Configuração, e rodapé de todas as telas).

## Como funciona

```
 Celular/PC  ──(Wi-Fi)──►  Este painel (Node.js)  ──(FTP, porta 2121)──►  PS4 + GoldHEN
 navegador                  gera e envia os dumps                          plugin toypad_emu.prx
                            das figuras                                    (dentro do jogo, em segundo plano)
```

- O **plugin** (`toypad_emu.prx`, de RadiantDelux) roda dentro do jogo. Ele vigia a pasta `/data/toypad_emu` do PS4.
- Cada um dos 7 espaços do pad é um arquivo: `figure1.bin` (centro), `figure2-4.bin` (esquerda), `figure5-7.bin` (direita).
  Gravar o arquivo = colocar a figura no pad. Apagar = tirar a figura.
- O **painel** (este projeto) gera os dumps de 180 bytes de cada figura, envia/apaga por FTP e mostra as luzes
  do pad lendo o `leds.txt` que o plugin escreve.

Os dumps das figuras são criados a partir da lista pública de IDs. As fotos dos personagens vêm do pacote
`LSWTCS_DefaultRing` que você forneceu (veja `THIRD_PARTY.md`).

## O que você precisa

| Item | Detalhe |
|---|---|
| PS4 com **GoldHEN** | com o carregador de plugins ligado (menu do GoldHEN › configurações de plugins) |
| **FTP do GoldHEN** | fica na porta **2121** e normalmente fica ativo enquanto o GoldHEN está carregado |
| **LEGO Dimensions** | segundo o README do plugin: versão **US (CUSA00935)** atualizada para a **v1.23** |
| **Node.js 18+** | em um PC (Windows/Mac/Linux), Raspberry Pi ou até no celular via Termux |
| Mesma rede | PS4, o computador do painel e o celular no mesmo Wi-Fi/roteador |

> Outras regiões: o plugin foi feito para o título US. Dá para tentar outro Title ID na aba Configuração,
> mas isso **não foi testado** e pode não funcionar.

## Passo a passo

### 1. Iniciar o painel
1. Instale o Node.js em https://nodejs.org (versão LTS).
2. Descompacte esta pasta e execute:
   - **Windows:** duplo clique em `start.bat`
   - **Linux/Mac:** `./start.sh`
   - ou, no terminal da pasta: `npm install` e depois `npm start`
3. O terminal mostra endereços como `http://192.168.0.10:3000`. Abra esse endereço no navegador do celular.
   Se não abrir, libere a porta 3000 no firewall do computador.

### 2. Descobrir o IP do PS4
No PS4: **Configurações › Rede › Ver status da conexão**. Anote o endereço IPv4 (ex.: `192.168.0.50`).
Dica: reserve esse IP no roteador para ele não mudar.

### 3. Configurar o painel
Na aba **Configuração**:
1. Informe o **IP do PS4**. Porta `2121`. Deixe usuário e senha em branco.
2. Confira o **Title ID** do seu jogo (no PS4, destaque o jogo e aperte *Options*; o Title ID costuma aparecer em *Informações*). O padrão é `CUSA00935`.
3. Toque em **Salvar** e depois em **Testar conexão**. Deve aparecer "Conexão com o PS4 funcionando".

### 4. Instalar o plugin
1. Toque em **Instalar plugin no PS4**. O painel baixa o plugin do GitHub (ou usa `plugin/toypad_emu.prx`, se você
   colocar o arquivo lá), confere o hash SHA-256, envia para `/data/GoldHEN/plugins/`, registra no `plugins.ini`
   na seção do jogo e cria a pasta `/data/toypad_emu`.
2. **Reinicie o GoldHEN** (ou o PS4, recarregando o GoldHEN) para o plugin ser carregado.
3. Abra o LEGO Dimensions.

Seus outros plugins no `plugins.ini` são preservados, e instalar de novo não duplica nada.

### 5. Jogar
Com o jogo aberto, use a aba **Pad**:

| Ação | No PC (mouse) | No celular (toque) |
|---|---|---|
| Colocar uma figura | arraste a linha da figura até um espaço do pad | segure e arraste a **alça de pontos** à direita da figura até um espaço |
| Colocar no primeiro espaço livre | clique na figura | toque na figura |
| Mover uma figura | arraste-a para outro espaço vazio | arraste-a com o dedo para outro espaço vazio |
| Trocar duas figuras | arraste uma sobre a outra | arraste uma sobre a outra |
| Remover | arraste para a faixa vermelha que aparece ("Solte aqui para remover"), ou toque nela e use **Remover** | o mesmo |

O espaço de destino fica destacado em amarelo durante o arraste. Para cancelar, solte fora do pad (ou aperte Esc no PC).
Se você levar o dedo ou o mouse até a borda de cima ou de baixo da tela, a página rola sozinha, mas só na direção em que
você está indo (arrastar para cima a partir da borda de baixo não faz a página descer).
No celular, a lista rola normalmente quando você arrasta pelo texto; só a alça inicia o arraste.
As zonas do pad no painel acendem com as cores que o jogo manda (atualiza a cada 3 segundos).

### Veículos e gadgets
Eles começam **desmontados**, como as peças reais. Monte no jogo e depois **remova do pad** pelo painel
(ou toque em *Salvar versão montada*). O painel baixa o dump atualizado do PS4 e guarda em `library/`, então
da próxima vez o veículo já entra montado e com as melhorias.

## Idiomas: português, inglês e espanhol

O seletor no **topo do painel** troca o idioma na hora, sem recarregar e sem perder o que está no pad nem os filtros.
Vale para tudo: abas, botões, avisos, mensagens de erro do servidor, créditos, os nomes das habilidades e os textos de
ajuda. Pontos importantes:

- **O idioma é por aparelho.** O celular pode estar em espanhol e o PC em português: a escolha fica guardada no próprio
  navegador, ao contrário do tema e das favoritas, que são do servidor.
- **O padrão é português (BR).** O painel **não** adivinha o idioma pelo navegador, para não mudar de repente se o seu
  celular estiver em inglês. Quem abre pela primeira vez escolhe no seletor.
- **Link com idioma:** `http://IP-DO-PAINEL:3000/?lang=en` (ou `es`, `pt-BR`) abre já no idioma e o guarda naquele aparelho.
  Útil para mandar o link a um amigo.
- **O que não muda:** os nomes das figuras e dos mundos (vêm do catálogo, em inglês), este `LEIA-ME.md` (só em
  português) e as mensagens dos comandos de terminal (`tools/`) e do console do servidor.
- **A busca entende os três idiomas ao mesmo tempo:** com o painel em espanhol dá para buscar "voar", "flying" ou
  "volar" e achar as mesmas figuras.

**Sobre a qualidade das traduções:** os textos em inglês e em espanhol foram escritos para este projeto e **não foram
revisados por falantes nativos**. As habilidades em português e em espanhol são traduções aproximadas dos nomes em
inglês do catálogo, não os nomes oficiais do jogo nesses idiomas. Se algo soar estranho, corrija em
`public/i18n.js` (textos da tela), `catalog/abilities-pt.json` e `catalog/abilities-es.json` (habilidades),
`lib/messages.js` (erros do servidor) e `credits.json`, e reinicie o painel. O comando `node test/i18n-check.js`
confere se você deixou alguma chave faltando em algum idioma. Para **adicionar outro idioma**, copie um bloco de
`public/i18n.js`, `lib/messages.js`, `credits.json` e das habilidades, traduza, e inclua o código nos pontos que listam
`pt`, `en` e `es`.

## Favoritos, recentes e busca por habilidade

**Favoritos.** Toque na estrela ao lado de uma figura para guardá-la. O botão **★ Favoritas** mostra só elas, com a
mais nova no topo. Dá para favoritar também pela figura que está no pad: toque no espaço dela e use "Favoritar".

**Recentes.** O painel lembra as **últimas 20 figuras** que você colocou no pad (a mais recente primeiro; recolocar
uma figura a leva de volta ao topo). Cada visão tem o seu botão de limpar, e limpar os recentes não mexe nas favoritas.

Favoritas e recentes ficam salvas **no servidor** (`data/prefs.json`): o celular e o PC mostram a mesma lista.

**Habilidades.** O catálogo traz as habilidades de cada figura (voar, cavar, superforça, etc.), e o painel as mostra
em português embaixo do nome. Você pode:

- escolher uma no seletor **Habilidades** (cada opção mostra quantas figuras a têm) e combinar com mundo, tipo e busca;
- digitar na busca, em português ou em inglês, com ou sem acento ("voar", "superforca", "grapple"): a busca olha o
  nome, o mundo e as habilidades.

**Ocultar Unknown.** O catálogo ainda tem **28 figuras chamadas "Unknown"** (2 personagens e 26 veículos/gadgets que
ainda não foram identificados). O botão **Ocultar Unknown (28)**, na linha que mostra quantas figuras estão na lista,
esconde todas elas; toque de novo (**Mostrar Unknown**) para trazê-las de volta. Ao ocultar:

- a lista, as favoritas e os recentes deixam de mostrar essas figuras, e os contadores acompanham;
- o mundo "Unknown" sai do seletor de mundos (se ele estava escolhido, o filtro é limpo);
- a linha de contagem avisa quantas foram ocultadas.

A escolha fica salva no servidor (`data/prefs.json`), então vale para o PC e para o celular. Ela começa **desligada**.
O botão não mexe nas 8 entradas marcadas como "(unreleased)" no catálogo (por exemplo "World 15 (unreleased)"), que
são outra coisa; elas continuam aparecendo. A busca por "unknown" acha as figuras com esse nome (e só elas).

Os nomes de habilidades em português são uma **tradução aproximada** dos nomes do catálogo (que são em inglês), não os nomes oficiais
do jogo em português. Se algum soar estranho, edite `catalog/abilities-pt.json` e reinicie o painel. As figuras
marcadas como "Unknown" no catálogo não têm habilidade listada e não entram no filtro.

## Instalar como app

Na aba **Configuração**, o cartão **Instalar como app** mostra o que o seu navegador permite. Instalado, o painel abre
direto de um ícone na tela inicial, sem a barra do navegador, e a cor da barra de status acompanha o seu tema.

| Onde | Como instalar |
|---|---|
| **Celular rodando o painel no Termux** (`http://localhost:3000`) | O Chrome oferece a instalação completa: aparece o botão "Instalar como app" no cartão, ou use o menu ⋮ › Instalar app |
| **Android, abrindo o painel de outro aparelho pela rede** (`http://192.168...`) | Menu ⋮ do Chrome › Adicionar à tela inicial. Vira só um **atalho** (veja a nota abaixo) |
| **iPhone ou iPad** | No Safari: Compartilhar › Adicionar à Tela de Início |
| **Computador** | Chrome ou Edge: ícone de instalar na barra de endereço, ou menu › Instalar |

**Nota importante sobre endereços da rede local.** Os navegadores só liberam a instalação completa e o modo "tela
guardada" em endereços **seguros**: `https://` ou `localhost`. Um endereço como `http://192.168.0.10:3000` não é
considerado seguro, então nele o painel funciona normalmente no navegador, mas "instalar" cria apenas um atalho para
a página. O cartão avisa isso quando acontece. A instalação completa funciona de verdade no modo Termux
(`localhost`). Existe um ajuste avançado do Chrome (`chrome://flags`, "Insecure origins treated as secure") que
trata um endereço da rede como seguro; ele muda o comportamento de segurança do navegador, então use por sua conta
e risco e só para o endereço do seu painel. Isto não foi testado em aparelhos reais.

**O que o modo app guarda.** Apenas a tela do painel, os ícones e as imagens, para abrir mais rápido. **Nada da
comunicação com o PS4 é guardado:** o painel continua precisando do servidor ligado para trocar figuras. Com o
servidor desligado, o app abre e mostra "Não consegui falar com o servidor do painel" com o botão **Tentar de novo**
(no Termux, o servidor desligado costuma ser o Android ter encerrado o Termux: abra-o e rode `npm start`).

## Fotos, cores, fundo e fonte

Tudo isto fica na aba **Aparência** e é salvo **no servidor**: o celular e o PC mostram sempre o mesmo visual.
As mudanças aparecem na hora, e o painel avisa se alguma combinação de cores deixar o texto difícil de ler.

| O que | Como |
|---|---|
| **Tema pronto** | Automático (segue o claro/escuro do aparelho), Placa-base, Noite, Tijolo vermelho, Neon, Amarelo e azul |
| **Cores** | Fundo, cartões, **texto dos cartões**, destaque e pad. Mexer em qualquer uma vira um tema personalizado |
| **Cor da fonte sobre o fundo** | Título, abas e dicas que ficam direto sobre o fundo têm cor própria. Por padrão é **automática**: o painel mede a área da imagem atrás do painel e escolhe texto claro ou escuro. Desmarque "Automático" para escolher a cor que quiser |
| **Fundo** | Pontos de peça (padrão), cor lisa, degradê (escolha a segunda cor), **Arte do jogo** (imagem que acompanha o pacote) ou **Minha imagem** |
| **Tema "Arte do jogo"** | Um toque aplica a arte do jogo como fundo junto com cores escuras combinando |
| **Imagem de fundo** | PNG, JPG, WebP ou GIF até 10 MB. Fotos grandes são reduzidas automaticamente antes do envio. A "cobertura" clareia ou escurece a imagem para o texto continuar legível |
| **Fonte** | 7 estilos prontos (padrão, sistema, arredondada, serifada, monoespaçada, grossa, manuscrita) ou **um arquivo seu** (.woff2, .woff, .ttf ou .otf) |
| **Tamanho do texto** | de 85% a 140% |
| **Restaurar** | "Restaurar aparência padrão" volta tudo e apaga a imagem e a fonte enviadas |

**Sobre as fontes prontas:** elas usam as fontes que o aparelho já tem, então "Arredondada" ou "Grossa" podem
parecer diferentes (ou iguais à padrão) no celular e no PC. Para ficar idêntico em todos, envie um arquivo de fonte.

### Fotos dos personagens e dos veículos

O painel lê a pasta `portraits/` e mostra a foto no espaço do pad, na lista e ao arrastar. O nome do arquivo
começa com o **ID** da figura, e o resto do nome é livre:

| Arquivo | Vale para |
|---|---|
| `1-Batman-Default.png` | personagem de ID 1 (Batman) |
| `12-qualquer-nome.jpg` | personagem de ID 12 |
| `v1012-DeLorean-Time-Machine.png` | veículo ou gadget de ID 1012 |

O pacote já traz **75 fotos de personagens** (anéis do `LSWTCS_DefaultRing`) e **240 imagens de veículos e gadgets**
(do `IMAGENS.rar`). Só ficaram sem foto o Supergirl Red Lantern e os IDs "Unknown" ou ainda não lançados do catálogo.
Em "Aparência" dá para desligar as fotos.

**Importar um pacote novo de imagens por nome.** Se as imagens tiverem o nome da figura (como `Batwing.png`) em vez
do ID, a ferramenta faz a correspondência sozinha, inclusive com grafias diferentes das do catálogo
(por exemplo "Cloud Cukko Car" ou "Flying Fire Bike"):

```
node tools/import-photos.js caminho/da/pasta --dry     (só simula e mostra o resultado)
node tools/import-photos.js caminho/da/pasta           (copia para portraits/ com o ID no nome)
```

Ela não apaga nem sobrescreve nada e mostra no fim o que não encontrou e o que ainda está sem foto.
No Termux, copie as imagens com `cp ~/storage/downloads/...` para uma pasta e aponte a ferramenta para ela.

## Rodar em segundo plano

O plugin já roda sozinho dentro do jogo. O painel só precisa estar ligado quando você quiser **trocar figuras**,
e as figuras que estão no pad continuam lá mesmo com o painel fechado. Para deixá-lo sempre disponível:

- **Windows/Linux/Mac:** `npm install -g pm2`, depois `pm2 start server.js --name toypad` e `pm2 save`
  (`pm2 startup` para iniciar com o sistema).
- **Raspberry Pi/Linux:** o mesmo comando do pm2, ou um serviço systemd apontando para `node server.js`.
- **Só com o celular (Android):** veja a próxima seção.

## Usar só com o celular (Android + Termux)

Nesse modo o próprio celular roda o painel e também é o navegador que o usa. Você não precisa de PC.
O projeto só usa pacotes em JavaScript puro (`express` e `basic-ftp`), sem módulos nativos, então a instalação
deve ser simples. Isto **não foi testado em um Android real**.

### 1. Instalar o Termux
Baixe pelo **F-Droid** (f-droid.org) ou pela página de releases do Termux no GitHub. A versão da Play Store
está desatualizada e costuma dar erro na instalação de pacotes.

### 2. Preparar o ambiente
Abra o Termux e rode, um comando por vez:

```
pkg update
pkg install nodejs unzip
termux-setup-storage
```

O último comando pede permissão para acessar os arquivos do celular. Aceite. Ele cria a pasta `~/storage`,
que dá acesso à pasta Downloads.

### 3. Levar o projeto para o Termux
Baixe o `ld-ps4-toypad.zip` no celular (ele cai em Downloads) e rode:

```
cp ~/storage/downloads/ld-ps4-toypad.zip ~
unzip ld-ps4-toypad.zip
cd ld-ps4-toypad
```

### 4. Instalar e iniciar

```
npm install
npm start
```

O `npm install` só precisa ser feito uma vez e exige internet. Quando aparecer "LEGO Dimensions Toy Pad – painel PS4",
o servidor está no ar.

### 5. Abrir o painel
Abra o Chrome (ou outro navegador) no mesmo celular e acesse `http://localhost:3000`. Depois siga o passo a
passo normal: IP do PS4, testar conexão, instalar o plugin.

### Nas próximas vezes
Abra o Termux e rode:

```
cd ld-ps4-toypad
npm start
```

### Pontos de atenção no celular

- **Celular e PS4 no mesmo Wi-Fi.** O painel fala com o PS4 por FTP pela rede local, então dados móveis não servem.
- **O Android pode encerrar o Termux** quando ele fica em segundo plano. Para evitar, desative a otimização de
  bateria para o Termux nas configurações do Android e use `termux-wake-lock` (ou o botão "Acquire wakelock" na
  notificação do Termux). Se o servidor cair, rode `npm start` de novo: nada se perde, porque as figuras do pad
  ficam como arquivos no PS4.
- **O painel só precisa estar ligado para trocar figuras.** O plugin continua rodando dentro do jogo com o
  Termux fechado.
- **Para usar de outro aparelho** na mesma casa, abra `http://IP-DO-CELULAR:3000` no navegador dele.
  O IP aparece no terminal quando o servidor inicia.
- Para parar o servidor, volte ao Termux e aperte `Ctrl + C` (no teclado do Termux, a tecla CTRL e depois `c`).

## Atualizar para uma versão nova

As suas configurações e a sua aparência (`data/`), os veículos montados (`library/`) e as fotos que você adicionou
com outros nomes **ficam preservados**, porque o zip novo não contém esses arquivos. Só seria substituída uma foto
que você tenha trocado mantendo o mesmo nome de uma das 75 que vêm no pacote. Não é preciso rodar `npm install` de novo, a menos que a versão nova avise.

### No PC (Windows)
1. Feche o painel (feche a janela do `start.bat`, ou `Ctrl + C`).
2. Extraia o zip novo **na mesma pasta onde está o painel**, e quando perguntar, escolha **Substituir os arquivos
   no destino**. Não apague a pasta antiga antes.
3. Abra o `start.bat` de novo.
4. No navegador, recarregue a página sem cache (`Ctrl + F5`).

### No PC (Linux/Mac)
1. Pare o painel com `Ctrl + C`.
2. Na pasta que contém `ld-ps4-toypad`, rode `unzip -o caminho/do/ld-ps4-toypad.zip`.
3. Rode `./start.sh` e recarregue a página com `Ctrl + Shift + R`.

### No celular (Termux)
1. No Termux, pare o painel com `Ctrl + C`.
2. Baixe o zip novo (vai para Downloads) e rode:
   ```
   cd ~
   unzip -o ~/storage/downloads/ld-ps4-toypad.zip
   cd ld-ps4-toypad
   npm start
   ```
   (se o nome do arquivo baixado tiver um número, como `ld-ps4-toypad (1).zip`, use o nome exato com aspas)
3. No navegador, recarregue a página. Se a tela antiga continuar, limpe o cache do site ou abra em aba anônima.

### Conferir a versão
O número da versão está em `package.json` (campo `version`). Esta é a **1.5.0** (painel em português, inglês e espanhol, além do botão para ocultar as figuras Unknown, favoritos e recentes, busca por habilidade e instalação como app).

## Problemas comuns

| Sintoma | O que verificar |
|---|---|
| "O PS4 recusou a conexão" | GoldHEN precisa estar carregado de novo a cada boot; confirme IP e porta 2121 |
| "Sem resposta do PS4" | IP errado ou aparelhos em redes diferentes (rede de convidados, 2,4/5 GHz isoladas) |
| Instalou, mas o jogo não vê o pad | Reinicie o GoldHEN depois de instalar; confirme que o plugin está ativado e que o Title ID bate com o seu jogo |
| Luzes não acendem no painel | O `leds.txt` só aparece depois que o jogo muda as luzes; é só um espelho visual e não afeta o jogo |
| O jogo não reconhece uma figura | Veja a seção abaixo |
| Atualizei e a tela não mudou (fotos, aba Aparência) | O navegador guardou a versão antiga: recarregue sem cache (`Ctrl + F5`; no celular, limpe os dados do site ou use aba anônima) |
| Mudei o idioma e ainda vejo algo em português | Os nomes das figuras e dos mundos vêm do catálogo em inglês e não são traduzidos. Se for outro texto, recarregue sem cache (`Ctrl + F5`) e me avise qual era |
| Um personagem aparece sem foto | O ID dele não está entre as 75 fotos, ou o nome do arquivo não começa com o ID. Veja "Fotos dos personagens" |
| A fonte ou o fundo enviado não aparece | Confira o formato (fonte: .woff2/.woff/.ttf/.otf; imagem: PNG/JPG/WebP/GIF) e o limite de 10 MB; o painel mostra o motivo na mensagem |
| Aviso de "versão diferente do plugin" | O arquivo no GitHub mudou desde a análise; confira o repositório antes de confirmar |

## O que foi e o que não foi verificado

**Verificado em testes automáticos** (`npm test`, usando um servidor FTP falso que imita a pasta `/data` do PS4):
instalação do plugin e do `plugins.ini` (idempotente, preservando outros plugins), colocar, mover e remover figuras,
sincronização de veículos montados, leitura do `leds.txt`, mensagens de erro de conexão. A cifra do ID de personagem
foi comparada com a implementação original do `node-ld` em 300 casos, com resultado idêntico.

**Verificado na interface** (navegador automatizado; arrastar: 16 verificações, aparência e fotos: 28, recursos da 1.3.0: 27, recursos da 1.4.0: 42, botão Unknown (1.4.1): 21, idiomas (1.5.0): 62, rolagem automática ao arrastar: 4, telas estreitas: 6; servidor: 48; traduções: 7): arrastar da lista para o pad, mover, trocar,
remover pela faixa vermelha, cancelar com Esc, soltar fora sem efeito, e clique simples ainda funcionando. Também
foram testados temas, cores, os quatro tipos de fundo, envio de imagem e de fonte, tamanho do texto, fotos ligadas e
desligadas, aviso de contraste, restaurar padrão, o mesmo tema chegando a um segundo aparelho, e ausência de rolagem
horizontal de 320 a 390 px de largura com o texto a 140%. No toque,
foram usados eventos de toque reais (arrastar pela alça, mover entre espaços, tocar, e rolar a lista sem iniciar
arraste). Isso foi feito num Chrome de teste simulando celular, **não em aparelhos Android ou iPhone de verdade**:
se o arraste se comportar de modo estranho no seu celular, avise o modelo e o navegador.

**Verificado nos recursos da 1.4.0:** favoritar, desfavoritar, reordenar e voltar atrás quando o servidor falha;
recentes (ordem, limite de 20, sem repetir); filtro, contagem e busca por habilidade (com e sem acento, português e
inglês); service worker registrado, ativo e com o cache correto (e sem guardar a API); manifesto e ícones com o tamanho
declarado; o botão de instalar acionando o convite do navegador (testado com um evento simulado); instruções por
plataforma (Android e iPhone); aviso no endereço da rede local; e o painel aberto com o **servidor desligado de
verdade** e religado depois.

**Não verificado nos recursos da 1.4.0:** a instalação real em um Android, iPhone ou computador (o convite do navegador
foi simulado, porque o navegador de teste não instala apps), o comportamento do modo app depois de instalado, e o
ajuste de `chrome://flags` descrito acima.

**Não verificado:** o funcionamento com um PS4 real. Dois pontos em aberto:

1. Os dumps gerados seguem o formato real das tags (UID + ID de personagem cifrado nas páginas 0x24-0x25).
   Encontrei no `.prx` as constantes dessa cifra, o que indica que o plugin lê esse formato, mas não li o código
   do plugin por inteiro. Se alguma figura não aparecer no jogo, a alternativa é usar dumps reais de tags
   (do seu próprio acervo) em `library/` com o nome `c<ID>.bin` (personagem) ou `v<ID>.bin` (veículo).
2. O plugin é código de terceiros executado dentro do jogo no console. Revisei só as strings e chamadas de sistema
   importadas (arquivos locais e USB; não vi funções de rede), o que não equivale a uma auditoria.

## Estrutura da pasta

```
server.js          servidor e API do painel
lib/tags.js        gera os dumps das figuras (cifra do ID)
lib/ps4.js         FTP, instalação do plugin, plugins.ini
public/index.html  interface para celular e PC
public/i18n.js     textos da interface em português, inglês e espanhol
lib/messages.js    mensagens de erro do servidor nos três idiomas
public/manifest.webmanifest  descrição do app instalável
public/icons/      ícones do app (comum, maskable, iPhone e favicon)
lib/sw.js          service worker (a versão é preenchida pelo servidor)
catalog/           IDs de personagens e veículos e tradução das habilidades (abilities-pt.json e abilities-es.json)
portraits/         fotos de personagens (75) e de veículos/gadgets (240); você pode adicionar mais
assets/            arte do jogo usada como fundo pronto
credits.json       textos de crédito mostrados no painel (edite aqui para mudar nome ou linhas)
library/           dumps gerados/salvos (veículos montados ficam aqui)
data/              configuração, estado, aparência e favoritos/recentes (config.json guarda a senha FTP em texto simples);
                   data/theme.json e data/theme/ guardam o tema e a imagem/fonte enviadas
plugin/            opcional: coloque aqui o toypad_emu.prx para instalar sem internet
tools/generate.js  gera todos os dumps (node tools/generate.js --pasta dimensions)
tools/import-photos.js  importa imagens nomeadas pelo nome da figura para portraits/
test/i18n-check.js confere se as traduções estão completas (node test/i18n-check.js)
test/selftest.js   teste de ponta a ponta do servidor (48 verificações; a interface foi testada à parte)
```

O painel não tem senha: use só em rede doméstica de confiança. Qualquer pessoa na rede pode mudar a aparência e
enviar imagens e fontes (o painel só aceita esses formatos e confere o conteúdo real do arquivo, não só o nome).

Créditos e licenças: veja `THIRD_PARTY.md`.

## Créditos

- **Painel e interface:** RafaZin77.
- **Imagens dos personagens e dos veículos:** fornecidas por RafaZin77 (pacotes `LSWTCS_DefaultRing` e `IMAGENS`).
- **Plugin `toypad_emu` (GoldHEN):** RadiantDelux, repositório Lego-Patcher. Não vem neste pacote: é baixado do GitHub na instalação.
- **Lista de IDs das figuras:** Berny23 e colaboradores, projeto LD-ToyPad-Emulator (licença MIT).
- **Cifra dos IDs de personagem:** node-ld (Adam Shumann, licença ISC).
- LEGO Dimensions, as fotos e a arte pertencem aos seus respectivos detentores. Detalhes e licenças em `THIRD_PARTY.md`.

Para mudar o texto que aparece no painel, edite `credits.json` e reinicie o servidor.

## Ideias para as próximas versões

Em ordem aproximada de utilidade para o dia a dia (a primeira coluna é só uma estimativa de esforço). Já feitas:
favoritos e recentes, busca por habilidade e instalação como app.

| Esforço | Ideia | O que muda para você |
|---|---|---|
| Médio | **Equipes salvas** | Guardar um conjunto de até 7 figuras (ex.: "Time Batman") e aplicar no pad com um toque |
| Médio | **Trocar a foto direto no painel** | Enviar uma imagem para qualquer figura sem mexer em pastas; ideal no celular |
| Médio | **Filtro por várias habilidades** | Pedir "voar **e** superforça" ao mesmo tempo, para achar a figura certa para um puzzle |
| Médio | **Status do plugin** | Mostrar se o plugin está instalado e na versão analisada, e avisar quando houver versão nova |
| Médio | **Achar o PS4 na rede** | Botão que procura o PS4 com a porta 2121 aberta, sem digitar o IP |
| Médio | **Exportar e importar** | Salvar em um arquivo o tema, as favoritas, as equipes e os veículos montados, para trocar de aparelho ou fazer backup |
| Médio | **PIN de acesso** | Um código simples para o painel, útil se a rede da casa tiver visitas |
| Baixo | **Revisão das traduções** | Um falante nativo de inglês e de espanhol revisa os textos e as habilidades, e ajusta no `public/i18n.js` |
| Baixo | **Detectar o idioma do navegador** | Opcional: abrir já em inglês ou espanhol conforme o aparelho, sem mudar o padrão de quem já usa em português |
| Médio | **HTTPS opcional** | Liberar a instalação completa do app também em endereços da rede local (exige confiar num certificado no aparelho) |
| Alto | **Montagem de veículos** | Escolher a forma montada e as melhorias de cada veículo antes de colocar no pad (o catálogo tem os dados de reconstrução) |
