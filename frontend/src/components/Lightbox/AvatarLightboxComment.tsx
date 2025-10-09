import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface AvatarLightboxPropsComment {
  open: boolean;
  onClose: () => void;
  avatarUrl: string;
}

export const AvatarLightboxComment: React.FC<AvatarLightboxPropsComment> = ({
  open,
  onClose,
  avatarUrl
}) => {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={[{ src: avatarUrl }]}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
      }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
};