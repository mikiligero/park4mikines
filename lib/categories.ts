export const IconPaths = {
    NATURE: "/icons/naturaleza.svg",
    PARKING_DN: "/icons/parking.svg",
    REST_AREA: "/icons/area-descanso.svg",
    PICNIC: "/icons/picnic.svg",
    AC_FREE: "/icons/autocaravana.svg",
    AC_PAID: "/icons/ac_pago.svg",
    OFFROAD: "/icons/4x4.svg",
    CAMPING: "/icons/camping.svg",
    SERVICE: "/icons/area-servicios.svg",
    PARKING_DAY: "/icons/parking-dia.svg",
    CANDIDATO: "/icons/candidato.svg",
};

export const getCategoryStyles = (category: string) => {
    switch (category) {
        case "NATURE": return { img: IconPaths.NATURE, label: "En plena naturaleza" };
        case "PARKING_DN": return { img: IconPaths.PARKING_DN, label: "Aparcamiento día y noche" };
        case "REST_AREA": return { img: IconPaths.REST_AREA, label: "Área de descanso" };
        case "PICNIC": return { img: IconPaths.PICNIC, label: "Zona de picnic" };
        case "AC_FREE": return { img: IconPaths.AC_FREE, label: "Área de AC gratuita" };
        case "AC_PAID": return { img: IconPaths.AC_PAID, label: "Área de AC de pago" };
        case "OFFROAD": return { img: IconPaths.OFFROAD, label: "Off-road (4x4)" };
        case "CAMPING": return { img: IconPaths.CAMPING, label: "Camping" };
        case "SERVICE": return { img: IconPaths.SERVICE, label: "Área de servicios sin aparcamiento" };
        case "PARKING_DAY": return { img: IconPaths.PARKING_DAY, label: "Aparcamiento solo día" };
        case "CANDIDATO": return { img: IconPaths.CANDIDATO, label: "Candidato" };
        default: return { img: IconPaths.PARKING_DN, label: "Otro" };
    }
};
