import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface VideoLightboxProps {
  open: boolean;
  onClose: () => void;
  videos: string[];
  currentIndex?: number;
}

export const VideoLightbox: React.FC<VideoLightboxProps> = ({
  open,
  onClose,
  videos,
  currentIndex = 0
}) => {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={videos.map(src => ({ src }))}
      index={currentIndex}
      render={{
        slide: ({ slide }) => (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '20px'
          }}>
            <video
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                borderRadius: '10px',
                outline: 'none'
              }}
            >
              <source src={slide.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ),
        buttonPrev: () => null,
        buttonNext: () => null,
      }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
};