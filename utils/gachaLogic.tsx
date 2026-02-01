export const RARITIES = {
  NORMAL: { label: 'คนธรรมดา', chance: 50, color: '#808080', rank: 1 },
  STRANGE: { label: 'คนแปลก', chance: 25, color: '#4CAF50', rank: 2 },
  LONELY: { label: 'คนสันโดษ', chance: 15, color: '#2196F3', rank: 3 },
  KING: { label: 'ราชา', chance: 8, color: '#9C27B0', rank: 4 },
  GOD: { label: 'เทพเจ้า', chance: 2, color: '#FFD700', rank: 5 },
};

export const rollGacha = (isBoosted: boolean) => {
  // ถ้าอยู่ในระยะ 100 เมตร (isBoosted) จะเพิ่มโอกาสระดับ "เทพเจ้า" เป็น 10%
  const roll = Math.random() * 100;
  const godChance = isBoosted ? 10 : 2; 
  
  if (roll <= godChance) return RARITIES.GOD;
  if (roll <= 10 + 8) return RARITIES.KING; // ปรับ logic ตามความเหมาะสม
  if (roll <= 30) return RARITIES.LONELY;
  if (roll <= 60) return RARITIES.STRANGE;
  return RARITIES.NORMAL;
};