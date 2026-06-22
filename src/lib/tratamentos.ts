export type Categoria = "Pele" | "Rejuvenescimento" | "Tecnologia";

export type Tratamento = {
  slug: string;
  nome: string;
  subtitulo: string;
  categoria: "Tecnologia" | "Injetável" | "Laser" | "Cuidado clínico";
  grupo: Categoria;
  resumo: string;
  promessa: string;
  duracao: string;
  sessoes: string;
  retorno: string;
  indicacoes: string[];
  comoFunciona: string[];
  diferenciais: string[];
  faq: { q: string; a: string }[];
  destaque?: boolean;
};

export const grupos: { slug: Categoria; titulo: string; sub: string; img: string }[] = [
  {
    slug: "Pele",
    titulo: "Pele",
    sub: "Saúde e qualidade dérmica",
    img: "/img/bg/tx-cat-pele-1600.webp",
  },
  {
    slug: "Rejuvenescimento",
    titulo: "Rejuvenescimento",
    sub: "Naturalidade e contorno",
    img: "/img/bg/tx-cat-rejuvenescimento-1600.webp",
  },
  {
    slug: "Tecnologia",
    titulo: "Tecnologia",
    sub: "Plataformas premium",
    img: "/img/bg/tx-cat-tecnologia-1600.webp",
  },
];

// Tecnologias e portfólio de produtos disponíveis na clínica (não são patrocínios).
export const tecnologiasParceiras = [
  "Ultraformer MPT Medsystems",
  "Volnewmer Medsystems",
  "Hegon MedicalSan",
  "Fotona 4D",
  "MesojetGun Toskani",
  "Etherea Vydence",
  "Harmonyca Allergan",
  "Profhilo",
  "Galderma",
  "DermaDream",
  "Merz",
  "Fios MedBeauty",
];

export const stats = [
  { v: "+10", l: "Anos de experiência clínica" },
  { v: "+5.000", l: "Pacientes acompanhados" },
  { v: "+10.000", l: "Procedimentos e tratamentos conduzidos" },
  { v: "1", l: "Médica responsável por cada jornada de cuidado" },
];

export const tratamentos: Tratamento[] = [
  {
    slug: "ultraformer-mpt",
    nome: "Ultraformer MPT",
    subtitulo: "Lifting sem cirurgia com ultrassom microfocado",
    categoria: "Tecnologia",
    grupo: "Rejuvenescimento",
    destaque: true,
    resumo:
      "Estimula colágeno profundo nas camadas SMAS e derme reticular para redensificar, contornar e levantar a face sem afastamento social.",
    promessa: "Contorno mais definido, pele firme e olhar descansado.",
    duracao: "60 a 90 minutos",
    sessoes: "1 a 2 sessões anuais",
    retorno: "Imediato",
    indicacoes: [
      "Flacidez de terço inferior e papada",
      "Queda de sobrancelha e olhar cansado",
      "Perda de definição mandibular",
      "Pescoço com flacidez leve a moderada",
      "Prevenção de envelhecimento facial a partir dos 30",
    ],
    comoFunciona: [
      "Mapeamento facial individualizado pela Dra. Anna, traçando vetores de sustentação.",
      "Aplicação do ultrassom microfocado em múltiplas profundidades, atingindo a camada SMAS sem agredir a pele.",
      "Estímulo de neocolágeno e elastina por até 6 meses após a sessão.",
      "Resultado progressivo com efeito tensor visível desde a primeira semana.",
    ],
    diferenciais: [
      "Tecnologia MPT (Micro Pulsed Technology) com menor desconforto que ultrassons convencionais.",
      "Protocolo combinado com bioestimuladores quando indicado.",
      "Avaliação e retorno presencial incluídos no acompanhamento.",
    ],
    faq: [
      {
        q: "Dói?",
        a: "O Ultraformer MPT trabalha com pulsos fracionados que reduzem significativamente o desconforto. Uso de anestésico tópico e protocolos personalizados garantem uma sessão tranquila.",
      },
      {
        q: "Quando vejo o resultado?",
        a: "O efeito tensor inicial aparece em cerca de 30 dias e o resultado completo de remodelação de colágeno se consolida em 3 a 4 meses.",
      },
      {
        q: "Posso voltar à rotina logo após?",
        a: "Sim. O procedimento não exige afastamento social — você pode retomar atividades no mesmo dia.",
      },
    ],
  },
  {
    slug: "volnewmer",
    nome: "Volnewmer",
    subtitulo: "Radiofrequência monopolar de última geração",
    categoria: "Tecnologia",
    grupo: "Rejuvenescimento",
    destaque: true,
    resumo:
      "Aquecimento controlado e profundo da derme para retração de pele e estímulo de colágeno em face, pescoço, colo e corpo.",
    promessa: "Pele mais firme, lisa e luminosa em poucas sessões.",
    duracao: "45 a 75 minutos",
    sessoes: "Protocolo de 1 a 3 sessões",
    retorno: "Imediato",
    indicacoes: [
      "Flacidez facial e do pescoço",
      "Linhas finas e textura irregular",
      "Pré e pós procedimentos cirúrgicos",
      "Manutenção de resultados de bioestimuladores",
    ],
    comoFunciona: [
      "Mapeamento das áreas com aplicação por zonas controladas.",
      "Tecnologia monopolar que entrega energia profunda mantendo conforto.",
      "Estímulo contínuo de remodelação dérmica nos meses seguintes.",
    ],
    diferenciais: [
      "Conforto superior em comparação a radiofrequências antigas.",
      "Pode ser combinado com Ultraformer e bioestimuladores no mesmo plano.",
      "Indicado também para áreas delicadas como pálpebras.",
    ],
    faq: [
      {
        q: "Vou ficar marcada?",
        a: "Não. O Volnewmer é não invasivo e respeita a barreira cutânea — só uma leve sensação de calor durante a sessão.",
      },
      {
        q: "Quantas sessões preciso?",
        a: "A Dra. Anna define isso após avaliação. Em geral o protocolo é de 1 a 3 sessões espaçadas por 30 a 60 dias.",
      },
    ],
  },
  {
    slug: "laser-co2-fracionado",
    nome: "Laser CO₂ Fracionado",
    subtitulo: "Renovação profunda da pele",
    categoria: "Laser",
    grupo: "Tecnologia",
    destaque: true,
    resumo:
      "Ablação fracionada que remove camadas superficiais e estimula a regeneração para uma pele mais lisa, uniforme e densa.",
    promessa: "Textura renovada, manchas atenuadas e luminosidade.",
    duracao: "60 minutos",
    sessoes: "1 a 3 sessões anuais",
    retorno: "5 a 7 dias",
    indicacoes: [
      "Cicatrizes de acne",
      "Manchas solares e fotoenvelhecimento",
      "Linhas finas peribucais e periorbiculares",
      "Poros dilatados e textura irregular",
    ],
    comoFunciona: [
      "Pré-tratamento personalizado para garantir segurança ao seu fototipo.",
      "Aplicação fracionada com parâmetros ajustados às camadas alvo.",
      "Acompanhamento durante todo o período de recuperação.",
    ],
    diferenciais: [
      "Protocolo combinado com peelings, ativos e fotoproteção médica.",
      "Indicado para resultados estruturais que cremes não alcançam.",
      "Avaliação prévia obrigatória para descartar contraindicações.",
    ],
    faq: [
      {
        q: "Posso fazer no verão?",
        a: "Sim, é possível fazer no verão com cuidado e acompanhamento médico, mantendo fotoproteção rigorosa antes e depois do procedimento.",
      },
      {
        q: "Quantos dias de afastamento?",
        a: "A recuperação total leva em média 5 a 7 dias. É possível retomar as atividades já no dia seguinte, sempre com proteção solar e seguindo os cuidados indicados, a depender da intensidade do tratamento realizado.",
      },
    ],
  },
  {
    slug: "etherea-vydence",
    nome: "Etherea Vydence",
    subtitulo: "Plataforma laser para manchas, melasma e rejuvenescimento",
    categoria: "Laser",
    grupo: "Pele",
    destaque: true,
    resumo:
      "Plataforma de lasers de alta precisão para tratar melasma, manchas, vasos e renovação cutânea com segurança em diferentes fototipos.",
    promessa: "Pele uniforme, sem manchas e com brilho saudável.",
    duracao: "30 a 60 minutos",
    sessoes: "Protocolo de 3 a 6 sessões",
    retorno: "Imediato",
    indicacoes: [
      "Melasma e hiperpigmentações",
      "Manchas solares e pós-inflamatórias",
      "Vasinhos e rosácea",
      "Renovação geral da pele",
    ],
    comoFunciona: [
      "Diagnóstico aprofundado do tipo de mancha e fototipo.",
      "Seleção do comprimento de onda ideal para cada caso.",
      "Sessões protocoladas associadas a tratamento domiciliar prescrito.",
    ],
    diferenciais: [
      "Resultado consistente em melasma, condição que exige expertise.",
      "Combinação inteligente com ativos clínicos e fotoproteção.",
      "Plano de manutenção para evitar recidiva.",
    ],
    faq: [
      {
        q: "Melasma tem cura?",
        a: "Melasma é uma condição crônica que precisa de manejo contínuo. Com o protocolo certo é possível controlar e clarear de forma sustentada.",
      },
      {
        q: "É seguro para pele morena ou negra?",
        a: "Sim. A plataforma permite ajustar parâmetros para fototipos altos com segurança quando conduzida por dermatologista experiente.",
      },
    ],
  },
  {
    slug: "injetaveis-premium",
    nome: "Injetáveis Premium",
    subtitulo: "Toxina, preenchimento e bioestimuladores",
    categoria: "Injetável",
    grupo: "Rejuvenescimento",
    destaque: true,
    resumo:
      "Aplicações com foco em naturalidade, harmonia e expressão preservada. Toxina botulínica, ácido hialurônico e bioestimuladores conduzidos com critério médico.",
    promessa: "Resultado natural, expressão preservada, sofisticação.",
    duracao: "30 a 60 minutos",
    sessoes: "Manutenção a cada 4 a 12 meses",
    retorno: "Imediato",
    indicacoes: [
      "Linhas de expressão e bruxismo",
      "Reposição de volume facial",
      "Definição de contorno e mandíbula",
      "Hidratação profunda e qualidade da pele",
    ],
    comoFunciona: [
      "Avaliação anatômica detalhada de proporções e expressão.",
      "Escolha do produto certificado e da técnica ideal para o seu caso.",
      "Aplicação com foco em movimento natural e resultado discreto.",
    ],
    diferenciais: [
      "Naturalidade como princípio, sem excessos.",
      "Produtos de origem rastreada e marcas de referência.",
      "Plano de manutenção pensado para a longevidade do rosto.",
    ],
    faq: [
      {
        q: "Vou ficar com cara congelada?",
        a: "Não. O objetivo é suavizar marcas mantendo movimento e expressão. A dose é individualizada para cada paciente.",
      },
      {
        q: "Quanto tempo dura?",
        a: "Toxina dura em média 4 a 6 meses, preenchimentos de 9 a 18 meses, bioestimuladores até 24 meses, dependendo do produto e da região.",
      },
    ],
  },
  {
    slug: "mesojetgun",
    nome: "MesojetGun Toskani",
    subtitulo: "Hidratação e qualidade de pele",
    categoria: "Tecnologia",
    grupo: "Pele",
    destaque: true,
    resumo:
      "Mesoterapia sem agulha da Toskani: por meio de pressão controlada, infunde ativos como ácido hialurônico, vitaminas e antioxidantes nas camadas da pele, melhorando a hidratação, o viço e a qualidade da pele com conforto e praticamente sem tempo de recuperação.",
    promessa: "Pele hidratada, lisa e com viço, sem agulhas.",
    duracao: "30 a 45 minutos",
    sessoes: "Protocolo de 3 a 6 sessões",
    retorno: "Imediato",
    indicacoes: [
      "Pele desidratada e com aspecto opaco",
      "Perda de viço e textura irregular",
      "Preparo da pele para eventos e protocolos",
      "Quem busca resultado sem agulha e sem afastamento",
      "Manutenção contínua da qualidade da pele",
    ],
    comoFunciona: [
      "Avaliação da hidratação, textura e necessidades da sua pele.",
      "Seleção dos ativos do coquetel Toskani conforme o objetivo do tratamento.",
      "Infusão dos ativos por jato de pressão, sem agulha, distribuída por toda a área.",
      "Protocolo seriado para hidratação progressiva e melhora da qualidade dérmica.",
    ],
    diferenciais: [
      "Sem agulha: confortável e indicado também para quem tem receio de injeções.",
      "Praticamente sem tempo de recuperação, encaixa na rotina.",
      "Ativos premium da Toskani, escolhidos caso a caso.",
      "Excelente complemento a bioestimuladores, laser e demais protocolos.",
    ],
    faq: [
      {
        q: "Faz volume?",
        a: "Não. O MesojetGun trabalha a hidratação e a qualidade da pele, não o preenchimento de volume.",
      },
      {
        q: "Dói? Tem agulha?",
        a: "Não tem agulha. Os ativos são infundidos por pressão controlada, o que torna a sessão confortável e tranquila.",
      },
    ],
  },
  {
    slug: "volformer",
    nome: "Volformer",
    subtitulo: "Lifting, firmeza e qualidade da pele sem cirurgia",
    categoria: "Tecnologia",
    grupo: "Rejuvenescimento",
    destaque: true,
    resumo:
      "Protocolo integrado da Medsystems que combina o Ultraformer MPT (ultrassom microfocado) e o Volnewmer (radiofrequência monopolar) para atuar em diferentes camadas da pele. Estimula colágeno, promove aquecimento volumétrico controlado e retração tecidual, redefinindo contornos e devolvendo firmeza à face e ao corpo, com efeito lifting imediato e remodelação progressiva.",
    promessa: "Lifting, firmeza e qualidade da pele, sem cirurgia.",
    duracao: "60 a 90 minutos",
    sessoes: "Protocolo personalizado",
    retorno: "Imediato",
    indicacoes: [
      "Flacidez facial, papada e contorno mandibular",
      "Linhas finas e textura da pele",
      "Flacidez corporal leve a moderada",
      "Quem busca efeito lifting sem cirurgia",
    ],
    comoFunciona: [
      "Mapeamento facial individualizado pela Dra. Anna, definindo áreas e profundidades de tratamento.",
      "Ultraformer MPT: ultrassom microfocado nas camadas SMAS e derme para efeito lifting e sustentação.",
      "Volnewmer: radiofrequência monopolar com aquecimento controlado para remodelação do colágeno e melhora da firmeza e textura da pele.",
      "Associação de injetáveis premium quando necessário, após avaliação médica cuidadosa.",
    ],
    diferenciais: [
      "Une o padrão-ouro em ultrassom microfocado (Ultraformer MPT) à radiofrequência biogeradora (Volnewmer).",
      "Atua em múltiplas camadas, da SMAS à derme, com precisão e conforto superiores.",
      "Efeito lifting imediato somado à remodelação progressiva de colágeno, com resultado natural.",
      "Protocolo personalizado, com associação de injetáveis premium quando indicado.",
    ],
    faq: [
      {
        q: "O Volformer é cirúrgico?",
        a: "Não. É um protocolo não cirúrgico que combina ultrassom microfocado e radiofrequência, sem cortes e sem afastamento social.",
      },
      {
        q: "Quando vejo o resultado?",
        a: "O efeito tensor inicial aparece nas primeiras semanas e a remodelação de colágeno se consolida ao longo dos meses seguintes.",
      },
    ],
  },
];

export const tratamentoBySlug = (slug: string) =>
  tratamentos.find((t) => t.slug === slug);

// Opções de interesse para os formulários de lead (deriva do catálogo).
export const interessesLead: string[] = [
  ...tratamentos.map((t) => t.nome),
  "Outro / não sei ainda",
];
