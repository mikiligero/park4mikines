"use client";

import { useState } from "react";

export default function VisitPlaceImage({ imageUrl, title, className = "" }: {
    imageUrl: string | null; title: string; className?: string;
}) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    if (!imageUrl || failedUrl === imageUrl) return null;

    return <img
        ref={image => {
            // A server-rendered image can fail before React attaches onError.
            if (image?.complete && image.naturalWidth === 0) setFailedUrl(imageUrl);
        }}
        className={`visit-place-image ${className}`}
        src={imageUrl}
        alt={`Foto de ${title}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(imageUrl)}
    />;
}
