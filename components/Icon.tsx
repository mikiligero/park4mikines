"use client";

import React from "react";

export type IconName =
  // place types
  | "tree" | "camper" | "parking" | "parkingDay" | "road" | "picnic"
  | "offroad" | "tent" | "dump"
  // services
  | "water" | "faucet" | "toilet" | "drain" | "greywater" | "trash"
  | "restroom" | "shower" | "plug" | "wifi" | "pool" | "laundry"
  | "camperwash" | "signal" | "pet" | "parasol" | "shade" | "bread" | "view"
  // ui
  | "search" | "filter" | "map" | "list" | "heart" | "star" | "plus"
  | "close" | "back" | "chevron" | "chevronDown" | "share" | "navigate"
  | "moon" | "settings" | "menu" | "gps" | "camera" | "image" | "check"
  | "edit" | "clock" | "users" | "euro" | "info" | "question" | "questionMark"
  | "sun" | "pin" | "route" | "sliders" | "arrowUp" | "external" | "bookmark"
  | "leaf" | "refresh" | "globe" | "calendar" | "chart" | "user" | "monitor"
  | "brush" | "database" | "save" | "download" | "upload" | "eye" | "eyeOff"
  | "lock" | "home" | "car" | "fuel" | "shop" | "food" | "mountain"
  | "flag" | "tag" | "box" | "grip";

interface IconProps {
  name: IconName;
  size?: number;
  filled?: boolean;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SCALE: Partial<Record<IconName, number>> = {
  tree: 1.16,
  camper: 1.14,
  picnic: 1.16,
  offroad: 1.14,
};

export function Icon({
  name,
  size = 22,
  filled = false,
  strokeWidth = 1.9,
  className,
  style,
}: IconProps) {
  const svgStyle: React.CSSProperties = { width: size, height: size, display: "block", flexShrink: 0, ...style };
  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: svgStyle,
    className,
  };

  const glyphs: Record<IconName, React.ReactNode> = {
    // ── place types ──
    tree: <g><path d="M12 3 6.5 11h3.2l-4 5.5h12.6l-4-5.5h3.2L12 3Z"/><path d="M12 16.5V21"/></g>,
    camper: <g><path d="M2.5 16V8.6A1.6 1.6 0 0 1 4.1 7H13l5.4 4.6h1.1A1.4 1.4 0 0 1 21 13v3"/><path d="M2.5 16h2.3M9.3 16h5M19 16h2"/><circle cx="7" cy="16.5" r="2.2"/><circle cx="16.8" cy="16.5" r="2.2"/><rect x="4.6" y="9.4" width="3.4" height="2.8" rx="0.6"/></g>,
    parking: <g><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M9 17.5V6.5h4a2.6 2.6 0 0 1 0 5.2H9"/></g>,
    parkingDay: <g><path d="M7 20V4h5a4 4 0 0 1 0 8H7"/><circle cx="18" cy="6.5" r="2.3"/><path d="M18 1.9v1.2M18 9.7v1.2M22.4 6.5h-1.2M15.8 6.5h-1.2M21.1 3.4l-.85.85M15.75 8.75l-.85.85M21.1 9.6l-.85-.85M15.75 4.25l-.85-.85"/></g>,
    road: <g><path d="M7.5 21 9.7 4M16.5 21 14.3 4"/><path d="M12 6v2.4M12 10.8v2.4M12 15.6V18"/></g>,
    picnic: <g><path d="M3 9.5h18M5.5 9.5 3.5 20.5M18.5 9.5l2 11M8.5 9.5 7.5 20.5M15.5 9.5l1 11M6 15h12"/></g>,
    offroad: <g><path d="M2.5 15.5V10l4-1L9.5 5.5h5L17.5 9l4 1v5.5"/><path d="M2.5 13h19"/><circle cx="7.5" cy="16.8" r="2.4"/><circle cx="16.5" cy="16.8" r="2.4"/></g>,
    tent: <g><path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 4v16M12 20l6-10"/></g>,
    dump: <g><path d="M12 2.5s2.2 2.7 2.2 4.3a2.2 2.2 0 0 1-4.4 0c0-1.6 2.2-4.3 2.2-4.3Z"/><rect x="3.5" y="10" width="17" height="9.5" rx="1.6"/><path d="M8 10v9.5M12 10v9.5M16 10v9.5"/></g>,
    // ── services ──
    water: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>,
    faucet: <g><rect x="2.5" y="6.5" width="7" height="4" rx="0.6"/><path d="M9.5 7.5H14A2.8 2.8 0 0 1 16.8 10.3V11.4"/><path d="M4.5 10.5v3h3v-3"/><path d="M16.8 17a1.6 1.6 0 0 1-3.2 0c0-1.3 1.6-3.1 1.6-3.1S16.8 15.7 16.8 17Z"/></g>,
    toilet: <g><rect x="6" y="3.5" width="3" height="5.5" rx="0.6"/><path d="M4.5 9h11.5a1 1 0 0 1 1 1 6.2 6.2 0 0 1-4.6 6L12 21.5H9l-.4-5.5A6.2 6.2 0 0 1 4 10a1 1 0 0 1 .5-1Z"/></g>,
    drain: <g><path d="M5 7h14M8 7v6a4 4 0 0 0 8 0V7"/><path d="M12 17v4M9 21h6"/></g>,
    greywater: <g><path d="M3.5 11.5V8.4A1.5 1.5 0 0 1 5 6.9h7l3.3 2.8h1.4A1.3 1.3 0 0 1 18 11v0.5"/><circle cx="7" cy="11.8" r="1.5"/><circle cx="14.5" cy="11.8" r="1.5"/><path d="M7 16v3M11 16v3.5M15 16v3"/></g>,
    trash: <g><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M10 11v6M14 11v6"/></g>,
    restroom: <g><circle cx="7.5" cy="4.5" r="1.9"/><path d="M7.5 7.3c-1.6 0-2.5 1-2.5 2.6L5.6 14H7l.4 7h0.9l.4-7h0.6l-.5-4.1C8.5 8.3 9.1 7.3 7.5 7.3Z"/><path d="M12 3v18"/><circle cx="16.5" cy="4.5" r="1.9"/><path d="M16.5 7.3c-1.7 0-2.7 1-3 2.7L12.7 14.3h1.7l.4 6.7h1.4l.4-6.7h1.7L17.5 10c-.3-1.7-.3-2.7-1-2.7Z"/></g>,
    shower: <g><path d="M6 12V6a3 3 0 0 1 6 0M12 6h6"/><path d="M3 12h18"/><path d="M7 16v2.5M11 16v3.5M15 16v2.5"/></g>,
    plug: <g><path d="M9 3v5M15 3v5"/><path d="M6 8h12v2a6 6 0 0 1-12 0V8Z"/><path d="M12 16v5"/></g>,
    wifi: <g><path d="M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></g>,
    pool: <g><path d="M7 3.5v9.5M11 3.5v9.5M7 7h4"/><path d="M3 16.5c1.4 0 1.4 1.4 2.8 1.4S7.2 16.5 8.6 16.5s1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4 1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4"/><path d="M3 20.5c1.4 0 1.4 1.4 2.8 1.4S7.2 20.5 8.6 20.5s1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4 1.4 1.4 2.8 1.4 1.4-1.4 2.8-1.4"/></g>,
    laundry: <g><rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M4 7.5h16"/><circle cx="7" cy="5" r="0.8" fill="currentColor" stroke="none"/><circle cx="9.6" cy="5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="5"/><circle cx="12" cy="14" r="2.1"/></g>,
    camperwash: <g><path d="M4 17.5V12.4A1.5 1.5 0 0 1 5.5 10.9H12l3.3 2.8h1.4A1.3 1.3 0 0 1 18 15v2.5"/><circle cx="7.5" cy="17.8" r="1.6"/><circle cx="15" cy="17.8" r="1.6"/><path d="M6 4.5v2.6M10 3.5v2.6M14 4.5v2.6M18 5.5v2.4"/></g>,
    signal: <g><path d="M4 20.5V17M9 20.5v-6.5M14 20.5V9.5M19 20.5V5"/></g>,
    pet: <g><circle cx="6" cy="10" r="1.6"/><circle cx="10.5" cy="6.5" r="1.6"/><circle cx="15.5" cy="6.5" r="1.6"/><circle cx="19" cy="11" r="1.6"/><path d="M8 16c0-2.5 2-4 4.5-4S17 13.5 17 16s-2 3-4.5 3S8 18.5 8 16Z"/></g>,
    parasol: <g><path d="M3.5 10a8.5 6 0 0 1 17 0Z"/><path d="M12 3.5v6.5M12 10v8M12 18a2.3 2.3 0 0 0 3 0"/></g>,
    shade: <g><circle cx="12" cy="8" r="3.5"/><path d="M12 1v1.5M12 13.5V15M19 8h-1.5M6.5 8H5M16.9 3.1l-1 1M8.1 11.9l-1 1M16.9 12.9l-1-1M8.1 4.1l-1-1"/><path d="M5 19h14M9 19c0-1.5 1.3-2 3-2s3 .5 3 2"/></g>,
    bread: <g><path d="M5 15.5 15.5 5a3 3 0 0 1 4.2 4.2L9.2 19.7a3 3 0 0 1-4.2-4.2Z"/><path d="M8.5 12l1.6 1.6M11.4 9.1l1.6 1.6M13.9 6.4 15.5 8"/></g>,
    view: <g><path d="M2 20l5-7 4 5 3-4 8 6"/><circle cx="17" cy="6" r="2.5"/></g>,
    // ── ui ──
    search: <g><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g>,
    filter: <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/>,
    map: <g><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></g>,
    list: <g><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none"/></g>,
    heart: <path d="M12 20s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z" fill={filled ? "currentColor" : "none"}/>,
    star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" fill={filled ? "currentColor" : "none"}/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
    back: <path d="M15 5l-7 7 7 7"/>,
    chevron: <path d="M9 5l7 7-7 7"/>,
    chevronDown: <path d="M5 9l7 7 7-7"/>,
    share: <g><circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.2 10.8 14.8 7.2M8.2 13.2l6.6 3.6"/></g>,
    navigate: <path d="M21 4 3 11l7 2.5L12.5 21 21 4Z"/>,
    moon: <path d="M20 13a8 8 0 1 1-9-9 6.5 6.5 0 0 0 9 9Z" fill={filled ? "currentColor" : "none"}/>,
    settings: <g><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13c.04-.33.06-.66.06-1s-.02-.67-.06-1l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1l-.36-2.5h-4l-.36 2.5a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6c-.04.33-.06.66-.06 1s.02.67.06 1l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1l.36 2.5h4l.36-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"/></g>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    gps: <g><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></g>,
    camera: <g><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"/><circle cx="12" cy="12.5" r="3.5"/></g>,
    image: <g><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m4 17 5-4 4 3 3-2 4 4"/></g>,
    check: <path d="M5 12.5 10 17.5 19 6.5"/>,
    edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4"/>,
    clock: <g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></g>,
    users: <g><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.5a3 3 0 0 1 0 5M21 20a5.5 5.5 0 0 0-4-5.3"/></g>,
    euro: <g><path d="M18 7a7 7 0 1 0 0 10"/><path d="M4 10h8M4 14h7"/></g>,
    info: <g><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/></g>,
    question: <g><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h0"/></g>,
    questionMark: <g><path d="M8.6 8.6a3.4 3.4 0 1 1 4.8 3.1c-1 .5-1.4 1.1-1.4 2.5"/><circle cx="12" cy="18.3" r="1.25" fill="currentColor" stroke="none"/></g>,
    sun: <g><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></g>,
    pin: <g><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></g>,
    route: <g><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5"/></g>,
    sliders: <g><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></g>,
    arrowUp: <path d="M12 19V6M6 11l6-6 6 6"/>,
    external: <g><path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></g>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" fill={filled ? "currentColor" : "none"}/>,
    leaf: <g><path d="M4 20C4 11 11 4 20 4c0 9-7 16-16 16Z"/><path d="M4 20C8 16 12 12 18 7"/></g>,
    refresh: <g><path d="M20 11a8 8 0 1 0-.5 4"/><path d="M20 4v5h-5"/></g>,
    globe: <g><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z"/></g>,
    calendar: <g><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></g>,
    chart: <g><path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="14" width="3" height="3" rx="1"/></g>,
    user: <g><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></g>,
    monitor: <g><rect x="3" y="4" width="18" height="13" rx="2.5"/><path d="M9 21h6M12 17v4"/></g>,
    brush: <g><path d="M15 4l5 5-8 8H7v-5l8-8Z"/><path d="M13.5 6.5l4 4"/></g>,
    database: <g><ellipse cx="12" cy="5.5" rx="7" ry="3"/><path d="M5 5.5v13c0 1.7 3.1 3 7 3s7-1.3 7-3v-13"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g>,
    save: <g><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 4v5h7M8 21v-6h8v6"/></g>,
    download: <g><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/></g>,
    upload: <g><path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 4h16"/></g>,
    eye: <g><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></g>,
    eyeOff: <g><path d="M3 3l18 18"/><path d="M10.6 6.2A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-3.2 3.9M6.2 7.4A18 18 0 0 0 2 12s4 7 10 7a9.8 9.8 0 0 0 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></g>,
    lock: <g><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none"/></g>,
    home: <g><path d="M4 11 12 4l8 7"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M10 20v-5h4v5"/></g>,
    car: <g><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 11h18v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Z"/><circle cx="7.5" cy="13.5" r="1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="13.5" r="1" fill="currentColor" stroke="none"/></g>,
    fuel: <g><rect x="4" y="4" width="9" height="16" rx="2"/><path d="M4 11h9"/><path d="M13 8h3a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-2.5-2.5"/></g>,
    shop: <g><path d="M4 9h16l-1 11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L4 9Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></g>,
    food: <g><path d="M6 3v8a2 2 0 0 0 4 0V3M8 3v18"/><path d="M16 3c-1.5 1-2 3-2 5s.5 3 2 3v10"/></g>,
    mountain: <path d="M3 19 9.5 8l3.5 5 2-3 4.5 9H3Z"/>,
    flag: <g><path d="M5 21V4"/><path d="M5 5h11l-2 3 2 3H5"/></g>,
    tag: <g><path d="M3 11V4h7l10 10-7 7L3 11Z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></g>,
    box: <g><path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/></g>,
    grip: <g><circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/></g>,
  };

  const glyph = glyphs[name] ?? glyphs.info;
  const scale = SCALE[name];

  return (
    <svg {...svgProps}>
      {scale ? (
        <g transform={`translate(12 12) scale(${scale}) translate(-12 -12)`}>
          {glyph}
        </g>
      ) : (
        glyph
      )}
    </svg>
  );
}
