export interface CategoryAccent {
  text: string;
  topBorder: string;
  softBg: string;
  activeTab: string;
  activeButton: string;
  hoverText: string;
}

const CATEGORY_ACCENTS: readonly CategoryAccent[] = [
  {
    text: 'text-[#EA580C]',
    topBorder: 'border-t-[#EA580C]',
    softBg: 'bg-[#FFF7ED]',
    activeTab: 'border-[#EA580C] text-[#EA580C]',
    activeButton: 'border-[#EA580C] bg-[#EA580C] text-white',
    hoverText: 'group-hover:text-[#EA580C]',
  },
  {
    text: 'text-[#1D4ED8]',
    topBorder: 'border-t-[#1D4ED8]',
    softBg: 'bg-[#EFF6FF]',
    activeTab: 'border-[#1D4ED8] text-[#1D4ED8]',
    activeButton: 'border-[#1D4ED8] bg-[#1D4ED8] text-white',
    hoverText: 'group-hover:text-[#1D4ED8]',
  },
  {
    text: 'text-[#047857]',
    topBorder: 'border-t-[#047857]',
    softBg: 'bg-[#ECFDF5]',
    activeTab: 'border-[#047857] text-[#047857]',
    activeButton: 'border-[#047857] bg-[#047857] text-white',
    hoverText: 'group-hover:text-[#047857]',
  },
  {
    text: 'text-[#DC2626]',
    topBorder: 'border-t-[#DC2626]',
    softBg: 'bg-[#FEF2F2]',
    activeTab: 'border-[#DC2626] text-[#DC2626]',
    activeButton: 'border-[#DC2626] bg-[#DC2626] text-white',
    hoverText: 'group-hover:text-[#DC2626]',
  },
  {
    text: 'text-[#111110]',
    topBorder: 'border-t-[#111110]',
    softBg: 'bg-[#F4F4F1]',
    activeTab: 'border-[#111110] text-[#111110]',
    activeButton: 'border-[#111110] bg-[#111110] text-white',
    hoverText: 'group-hover:text-[#EA580C]',
  },
  {
    text: 'text-[#0284C7]',
    topBorder: 'border-t-[#0284C7]',
    softBg: 'bg-[#F0F9FF]',
    activeTab: 'border-[#0284C7] text-[#0284C7]',
    activeButton: 'border-[#0284C7] bg-[#0284C7] text-white',
    hoverText: 'group-hover:text-[#0284C7]',
  },
];

export function getCategoryAccent(key: string | number | undefined): CategoryAccent {
  if (typeof key === 'number') {
    const safeIndex = Number.isFinite(key) ? Math.abs(Math.trunc(key)) : 0;
    return CATEGORY_ACCENTS[safeIndex % CATEGORY_ACCENTS.length];
  }
  if (!key) {
    return CATEGORY_ACCENTS[4];
  }
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return CATEGORY_ACCENTS[Math.abs(hash) % CATEGORY_ACCENTS.length];
}
