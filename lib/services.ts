export const getServiceIconPath = (name: string): string | null => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('agua potable') || (lowerName.includes('agua') && !lowerName.includes('gris') && !lowerName.includes('negra'))) return "/icons/agua.svg";
    if (lowerName.includes('aguas grises')) return "/icons/aguas-grises.svg";
    if (lowerName.includes('aguas negras')) return "/icons/aguas-negras.svg";
    if (lowerName.includes('mascota')) return "/icons/mascotas.svg";
    if (lowerName.includes('wifi')) return "/icons/wifi.svg";
    if (lowerName.includes('basura')) return "/icons/basura.svg";
    if (lowerName.includes('baño') || lowerName.includes('toilets')) return "/icons/banos.svg";
    if (lowerName.includes('ducha')) return "/icons/ducha.svg";
    if (lowerName.includes('electricidad')) return "/icons/electricidad.svg";
    if (lowerName.includes('lavandería')) return "/icons/lavanderia.svg";
    if (lowerName.includes('lavado')) return "/icons/lavado-autocaravanas.svg";
    if (lowerName.includes('panadería')) return "/icons/panaderia.svg";
    if (lowerName.includes('piscina')) return "/icons/piscina.svg";
    if (lowerName.includes('5g')) return "/icons/5g.svg";

    return null;
};
