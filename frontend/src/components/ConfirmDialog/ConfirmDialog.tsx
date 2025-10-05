import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Slide, SlideProps } from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const Transition = React.forwardRef(function Transition(
  props: SlideProps & { children: React.ReactElement },
  ref: React.Ref<HTMLDivElement>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this comment?"
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      slots={{ transition: Transition }}
      slotProps={{ paper: { sx: { bgcolor: "#1a1a1a", color: "#fff" } } }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "#fff" }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>No</Button>
        <Button onClick={onConfirm} color="error">Yes</Button>
      </DialogActions>
    </Dialog>
  );
};
