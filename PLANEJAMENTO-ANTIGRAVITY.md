# Planejamento Estrutural — Site Dra. Anna Paula Bomtempo

> Spec completa para construção de site institucional + blog para uma médica dermatologista premium em São Paulo.
> Use este documento como blueprint. O objetivo é gerar uma versão alternativa do site para comparação direta com a versão atual da DocAds.

---

## 1. Contexto do projeto

**Cliente:** Dra. Anna Paula Vaz de Oliveira Bomtempo
**Especialidade:** Médica dermatologista
**CRM:** 177.888 · **RQE:** 85.823
**Formação:** Universidade Federal de Uberlândia (UFU)
**Cidade:** São Paulo, com duas unidades:
1. Vila Olímpia, R. Fidêncio Ramos, 160, 8º andar, CEP 04551-010
2. Jardim Paulista, Av. Brasil, 126, CEP 01430-000

**WhatsApp/Tel:** +55 11 91604-9939
**Instagram:** @annabomtempo.dermato
**Domínio:** draannabomtempo.com.br
**Site atual:** https://draannabomtempo.com.br/ (será substituído)

**Posicionamento:** dermatologia premium, focada em rejuvenescimento facial, tratamentos personalizados e tecnologia de ponta. Atende mulheres entre 28 e 50 anos, profissionais bem sucedidas, que valorizam autocuidado, sofisticação e resultados naturais.

**Tom de voz:** sofisticado, próximo, científico sem ser frio. Pílulas-chave do briefing: "quiet beauty", naturalidade, acompanhamento próximo, exclusividade.

**Objetivo de negócio:** gerar leads qualificados (formulário + cliques no WhatsApp), construir autoridade médica, transmitir posicionamento premium. Meta declarada de 50 leads e 5 agendamentos por mês.

---

## 2. Conformidade ética (obrigatório)

O site precisa respeitar a Resolução CFM nº 1.974/2011 e o Código de Ética Médica. Isso significa que o agente NÃO pode incluir:

- Fotos de antes e depois de pacientes
- Depoimentos com promessa ou garantia de resultado
- Promoções, descontos ou ofertas tipo "10% off newsletter"
- Tabelas de preço por procedimento
- Garantia terapêutica ou linguagem de venda agressiva

Em vez disso, deve transmitir confiança via: credenciais médicas, filosofia clínica, descrição dos procedimentos, formação e instituições reconhecidas.

Adicionar disclaimer textual em rodapé ou bloco dedicado:
> "Em conformidade com a Resolução CFM nº 1.974/2011 e Código de Ética Médica, este site não publica imagens de antes e depois, depoimentos com promessa de resultado, nem garantias terapêuticas."

---

## 3. Identidade visual

### Paleta de cores (manual de marca)
```
Cream      #E7DED0   (fundo principal claro)
Latte      #D0BCA0   (apoio)
Biscotti   #DAC09B   (apoio)
Toffee     #9F825B   (accent, eyebrows e regras)
Cocoa      #82614A   (primária, texto destaque, CTA)
Ink        #2B1F17   (texto corpo)
Bone       #F5EFE6   (fundo secundário)
Porcelain  #FBF7F1   (fundo base)
```

### Tipografia
- **Display:** Hatton (Pangram Pangram, paga). Fallback aberto: **Fraunces** (Google Fonts) com `opsz: 144` e `SOFT: 50`. Peso 500 a 600.
- **Body:** Inter (Google Fonts), pesos 300, 400, 500, 600.
- **Serif decorativa para itálicos:** Cormorant Garamond.

### Logos
Existem cinco variações no manual de marca da Dra. Em `/public/logo/`:
- Monograma "AB" (cocoa e cream)
- Lockup "ANNABOMTEMPO" só (cocoa e cream)
- Lockup completo "ANNABOMTEMPO + DERMATOLOGISTA" (cocoa e cream)

Header e Footer devem usar o **lockup completo**, NÃO o monograma. Tamanhos: h-5 a h-6 no header, h-14 no footer.

### Tom visual de referência
- Aesop, Augustinus Bader, Goop, The Row
- Editorial premium, quiet luxury
- Bastante whitespace
- Grid de 12 colunas
- Cards com **borda fina** + hover sutil (NÃO usar liquid glass intenso)
- Animações fade-up discretas (framer-motion com `[0.22, 1, 0.36, 1]`)
- Imagens grandes, foto-jornalismo editorial

---

## 4. Stack tecnológica sugerida

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Estilização:** Tailwind CSS 3.4
- **Animação:** framer-motion 11
- **Ícones:** lucide-react
- **Otimização de imagens:** Sharp (gerar WebP em 480, 960, 1440, 2000)
- **Deploy:** Vercel
- **Form:** server action com webhook para Supabase ou similar, abertura imediata do WhatsApp após envio
- **Tracking obrigatório:** Meta Pixel + Conversions API (server-side, com `eventID` para dedupe, `user_data` hasheado SHA-256, `action_source: "website"`), GA4, Google Ads (com Enhanced Conversions), persistência de `gclid` e `fbclid` por 90 dias em localStorage

---

## 5. Sitemap

Páginas a criar:

| Rota | Tipo | Função |
|------|------|--------|
| `/` | Estática | Home institucional + conversão |
| `/sobre` | Estática | A Dra. Anna, trajetória, filosofia |
| `/tratamentos` | Estática | Hub com 3 grupos e grid completo |
| `/tratamentos/[slug]` | SSG | Página individual de cada tratamento |
| `/blog` | Estática (lista) | Diário com 11 posts |
| `/blog/[slug]` | SSG (futuro) | Post individual |
| `/contato` | Estática | Form + endereços + mapa |
| `/api/lead` | Server route | Recebe lead, envia para Meta CAPI + webhook |

**Não criar:** página de Resultados (proibido pelo CFM), tabela de preços, página de promoções.

---

## 6. Lista completa de tratamentos

Cada tratamento tem `slug`, `nome`, `subtitulo`, `categoria` (tipo de procedimento), `grupo` (área de atuação na home), `resumo`, `promessa`, `duracao`, `sessoes`, `retorno`, `indicacoes[]`, `comoFunciona[]`, `diferenciais[]`, `faq[]`, `destaque` (boolean).

### Grupos (áreas de atuação)
1. **Pele** — Saúde e qualidade dérmica
2. **Rejuvenescimento** — Naturalidade e contorno
3. **Tecnologia** — Plataformas premium

### Tratamentos (com breve descrição)

#### 1. Ultraformer MPT
- **Slug:** `ultraformer-mpt`
- **Subtítulo:** Lifting sem cirurgia com ultrassom microfocado
- **Grupo:** Rejuvenescimento · **Categoria:** Tecnologia
- **Descrição:** Estimula colágeno profundo nas camadas SMAS e derme reticular para redensificar, contornar e levantar a face sem afastamento social. Tecnologia MPT (Micro Pulsed Technology) com menor desconforto que ultrassons convencionais.
- **Promessa:** contorno mais definido, pele firme e olhar descansado
- **Duração:** 60 a 90 minutos · **Sessões:** 1 a 2 sessões anuais · **Retorno:** imediato
- **Indicado para:** flacidez de terço inferior e papada, queda de sobrancelha, perda de definição mandibular, pescoço com flacidez leve a moderada, prevenção a partir dos 30
- **Destaque na home:** sim

#### 2. Volnewmer
- **Slug:** `volnewmer`
- **Subtítulo:** Radiofrequência monopolar de última geração
- **Grupo:** Tecnologia · **Categoria:** Tecnologia
- **Descrição:** Aquecimento controlado e profundo da derme para retração de pele e estímulo de colágeno em face, pescoço, colo e corpo. Conforto superior em comparação a radiofrequências antigas.
- **Promessa:** pele mais firme, lisa e luminosa em poucas sessões
- **Duração:** 45 a 75 minutos · **Sessões:** 1 a 3 sessões · **Retorno:** imediato
- **Indicado para:** flacidez facial e pescoço, linhas finas, pré e pós cirúrgicos, manutenção de bioestimuladores
- **Destaque na home:** sim

#### 3. Laser CO₂ Fracionado
- **Slug:** `laser-co2-fracionado`
- **Subtítulo:** Renovação profunda da pele
- **Grupo:** Tecnologia · **Categoria:** Laser
- **Descrição:** Ablação fracionada que remove camadas envelhecidas e estimula a regeneração para uma pele mais lisa, uniforme e densa.
- **Promessa:** textura renovada, manchas atenuadas e luminosidade
- **Duração:** 60 minutos · **Sessões:** 1 a 3 sessões anuais · **Retorno:** 5 a 7 dias
- **Indicado para:** cicatrizes de acne, manchas solares e fotoenvelhecimento, linhas finas peribucais e periorbiculares, poros dilatados
- **Destaque na home:** sim

#### 4. Fotona StarWalker
- **Slug:** `fotona-starwalker`
- **Subtítulo:** Plataforma laser para manchas, melasma e rejuvenescimento
- **Grupo:** Pele · **Categoria:** Laser
- **Descrição:** Plataforma de lasers de alta precisão para tratar melasma, manchas, vasos e renovação cutânea com segurança em diferentes fototipos.
- **Promessa:** pele uniforme, sem manchas e com brilho saudável
- **Duração:** 30 a 60 minutos · **Sessões:** 3 a 6 sessões · **Retorno:** imediato
- **Indicado para:** melasma e hiperpigmentações, manchas solares, vasinhos e rosácea, renovação geral
- **Destaque na home:** sim

#### 5. Injetáveis Premium
- **Slug:** `injetaveis-premium`
- **Subtítulo:** Toxina, preenchimento e bioestimuladores
- **Grupo:** Rejuvenescimento · **Categoria:** Injetável
- **Descrição:** Aplicações com foco em naturalidade, harmonia e expressão preservada. Toxina botulínica, ácido hialurônico e bioestimuladores conduzidos com critério médico.
- **Promessa:** resultado natural, expressão preservada, sofisticação
- **Duração:** 30 a 60 minutos · **Sessões:** manutenção a cada 4 a 12 meses · **Retorno:** imediato
- **Indicado para:** linhas de expressão e bruxismo, reposição de volume facial, definição de contorno e mandíbula, hidratação profunda
- **Destaque na home:** sim

#### 6. Skinbooster
- **Slug:** `skinbooster`
- **Subtítulo:** Hidratação profunda e qualidade de pele
- **Grupo:** Pele · **Categoria:** Injetável
- **Descrição:** Microinjeções de ácido hialurônico não reticulado em pontos estratégicos para hidratar a derme de dentro pra fora. Não faz volume.
- **Promessa:** pele densa, lisa e com viço prolongado
- **Duração:** 30 a 45 minutos · **Sessões:** 2 a 3 sessões · **Retorno:** 1 a 2 dias
- **Indicado para:** pele desidratada, linhas finas e pele crepada, pescoço, colo, dorso das mãos
- **Destaque na home:** sim

### Tecnologias parceiras (ribbon na home)
Ultraformer MPT, Volnewmer, Fotona StarWalker, CO₂ Fracionado, Hyperqual, Allergan Aesthetics, Galderma, Vydence.

---

## 7. Estrutura detalhada da Home

Ordem das seções (todas precisam estar presentes):

1. **Hero** — split, foto da Dra à direita em moldura editorial com borda fina, headline editorial à esquerda. Headline sugerida: "A medicina da pele, conduzida com tempo." (segunda linha em itálico cocoa). Subtitle, dois CTAs (`Agendar avaliação` + `Conhecer tratamentos`), micro-lista dos 6 procedimentos principais separados por bullet point.

2. **Ribbon de tecnologias** — marquee infinito horizontal com os 8 nomes de plataformas/parceiros. Eyebrow: "Plataformas e parceiros".

3. **Manifesto** — bloco de texto largo, font display, fundo com textura sutil (image conceitual). Mensagem central: "Acreditamos em uma beleza silenciosa. Aquela que ninguém aponta o procedimento, mas todos percebem que algo está em equilíbrio." Assinatura "Dra. Anna Paula Bomtempo".

4. **Áreas de atuação** — 3 cards grandes (aspect 4:5), um pra cada grupo (Pele, Rejuvenescimento, Tecnologia). Cada card mostra: foto editorial conceitual cobrindo o card, gradient escuro de baixo pra cima, número de tratamentos no grupo, título, subtítulo, CTA "Ver tratamentos". Linka pra `/tratamentos?grupo=Pele` (ou ancora).

5. **Quatro pilares** — grid 2x2 em mobile, 1x4 em desktop. Cada pilar com ícone (lucide), título e descrição.
   - Diagnóstico aprofundado: Análise clínica da sua pele, histórico, rotina e expectativas
   - Tecnologia certa: Plataformas premium escolhidas para o seu caso
   - Técnica delicada: Procedimentos conduzidos pela própria Dra. Anna
   - Acompanhamento próximo: Continuidade entre consultas

6. **Tratamentos populares** — eyebrow "Tratamentos populares", título "Os protocolos mais procurados na clínica.", grid de 6 cards (3 colunas desktop) com imagem topo, depois grupo + categoria, nome, subtítulo, footer com sessões + arrow. Linka pra `/tratamentos/[slug]`.

7. **Signature service** — bloco grande, split. Imagem editorial do Ultraformer MPT à esquerda, conteúdo à direita: eyebrow "Procedimento de assinatura", título do tratamento + subtítulo em itálico cocoa, resumo, lista de 3 diferenciais com bullet de barra, dois CTAs.

8. **A Dra. Anna** — fundo cocoa, texto cream. Foto da Dra à esquerda em editorial-card-dark com foto secundária pequena sobreposta. Direita: eyebrow, headline "Medicina, sensibilidade e tempo para cada paciente.", parágrafo com formação UFU, CRM, RQE, CTA outline "Conhecer a Dra. Anna" linkando pra /sobre.

9. **Stats** — bloco horizontal, fundo claro, 4 números grandes em display font cocoa:
   - +8 anos de prática clínica
   - +5.000 procedimentos realizados
   - 2 unidades em São Paulo
   - 1 médica responsável por cada caso

10. **Confiança/Credenciais** — eyebrow "Confiança", título "Medicina séria, conduzida por médica registrada.", grid de 4 cards editoriais: Formação (UFU), Especialização (Dermatologia clínica, cirúrgica e estética), Registro médico (CRM 177.888 · RQE 85.823), Sociedades (Sociedade Brasileira de Dermatologia). Abaixo: disclaimer CFM em italic, fonte pequena.

11. **Insights/Diário** — eyebrow "Diário", título "Estudos, anotações e cuidados da Dra.", 3 posts em preview (imagem, categoria, título). Link "Ler o diário" leva a /blog.

12. **Instagram feed** — eyebrow com ícone Instagram, headline grande com handle "@annabomtempo.dermato" linkando pra Insta. Grid de 6 thumbs quadrados (mistura de fotos da Dra e texturas conceituais, todos linkam pra Insta).

13. **Localização** — eyebrow "Onde encontrar", título "Dois endereços em São Paulo.", 2 cards editoriais com endereço completo, cada um linka pra Google Maps.

14. **CTA Final** — fundo com textura conceitual de cortina, headline grande "Pele saudável é uma decisão contínua. Vamos começar a sua?", 2 CTAs.

15. **Footer** — fundo cocoa, lockup completo cream à esquerda + descrição curta + CRM/RQE, coluna de navegação, coluna de atendimento (telefone, Instagram, endereços resumidos), linha inferior com copyright.

---

## 8. Estrutura da página /sobre

1. **Hero** — split, à esquerda eyebrow "A Dra. Anna", headline "Dermatologia conduzida com presença.", parágrafo, chips com CRM/RQE/anos de prática, CTA "Marcar uma avaliação". À direita: composição editorial 6x6 grid de fotos da Dra com cards de "2023 Início da clínica própria".

2. **Filosofia** — eyebrow "Filosofia", título "Quiet beauty. Saúde como prática contínua.", 3 colunas com pilares numerados 01, 02, 03: Escuta clínica, Naturalidade primeiro, Continuidade.

3. **Trajetória** — eyebrow "Trajetória", título "Formação e prática.", lista vertical com 3 entradas (Atual: consultório próprio, Especialização, Graduação UFU).

4. **CTA Final** — fundo cocoa, headline "A consulta começa antes de você sentar.", CTA "Agendar com a Dra. Anna", credenciais no rodapé.

---

## 9. Estrutura da página /tratamentos (hub)

1. **Hero** — eyebrow "Tratamentos", headline "Tecnologia premium, indicação certa.", parágrafo curto.

2. **Áreas de atuação** — 3 cards de grupos (aspect 5:3), cada um linka via ancora pra a seção correspondente.

3. **Grupo Pele** — eyebrow, headline, grid de tratamentos do grupo com imagem topo.

4. **Grupo Rejuvenescimento** — mesma estrutura.

5. **Grupo Tecnologia** — mesma estrutura.

6. **Como funciona** — eyebrow "Como funciona", título "Sua avaliação, em três passos.", 3 cards numerados 01, 02, 03: Anamnese, Diagnóstico, Plano de tratamento. CTA final.

---

## 10. Estrutura da página /tratamentos/[slug]

1. **Hero** — split, à esquerda: voltar pra /tratamentos com seta + categoria, headline (nome), subtítulo em itálico cocoa, resumo, 3 chips com border-left (Duração, Sessões, Retorno), 2 CTAs. À direita: imagem conceitual do tratamento + card sobreposto com "Promessa".

2. **Indicações** — split 5/7, à esquerda eyebrow + título "Para quem este protocolo foi pensado.", à direita lista 2 colunas com checkmark cocoa.

3. **Como funciona** — eyebrow + título, grid 2 colunas com cards editoriais numerados 01, 02, 03, 04.

4. **Diferenciais** — fundo cocoa, split 5/7, lista com numeração em cream e separadores.

5. **FAQ** — eyebrow centralizado, título centralizado, accordion com expand do `+` que rotaciona pra `×`.

6. **Relacionados do mesmo grupo** — 3 cards de outros tratamentos do mesmo grupo (ou fallback se não houver 3).

7. **CTA Final** — headline "Pronta para entender se o [nome] é para você?", CTA.

---

## 11. Estrutura da página /blog

1. **Hero** — eyebrow "Diário", headline "Estudos, anotações e cuidados assinados pela Dra. Anna."

2. **Lista de posts** — vertical, cards editoriais largos com categoria à esquerda, título no meio, "Em breve →" à direita. Hover sutil.

Posts a migrar do conteúdo existente (11 posts):
1. Descomplicando os rótulos de skincare
2. Vitamina C: o pilar invisível da pele radiante
3. O sono da beleza existe
4. Pele saudável em um mundo em mudança
5. Sua pele está pagando o preço do estresse?
6. Liftera e a revolução do ultrassom microfocado
7. A importância da consulta médica antes de procedimentos estéticos
8. Guia completo: rotina de skincare por tipo de pele
9. Mitos e verdades do skincare
10. Pele de pêssego: o que a dieta tem a ver com isso
11. Diga adeus às manchas com Fotona StarWalker

---

## 12. Estrutura da página /contato

1. **Hero + form** — split. À esquerda: eyebrow "Atendimento", headline "Vamos começar pela sua primeira consulta.", parágrafo, depois 3 cards editoriais empilhados: WhatsApp, Instagram, E-mail. À direita: formulário em card editorial.

2. **Formulário** (campos):
   - Nome completo (obrigatório)
   - WhatsApp (obrigatório, inputmode tel)
   - E-mail (opcional, type email)
   - Tenho interesse em (select: Avaliação geral, Rejuvenescimento facial, Lasers e manchas, Injetáveis, Outro)
   - Mensagem (opcional, textarea)
   - Submit "Enviar e abrir WhatsApp": dispara Meta Pixel Lead, server route /api/lead com Meta CAPI hasheada, abre wa.me com mensagem pré-preenchida.

3. **Unidades** — eyebrow "Unidades", título "Dois endereços, mesmo cuidado.", 2 cards de endereço linkando pra Google Maps.

4. **CTA final** — "Prefiro falar agora no WhatsApp".

---

## 13. Componentes-chave

- `Nav` — header fixo, pill rounded-full, glass-soft no topo / glass quando scroll > 24px. Logo lockup completo à esquerda (cocoa, h-5 md:h-6), nav central absoluto (4 itens: A Dra., Tratamentos, Diário, Contato), CTA "Agendar" cocoa à direita. Mobile: menu lateral com framer-motion.
- `Footer` — fundo cocoa, lockup cream h-14.
- `WhatsAppFloat` — botão flutuante bottom-right, ícone WhatsApp em SVG, ping animation atrás.
- `CTA` — botão pill com `bg-cocoa text-bone` (primary), `border` (outline), `text-cocoa` (ghost). Ícone ArrowUpRight com translate no hover.
- `Reveal` — wrapper framer-motion com fade-up viewport once.
- `SceneBackdrop` — bg image fixed com gradient overlay + grain noise SVG.
- `LogoAB` — três variantes (full / monogram / lockup) com tone (dark = cocoa / light = cream).
- `Marquee` — animação x linear infinita com mask gradient nas bordas.
- `Tracker` — componente que injeta Meta Pixel, GA4, Google Ads via next/script.

---

## 14. Funcionalidades obrigatórias

### Form de leads
- Envia ao `/api/lead` (server route)
- Dispara Pixel Lead client-side + abre WhatsApp com mensagem pré-preenchida
- Server route faz POST pra Meta Conversions API:
  - `event_name: "Lead"`, `event_id`, `action_source: "website"`
  - `user_data.ph` e `user_data.em` em SHA-256 lowercase trim
  - `user_data.client_user_agent` e `client_ip_address`
  - `custom_data.content_name`, `value`, `currency: "BRL"`
- Opcional: enviar pra webhook Supabase ou planilha
- Variável de ambiente `META_CAPI_TEST_CODE` para sandbox

### Tracking client
- Persistir `gclid` e `fbclid` em localStorage por 90 dias
- Eventos: `PageView` automático, `Lead` no submit do form e clique WhatsApp, `Schedule` no clique em Agendar

### WhatsApp
- Número: 5511916049939
- Mensagem padrão: "Olá Dra. Anna, gostaria de agendar uma avaliação dermatológica."

### SEO
- Title template: "%s · Dra. Anna Bomtempo"
- Default: "Dra. Anna Paula Bomtempo — Dermatologia em São Paulo"
- Open Graph completo, locale pt_BR
- Schema.org Physician + LocalBusiness com 2 endereços
- Palavras-chave estratégicas: dermatologia, Vila Olímpia, Jardim Paulista, Ultraformer MPT, Volnewmer, CO2 fracionado, Fotona StarWalker, melasma, rejuvenescimento facial, dermatologista São Paulo, quiet beauty

### Performance
- Imagens em WebP, 4 tamanhos (480, 960, 1440, 2000)
- next/image com `sizes` adequado
- Animações com `transform` e `opacity` apenas (60fps)
- Respeitar `prefers-reduced-motion`

---

## 15. Assets disponíveis

### Fotos
Pasta com 30+ fotos profissionais da Dra (sessão fotográfica). Usar para hero, bloco da Dra, página /sobre, Instagram feed. Não usar para representar pacientes.

### Logos
- 6 PNGs em `Logo_individual_sem_fundo/`: monograma AB, lockup ANNABOMTEMPO, e lockup completo, em versões cocoa e cream.
- Manual de identidade visual PDF disponível.

### Imagens conceituais (gerar via IA)
Para evitar comprar banco de imagens, gerar via Gemini 3 Pro Image Preview (ou Imagen 4) imagens editoriais conceituais para:
- 3 categorias (drapeado, mármore, vidro de laboratório, etc)
- 6 tratamentos (cada um com metáfora visual: stones para Ultraformer, mel quente para Volnewmer, fios de luz para CO2, frasco de soro para Skinbooster, ampola para Injetáveis, pó mineral para Fotona)
- 5 backdrops de seções (drapery, marble, botanical shadow, water, clay, curtain)

Prompt-base sempre com:
> "Editorial photograph, palette cream #E7DED0 / latte / biscotti / toffee / cocoa #82614A, quiet luxury, soft natural daylight, no people, no faces, no text, no logo, premium dermatology mood."

---

## 16. Conteúdos textuais prontos

### Headlines de seção
- Hero: "A medicina da pele, conduzida com tempo."
- Manifesto: "Acreditamos em uma beleza silenciosa. Aquela que ninguém aponta o procedimento, mas todos percebem que algo está em equilíbrio. Pele saudável, tempo respeitado, resultado seu."
- Áreas: "Três frentes de cuidado com a sua pele."
- Pilares: "Quatro pilares que orientam cada protocolo."
- Tratamentos populares: "Os protocolos mais procurados na clínica."
- Dra: "Medicina, sensibilidade e tempo para cada paciente."
- Confiança: "Medicina séria, conduzida por médica registrada."
- Insights: "Estudos, anotações e cuidados da Dra."
- Localização: "Dois endereços em São Paulo."
- CTA final: "Pele saudável é uma decisão contínua. Vamos começar a sua?"

### Subtítulos/descrições
- Sobre a clínica: "Médica dermatologista especializada em rejuvenescimento facial e tratamentos personalizados de pele, associando tecnologias avançadas, lasers e procedimentos injetáveis para resultados naturais e sofisticados."
- Diferencial: "Nosso diferencial está no acompanhamento próximo e atencioso em cada etapa do tratamento, proporcionando uma experiência premium, individualizada e focada na saúde e beleza da pele."

---

## 17. Critérios de aceitação

O site só pode ser considerado pronto quando:

- [ ] Todas as 6 rotas principais respondem 200
- [ ] Build de produção sem erros TypeScript
- [ ] Lighthouse Performance ≥ 90 em desktop e ≥ 80 em mobile
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Sem imagens de antes-e-depois ou texto promissório
- [ ] Disclaimer CFM presente em rodapé ou bloco dedicado
- [ ] Form dispara Pixel Lead + abre WhatsApp ao enviar
- [ ] Meta CAPI server route configurada (variáveis de ambiente)
- [ ] GA4 e Google Ads tag presentes (mesmo que vazias inicialmente)
- [ ] gclid/fbclid persistem por 90 dias em localStorage
- [ ] Header centraliza nav corretamente (cuidado com framer-motion sobrescrevendo `translate-x-1/2` do Tailwind, usar `x: "-50%"` no animate)
- [ ] Logo do header usa o lockup oficial em WebP, NÃO recriar via SVG/typography
- [ ] Mobile testado em 390px e 768px
- [ ] Animações respeitam `prefers-reduced-motion`
- [ ] Form com validação client (campos obrigatórios)
- [ ] OG image gerada e válida

---

## 18. Pegadinhas conhecidas

1. **Framer-motion sobrescreve Tailwind transform.** Se o header tem `left-1/2 -translate-x-1/2` no className E motion.header com `animate={{ y: 0 }}`, o motion inline `transform` apaga o `-translate-x`. Solução: passar `x: "-50%"` dentro do animate/initial.

2. **Hatton é fonte paga.** Se não tiver licença, fallback pra Fraunces (não Italiana, que é fina demais).

3. **Imagens da pasta Google Drive shortcut** podem aparecer com latência. Copiar para `/tmp/` antes de processar com Sharp.

4. **Vercel Hobby bloqueia auto-deploy via GitHub** em alguns repositórios DocAds. Solução: deploy via `vercel deploy --prod --yes` rodando da pasta do projeto.

5. **CFM, não esqueça:** se o agente quiser criar uma seção "Resultados" com galeria, recuse. Se quiser inventar depoimentos com promessa, recuse.

---

## 19. Comparação com a versão existente

Esta spec descreve a versão DocAds atualmente em build local. Para o agente gerar uma versão alternativa que possa ser comparada lado a lado, observe:

- **Estrutura:** seguir esta spec é suficiente para chegar perto.
- **Identidade:** pode variar layout, mas paleta, tipografia e tom precisam bater.
- **Diferenciais possíveis:** o agente pode escolher densidade de seções diferente, formato de hero diferente (centralizado vs split), ordenação alternativa, abordagem diferente para Instagram (Instagram OG API ao invés de feed estático).
- **Métrica de comparação:** Lighthouse score, número de seções implementadas, fidelidade ao manual de marca, qualidade dos copys, presença das funcionalidades obrigatórias (form, tracking, WhatsApp), zero violações do CFM.

---

## 20. Anexos

- Site atual de referência: https://draannabomtempo.com.br/
- Concorrentes mencionados no briefing: marinahayashida.com.br, drfernandomacedo.com.br, attualclinica.com.br
- Referências de design: aesop.com, augustinusbader.com, goop.com, refero.design (coleções beauty/medical/luxury)
- Manual de marca: PDF disponível na pasta `/MATERIAL DRA ANNA PAULA BOMTEMPO/ID Visual/`

---

**Fim do planejamento.** Boa execução.
