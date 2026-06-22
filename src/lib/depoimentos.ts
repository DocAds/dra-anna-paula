export type Depoimento = {
  /** Apenas iniciais, para preservar a privacidade do paciente. */
  iniciais: string;
  /** Nota de 1 a 5. */
  nota: number;
  /** Texto do depoimento, sem promessa de resultado. */
  texto: string;
};

/**
 * Depoimentos reais de pacientes (Google Meu Negócio · perfil 5,0), anonimizados por
 * iniciais. Mantidos com foco na experiência de atendimento, sem promessa de resultado
 * e sem antes/depois, em linha com a ética médica (Resolução CFM nº 1.974/2011 e Código
 * de Ética Médica). A seção não é exibida enquanto a lista estiver vazia.
 */
export const depoimentos: Depoimento[] = [
  {
    iniciais: "C.M.",
    nota: 5,
    texto:
      "Fui atendida pela Dra. Anna e fiquei impressionada com o quanto ela é atenciosa, dedicada e extremamente profissional. Explica tudo com clareza, transmite segurança e realmente se preocupa com o paciente. Excelente experiência, recomendo muito!",
  },
  {
    iniciais: "L.S.",
    nota: 5,
    texto:
      "Profissional exemplar! A Dra. Anna Paula une conhecimento, paciência e atenção. Explica cada detalhe do tratamento e demonstra verdadeiro cuidado com o paciente. Saí da consulta muito satisfeita e confiante.",
  },
  {
    iniciais: "R.M.",
    nota: 5,
    texto:
      "Atendimento de excelência. Ela é extremamente atenciosa, profissional, atualizada e explica tudo de forma clara e cuidadosa. Sempre me senti acolhido em cada consulta.",
  },
  {
    iniciais: "V.M.",
    nota: 5,
    texto:
      "A Dra. Anna Paula é uma dermatologista incrível, muito competente e que se preocupa de verdade com o paciente. Uma equipe muito atenciosa. Me senti muito segura e acolhida. Recomendo.",
  },
  {
    iniciais: "A.S.",
    nota: 5,
    texto:
      "Uma brilhante profissional. A cada consulta supera minhas expectativas: generosa, atenciosa e com amor à profissão. Recomendo muito!",
  },
  {
    iniciais: "S.F.",
    nota: 5,
    texto:
      "Ambiente maravilhoso, com pessoas atenciosas e competentes. Esse é o segredo do sucesso! Parabéns a todos, em especial à Dra. Anna Paula.",
  },
  {
    iniciais: "V.C.",
    nota: 5,
    texto:
      "A Dra. Anna é maravilhosa, sempre a recomendo pelo excelente trabalho que realiza. Atendimento excepcional, explicativo e inclusivo.",
  },
];
