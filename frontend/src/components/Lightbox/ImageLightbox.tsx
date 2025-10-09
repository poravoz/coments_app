import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  currentIndex?: number;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  open,
  onClose,
  images,
  currentIndex = 0
}) => {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={images.map(src => ({ src }))}
      index={currentIndex}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
      }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
};