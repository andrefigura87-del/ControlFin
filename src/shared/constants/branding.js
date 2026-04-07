/**
 * ControlFin - shared/constants/branding.js
 * Centralização da identidade visual dos bancos.
 */

export const BANK_BRANDING = {
    'PagBank': 'bg-gradient-to-r from-[#F5DE3E] via-[#1BB99A] to-[#94CEE4] text-zinc-900 border-none shadow-xl shadow-[#1BB99A]/10',
    'Santander': 'bg-gradient-to-r from-[#EC0000] to-[#EA1D25] text-white border-none shadow-xl shadow-[#EC0000]/10',
    'Nubank': 'bg-gradient-to-r from-[#820AD1] to-[#61079D] text-white border-none shadow-xl shadow-[#820AD1]/10',
    'Bradesco': 'bg-gradient-to-r from-[#CC092F] to-[#FD0D3B] text-white border-none shadow-xl shadow-[#CC092F]/10',
    'Neon': 'bg-gradient-to-r from-[#00E5FF] to-[#00A7D3] text-zinc-900 border-none shadow-xl shadow-[#00E5FF]/10',
    'Itaú': 'bg-gradient-to-r from-[#EC7000] to-[#FF8C00] text-white border-none shadow-xl shadow-[#EC7000]/10'
  };
  
  export const getBrandStyle = (name) => {
    if (!name) return 'bg-zinc-800/50 border border-zinc-800/50 text-white';
    const key = Object.keys(BANK_BRANDING).find(k => name.toLowerCase().includes(k.toLowerCase()));
    return key ? BANK_BRANDING[key] : 'bg-zinc-800/50 border border-zinc-800/50 text-white';
  };
