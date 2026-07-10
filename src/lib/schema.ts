import { absoluteUrl, BASE_URL } from "@/lib/seo";
import { SITE } from "@/lib/site";
import type { Tratamento } from "@/lib/tratamentos";

/**
 * Schema.org do site. Regras do CFM valem aqui também: nada de promessa de
 * resultado, e CRM/RQE sempre declarados.
 */

const PHYSICIAN_ID = absoluteUrl("/#medica");
const CLINIC_ID = absoluteUrl("/#clinica");
const endereco = SITE.enderecos[0];

/** Especialidade: a enumeração do schema.org substituiu "Dermatologic" por este valor. */
const ESPECIALIDADE = "Dermatology";

// addressLocality é o município, não o bairro. Divergir disso quebra a consistência
// de NAP com o Google Business Profile, que é o que sustenta o pacote local.
const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: `${endereco.rua}, ${endereco.complemento}, ${endereco.bairro}`,
  addressLocality: "São Paulo",
  addressRegion: "SP",
  postalCode: endereco.cep,
  addressCountry: "BR",
} as const;

/** Coordenadas não são declaradas: melhor omitir do que publicar um ponto errado. */
const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco.mapsQuery)}`;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: BASE_URL,
      name: SITE.name,
      inLanguage: "pt-BR",
      publisher: { "@id": PHYSICIAN_ID },
    },
    {
      // IndividualPhysician, não Physician: no schema.org, Physician modela a prática
      // e IndividualPhysician o profissional. Ambos descendem de Organization, então
      // jobTitle e worksFor (propriedades de Person) não valem aqui; a ligação com o
      // consultório é practicesAt.
      "@type": "IndividualPhysician",
      "@id": PHYSICIAN_ID,
      name: SITE.name,
      alternateName: SITE.shortName,
      description: `${SITE.role} · ${SITE.crm} · ${SITE.rqe}`,
      medicalSpecialty: ESPECIALIDADE,
      url: BASE_URL,
      image: absoluteUrl("/img/dra/dra-hero-1440.webp"),
      telephone: SITE.phone,
      email: SITE.email,
      address: postalAddress,
      hasMap: mapaUrl,
      areaServed: { "@type": "City", name: "São Paulo" },
      sameAs: [SITE.instagram],
      practicesAt: { "@id": CLINIC_ID },
      identifier: [
        { "@type": "PropertyValue", name: "CRM-SP", value: SITE.crm.replace(/[^\d.]/g, "") },
        { "@type": "PropertyValue", name: "RQE", value: SITE.rqe.replace(/[^\d.]/g, "") },
      ],
    },
    {
      "@type": "MedicalClinic",
      "@id": CLINIC_ID,
      name: `Consultório ${SITE.shortName}`,
      url: BASE_URL,
      image: absoluteUrl("/img/dra/dra-hero-1440.webp"),
      telephone: SITE.phone,
      email: SITE.email,
      address: postalAddress,
      hasMap: mapaUrl,
      medicalSpecialty: ESPECIALIDADE,
      areaServed: { "@type": "City", name: "São Paulo" },
      priceRange: "$$$",
    },
  ],
};

export const breadcrumbSchema = (trilha: { nome: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trilha.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.nome,
    item: absoluteUrl(item.path),
  })),
});

// MedicalProcedure aceita: bodyLocation, followup, howPerformed, preparation,
// procedureType, status (próprias) e as de MedicalEntity/Thing. "indication" e
// "performer" NÃO estão entre elas, apesar de parecerem naturais aqui. As
// indicações ficam de fora: nenhuma propriedade válida as representa, e
// preparation significa outra coisa (o preparo do paciente antes do procedimento).
export const tratamentoSchema = (t: Tratamento) => ({
  "@context": "https://schema.org",
  "@type": "MedicalProcedure",
  "@id": absoluteUrl(`/tratamentos/${t.slug}#procedimento`),
  name: t.nome,
  // resumo é descritivo; promessa é linguagem de venda e fica fora do schema.
  description: t.resumo,
  url: absoluteUrl(`/tratamentos/${t.slug}`),
  image: absoluteUrl(`/img/bg/tx-${t.slug}-1600.webp`),
  howPerformed: t.comoFunciona.join(" "),
  relevantSpecialty: ESPECIALIDADE,
});

export const faqSchema = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
});

export const postSchema = (post: {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  updated_at: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": absoluteUrl(`/blog/${post.slug}#post`),
  mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  headline: post.title,
  description: post.excerpt ?? undefined,
  image: post.cover_image ?? undefined,
  datePublished: post.published_at ?? undefined,
  dateModified: post.updated_at,
  inLanguage: "pt-BR",
  author: { "@id": PHYSICIAN_ID },
  publisher: { "@id": PHYSICIAN_ID },
});
