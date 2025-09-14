export interface TrinketViewProps {
  trinket: import('../CollectionView/types').TrinketData;
  backgroundColor?: string;
  showMetadata?: boolean;
  enableTouch?: boolean;
  enableKeyboard?: boolean;
  className?: string;
  onClose?: () => void;
}