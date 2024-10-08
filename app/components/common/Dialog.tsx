import { Button, Dialog, DialogPanel, Divider } from "@tremor/react";
import React, { ReactNode, createContext, useContext } from "react";
import DialogClose from "./DialogClose";

type ConfirmationDialogProps = DialogConfig & {
  open: boolean
  onConfirm: (...args: any) => Promise<any>
  onDismiss: (...args: any) => Promise<any>
}

export default function ConfirmationDialog({
  open,
  title,
  content,
  showActionButtons = true,
  confirmButton,
  dismissButton,
  onConfirm,
  onDismiss,
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onDismiss}
    >
      <DialogPanel className="overflow-visible">
        <DialogClose onClick={onDismiss} />
        <div className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-extrabold text-xl">
          {title}
        </div>

        <Divider />

        {content}

        {showActionButtons && <>
          <Divider />
          <div className="flex justify-end space-x-3">
            {dismissButton ??
              <Button
                variant="secondary"
                onClick={onDismiss}
              >
                Cancel
              </Button>
            }
            {confirmButton ??
              <Button
                onClick={onConfirm}
              >
                Confirm
              </Button>
            }
          </div>
        </>}
      </DialogPanel>
    </Dialog>
  )
}

interface ConfirmationDialogContextProps {
  openDialog: (config: DialogConfig) => void
  closeDialog: () => void
  state?: any
  setState?: React.Dispatch<React.SetStateAction<any>>
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContextProps>({
  openDialog: () => { },
  closeDialog: () => { },
});

interface ConfirmationDialogProviderProps {
  children: ReactNode
}

interface ActionCallbackArgs {
  result: boolean
  state?: any | null
}

interface DialogConfig {
  title?: ReactNode
  content?: ReactNode
  showActionButtons?: boolean
  confirmButton?: ReactNode
  dismissButton?: ReactNode
  onConfirm?: (...args: any) => Promise<any>
  onDismiss?: (...args: any) => Promise<any>
  actionCallback?: (args: ActionCallbackArgs) => void
}

export function ConfirmationDialogProvider({ children }: ConfirmationDialogProviderProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState<DialogConfig>({});
  const [state, setState] = React.useState(null)

  const openDialog = (config: DialogConfig) => {
    setDialogOpen(true);
    setDialogConfig(config);
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setDialogConfig({});
  };

  const onConfirm = async () => {
    resetDialog();
    const res = dialogConfig.onConfirm ? await dialogConfig.onConfirm() : true

    if (dialogConfig.actionCallback) dialogConfig.actionCallback({ result: res, state: state });
    setState(null)
  };

  const onDismiss = async () => {
    resetDialog();
    const res = dialogConfig.onDismiss ? await dialogConfig.onDismiss() : false
    if (dialogConfig.actionCallback) dialogConfig.actionCallback({ result: res });
    setState(null)
  };

  return (
    <ConfirmationDialogContext.Provider
      value={{
        openDialog,
        closeDialog: resetDialog,
        state: state,
        setState: setState
      }}
    >
      <ConfirmationDialog
        open={dialogOpen}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
        {...dialogConfig}
      />
      {children}
    </ConfirmationDialogContext.Provider>
  );
};


export function useConfirmationDialog(defaultConfig?: DialogConfig) {
  const {
    openDialog,
    closeDialog,
    state,
    setState
  } = useContext(ConfirmationDialogContext)

  const getConfirmation = (config?: DialogConfig) => {
    return new Promise((res) => {
      openDialog({ actionCallback: res, ...defaultConfig, ...config })
    })
  }

  return { getConfirmation, closeDialog, state, setState }
}


