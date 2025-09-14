export interface TrinketData {
  id?: string;
  modelPath: string;
  title: string;
  note: string;
  creatorName: string;
  dateCreated: Date;
  color?: string;
  location?: string;
}

export interface CollectionViewProps {
  trinkets: TrinketData[];
  backgroundColor?: string;
  showMetadata?: boolean;
  enableTouch?: boolean;
  enableKeyboard?: boolean;
  className?: string;
  onTrinketFocus?: (trinket: TrinketData | null, index: number) => void;
}

export interface TrinketInfoPanelProps {
  trinket: TrinketData | null;
  isVisible: boolean;
  onClose?: () => void;
}

export interface ResponsiveControlsProps {
  currentIndex: number;
  totalViews: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  currentTrinket?: ProcessedTrinket | null;
  showMetadata?: boolean;
}

export interface ProcessedTrinket extends TrinketData {
  id: string;
  color: string;
}