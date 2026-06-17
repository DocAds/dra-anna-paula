export const SITE = {
  name: "Dra. Anna Paula Bomtempo",
  shortName: "Anna Bomtempo",
  role: "Dermatologista",
  crm: "CRM 177.888",
  rqe: "RQE 85.823",
  phone: "+55 11 91604-9939",
  whatsappE164: "5511916049939",
  whatsappMessage:
    "Olá Dra. Anna, gostaria de agendar uma avaliação dermatológica.",
  instagram: "https://www.instagram.com/annabomtempo.dermato/",
  email: "contato@draannabomtempo.com.br",
  url: "https://draannabomtempo.com.br",
  enderecos: [
    {
      label: "Vila Olímpia",
      rua: "R. Helena, 218",
      complemento: "Conj. 203",
      bairro: "Vila Olímpia",
      cidade: "São Paulo — SP",
      cep: "04552-050",
      mapsQuery: "R. Helena, 218, Vila Olímpia, São Paulo",
    },
  ],
} as const;

export const NAV = [
  { label: "A Dra.", href: "/sobre" },
  { label: "Tratamentos", href: "/tratamentos" },
  { label: "Diário", href: "/blog" },
  { label: "Contato", href: "/contato" },
] as const;

export const whatsappLink = (msg?: string) =>
  `https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent(
    msg ?? SITE.whatsappMessage
  )}`;
