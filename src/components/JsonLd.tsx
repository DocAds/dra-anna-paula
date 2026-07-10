/**
 * Injeta um bloco schema.org. O conteúdo vem só de dados do próprio projeto,
 * nunca de entrada do usuário, e o < é escapado contra quebra de tag.
 */
export function JsonLd({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
