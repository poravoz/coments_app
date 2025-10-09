import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface AvatarLightboxPropsNavBar {
  open: boolean;
  onClose: () => void;
  avatarUrl: string;
  onUpdateClick: () => void;
}

export const AvatarLightboxNavBar: React.FC<AvatarLightboxPropsNavBar> = ({
  open,
  onClose,
  avatarUrl,
  onUpdateClick
}) => {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={[{ src: avatarUrl }]}
      plugins={[]}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
        buttonClose: undefined,
      }}
      toolbar={{
        buttons: [
          <button key="update" className="yarl__button" onClick={onUpdateClick}>
            Update Avatar
          </button>,
          "close",
        ],
      }}
    />
  );
};