"use client";

import { Icon } from "@/components/Icon";
import type { VisitPlaceItem } from "@/lib/visits";
import VisitPlaceImage from "@/components/VisitPlaceImage";

type Props = {
    place: VisitPlaceItem;
    selected?: boolean;
    onSelect?: () => void;
    onClose?: () => void;
    onOpenDetail: () => void;
};

export default function VisitMapCard({ place, selected = false, onSelect, onClose, onOpenDetail }: Props) {
    const located = place.latitude !== null && place.longitude !== null;

    return <article className={`visit-map-card${selected ? " is-selected" : ""}${onClose ? " is-preview" : ""}`} aria-label={`Lugar: ${place.title}`}>
        {onClose && <div className="visit-map-handle" aria-hidden="true" />}
        <VisitPlaceImage imageUrl={place.imageUrl} title={place.title} className="visit-place-image--map" />
        <div className="visit-map-card-heading">
            <div className="visit-map-icon"><Icon name={place.visited ? "check" : "pin"} size={24} /></div>
            <div className="visit-map-heading-text">
                <span className={`visit-map-status${place.visited ? " is-visited" : ""}`}>{place.visited ? "Visitado" : "Por visitar"}</span>
                <h3>{onSelect ? <button className="visit-map-title-button" onClick={onSelect} aria-pressed={selected}>{place.title}</button> : place.title}</h3>
            </div>
            {onClose && <button className="iconbtn iconbtn-ghost visit-map-close" onClick={onClose} aria-label="Cerrar ficha del lugar" title="Cerrar ficha"><Icon name="close" size={18} /></button>}
        </div>
        <div className="visit-map-body">
            <span className="visit-tag">{place.type?.name || "Sin clasificar"}</span>
            <p className="visit-map-location"><Icon name="pin" size={14} /><span>{place.locationName || (located ? "Ubicación guardada en el mapa" : "Pendiente de ubicar")}</span></p>
            {place.notes && <p className="visit-map-notes">{place.notes}</p>}
            {place.sourceUrl && <a className="visit-map-source" href={place.sourceUrl} target="_blank" rel="noopener noreferrer">Ver enlace original <span aria-hidden="true">↗</span></a>}
        </div>
        <div className="visit-map-actions">
            {onSelect ? <button className="btn btn-soft btn-md" onClick={onSelect}><Icon name="map" size={16} />Ver en mapa</button> : located && <a className="btn btn-soft btn-md" href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`} target="_blank" rel="noopener noreferrer"><Icon name="navigate" size={16} />Cómo llegar</a>}
            <button className="btn btn-primary btn-md" onClick={onOpenDetail}><Icon name="info" size={16} />Ver ficha</button>
        </div>
    </article>;
}
