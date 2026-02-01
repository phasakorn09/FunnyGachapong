
// 1. Mapping รูปภาพจาก assets
export const LocalImages: { [key: string]: any } = {
  normal: require('../assets/images/image.png'),
  strange: require('../assets/images/image.png'),
  lonely: require('../assets/images/image.png'),
  king: require('../assets/images/image.png'),
  god: require('../assets/images/image.png'),
};

// 2. โครงสร้างข้อมูลการ์ด
export interface CardItem {
  id: string;
  name: string;
  image: any;
}

export const CARD_DATABASE: { [key: string]: CardItem[] } = {
  'คนธรรมดา': [
    { id: 'n1', name: 'พนักงานออฟฟิศผู้มุ่งมั่น', image: LocalImages.normal },
    { id: 'n2', name: 'พ่อค้าตลาดนัด', image: LocalImages.normal },
  ],
  'คนแปลก': [
    { id: 's1', name: 'มนุษย์ต่างดาวหลงทาง', image: LocalImages.strange },
  ],
  'คนสันโดษ': [
    { id: 'l1', name: 'นักบวชผู้เงียบขรึม', image: LocalImages.lonely },
  ],
  'ราชา': [
    { id: 'k1', name: 'ราชาผู้ครองแผ่นดิน', image: LocalImages.king },
  ],
  'เทพเจ้า': [
    { id: 'g1', name: 'เทพเจ้าผู้สร้างโลก', image: LocalImages.god },
  ],
};