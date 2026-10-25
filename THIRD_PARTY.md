# Créditos e licenças

**Painel LEGO Dimensions Toy Pad para PS4 – criado por RafaZin77.**

## Terceiros

- **catalog/charactermap.json e catalog/tokenmap.json** – listas de IDs de personagens e veículos do projeto
  [LD-ToyPad-Emulator](https://github.com/Berny23/LD-ToyPad-Emulator) (Berny23 e colaboradores), licença MIT:
  *Copyright (c) 2023 Berny23*. Permissão para usar, copiar, modificar e distribuir, desde que o aviso de
  copyright e esta permissão acompanhem as cópias. O software é fornecido "como está", sem garantias.
- **lib/tags.js** – a derivação de chave e a cifra TEA do ID de personagem seguem o algoritmo do
  [node-ld](https://github.com/Berny23/node-ld) (Adam Shumann / ags131, licença ISC), reimplementado e
  conferido contra a implementação original.
- **plugin toypad_emu.prx** – obra de RadiantDelux ([Lego-Patcher](https://github.com/RadiantDelux/Lego-Patcher)).
  O repositório não declara licença, então ele **não** vem neste pacote: o painel o baixa direto do GitHub
  na hora de instalar. Este projeto não é afiliado a ele.
- LEGO e LEGO Dimensions são marcas da LEGO Group. Projeto sem fins lucrativos, para uso pessoal.
- **portraits/*.png** – 75 imagens de personagens (anéis 128×128) do pacote `LSWTCS_DefaultRing`, enviado pelo
  usuário deste projeto. A autoria e a licença do pacote não foram verificadas; as imagens representam personagens
  de marcas de terceiros e pertencem aos respectivos detentores. Estão incluídas apenas para uso pessoal, para
  identificar as figuras no painel. Para remover, apague a pasta `portraits/`: o painel volta a mostrar as iniciais.
- **portraits/v*.png** – 240 imagens de veículos e gadgets do pacote `IMAGENS`, fornecido por RafaZin77. Vale a mesma
  observação das fotos de personagens: a autoria original e a licença do pacote não foram verificadas, as imagens
  representam produtos de terceiros e pertencem aos respectivos detentores, e estão aqui só para uso pessoal.
- **assets/splash.jpg** – arte promocional do LEGO Dimensions enviada por RafaZin77, usada como fundo opcional do painel.
  Pertence aos detentores dos direitos do jogo (LEGO Group, Warner Bros. Interactive Entertainment e TT Games, segundo
  o que a imagem aparenta ser; a origem exata não foi verificada). Para remover, apague `assets/splash.jpg`; o fundo "Arte do jogo" deixa de aparecer.
- **catalog/abilities-pt.json** – tradução aproximada, para português, dos nomes de habilidades que vêm no catálogo de
  IDs (em inglês). Feita para este painel; não são os nomes oficiais do jogo em português e podem ser ajustadas.
- **public/icons/** – ícones do app desenhados para este painel (o pad com as três zonas acesas), sem uso de imagens de terceiros.
- **public/i18n.js, lib/messages.js, credits.json, catalog/abilities-es.json** – textos em português, inglês e espanhol
  escritos para este painel. Os textos em inglês e espanhol não foram revisados por falantes nativos, e os nomes de
  habilidades em português e espanhol são traduções aproximadas dos nomes em inglês do catálogo de IDs.
