// Original inline vector signals: identical silhouettes on every device.
const eyes='<circle cx="24" cy="28" r="3" fill="#24192b"/><circle cx="40" cy="28" r="3" fill="#24192b"/>';
const art={
'😀':'<circle cx="32" cy="32" r="25" fill="#ffd37e"/><path d="M17 36Q32 57 47 36Z" fill="#422834"/><path d="M21 37H43L39 42H25Z" fill="#fff6db"/>'+eyes,
'😎':'<circle cx="32" cy="32" r="25" fill="#7ce4d1"/><path d="M11 23H29L28 35Q21 41 15 33ZM35 23H53L49 34Q41 41 36 34Z" fill="#242340"/><path d="M28 27H37" stroke="#242340" stroke-width="4"/><path d="M24 44Q33 49 41 42" fill="none" stroke="#244947" stroke-width="3" stroke-linecap="round"/>',
'🤖':'<path d="M32 5V14" stroke="#b5c7fa" stroke-width="4"/><circle cx="32" cy="6" r="4" fill="#ff8daa"/><rect x="5" y="26" width="54" height="20" rx="5" fill="#788bce"/><rect x="11" y="14" width="42" height="42" rx="10" fill="#a7baf9"/><rect x="17" y="22" width="30" height="15" rx="5" fill="#242a49"/><circle cx="24" cy="29" r="3" fill="#8ffff0"/><circle cx="40" cy="29" r="3" fill="#8ffff0"/><path d="M22 46H42M28 42V50M36 42V50" stroke="#485885" stroke-width="3"/>',
'👾':'<path d="M19 10L25 16H39L45 10M16 19H48V26H55V45H48V54H39V46H25V54H16V45H9V26H16Z" fill="#cf9cff" stroke="#cf9cff" stroke-width="3" stroke-linejoin="round"/><path d="M19 29H27V37H19ZM37 29H45V37H37Z" fill="#372449"/>',
'💀':'<path d="M10 29C10 0 54 0 54 29V40L44 45V56H20V45L10 40Z" fill="#f4e5ec"/><ellipse cx="23" cy="30" rx="7" ry="8" fill="#49394f"/><ellipse cx="41" cy="30" rx="7" ry="8" fill="#49394f"/><path d="M32 37L27 44H37ZM26 49V56M37 49V56" fill="#49394f" stroke="#49394f" stroke-width="2"/>',
'🔥':'<path d="M35 3C45 23 59 25 54 43C50 60 13 62 9 42C6 30 17 17 23 14C20 31 30 27 35 3Z" fill="#ff9177"/><path d="M33 25C32 39 45 38 42 49C40 59 22 57 20 48C17 40 29 33 33 25Z" fill="#ffe49b"/>'
};
export function signal(face){return `<svg viewBox="0 0 64 64" aria-hidden="true">${art[face]}</svg>`}
