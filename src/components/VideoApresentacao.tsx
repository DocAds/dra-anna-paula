"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

const FONTES = {
  hd: "/video/dra-anna-apresentacao-1080p.webm",
  sd: "/video/dra-anna-apresentacao-720p.webm",
  mp4: "/video/dra-anna-apresentacao-1080p.mp4",
};

const POSTER = "/video/dra-anna-apresentacao-poster-1600.webp";
const DURACAO = "1:25";

type ConnectionInfo = { saveData?: boolean };

/**
 * Tela pequena ou economia de dados ligada recebem a versão de 720p (9,9 MB
 * contra 19 MB). O atributo media do <source> não é confiável em <video>, por
 * isso a escolha é feita aqui, depois da hidratação.
 */
function escolherWebm() {
  if (typeof window === "undefined") return FONTES.hd;
  const conexao = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  if (conexao?.saveData) return FONTES.sd;
  return window.matchMedia("(min-width: 1024px)").matches ? FONTES.hd : FONTES.sd;
}

/**
 * Vídeo de apresentação do consultório. Nada é baixado antes do play
 * (preload="none"): até lá a única coisa no fio é o poster.
 */
export function VideoApresentacao() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webm, setWebm] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);

  // As <source> entram só depois da hidratação, quando já dá para saber o
  // tamanho da tela. Inserir a primeira source num <video> ainda vazio aciona a
  // seleção de recurso sem load(), e load() aqui faria o Chrome baixar o
  // arquivo inteiro apesar do preload="none".
  useEffect(() => {
    setWebm(escolherWebm());
  }, []);

  function iniciar() {
    const video = videoRef.current;
    if (!video) return;
    // play() precisa sair de dentro do gesto do usuário, senão o iOS bloqueia o áudio.
    void video.play();
    setTocando(true);
    window.gtag?.("event", "video_play", { source: "bloco-dra", video: "apresentacao" });
    window.dataLayer?.push({ event: "video_play", source: "bloco-dra" });
  }

  return (
    <div className="relative rounded-[24px] overflow-hidden editorial-card-dark p-2">
      <div className="relative aspect-video rounded-[18px] overflow-hidden bg-cocoa">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          preload="none"
          playsInline
          controls={tocando}
          onPlay={() => setTocando(true)}
          onEnded={() => setTocando(false)}
        >
          {webm && (
            <>
              <source src={webm} type="video/webm" />
              <source src={FONTES.mp4} type="video/mp4" />
            </>
          )}
        </video>

        {!tocando && (
          <button
            type="button"
            onClick={iniciar}
            aria-label="Assistir ao vídeo de apresentação do consultório"
            className="group absolute inset-0 flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cocoa"
          >
            <Image
              src={POSTER}
              alt=""
              fill
              sizes="(min-width: 1024px) 70vw, 92vw"
              className="object-cover"
            />
            {/* O vídeo tem legenda queimada no rodapé do quadro: o degrade mais
                forte embaixo evita que ela apareça picotada atrás do play. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-cocoa/90 via-cocoa/25 to-cocoa/5"
            />
            <span
              aria-hidden
              className="relative inline-flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-cream/95 text-cocoa shadow-2xl transition-transform duration-500 ease-out group-hover:scale-110"
            >
              <Play className="h-5 w-5 md:h-7 md:w-7 translate-x-[2px] fill-cocoa" />
            </span>
            <span className="relative mt-5 hidden md:block text-[11px] uppercase tracking-widest3 text-bone">
              Assistir · {DURACAO}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
