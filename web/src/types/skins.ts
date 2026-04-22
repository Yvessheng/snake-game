export const SKINS = [
  { id: 'classic', name: '经典霓虹', head: '#00FF88', body: '#00CC6A', glow: 'rgba(0, 255, 136, 0.8)' },
  { id: 'neon', name: '赛博霓虹', head: '#00D4FF', body: '#0099CC', glow: 'rgba(0, 212, 255, 0.8)' },
  { id: 'pixel', name: '像素', head: '#FFD600', body: '#CCAA00', glow: 'rgba(255, 214, 0, 0.8)' },
  { id: 'gradient', name: '渐变紫', head: '#B44AFF', body: '#8833CC', glow: 'rgba(180, 74, 255, 0.8)' },
  { id: 'flame', name: '火焰', head: '#FF6B00', body: '#CC5500', glow: 'rgba(255, 107, 0, 0.8)' },
] as const;

export type SkinId = (typeof SKINS)[number]['id'];

export function getSkin(id: SkinId) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function saveSkin(id: SkinId) {
  localStorage.setItem('snake_skin', id);
}

export function loadSkin(): SkinId {
  return (localStorage.getItem('snake_skin') as SkinId) || 'classic';
}
