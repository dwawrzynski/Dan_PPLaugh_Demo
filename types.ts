
export interface LaughEvent {
  id: string;
  timestamp: number;
}

export interface SessionStats {
  totalLaughs: number;
  currentBill: number;
  isMaxed: boolean;
}

declare global {
  interface Window {
    faceapi: any;
  }
}
