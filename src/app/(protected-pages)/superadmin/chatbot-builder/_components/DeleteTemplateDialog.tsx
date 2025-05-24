import React from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'

interface DeleteTemplateDialogProps {
    isOpen: boolean
    onClose: () => void
    onDelete: () => void
}

const DeleteTemplateDialog: React.FC<DeleteTemplateDialogProps> = ({
    isOpen,
    onClose,
    onDelete,
}) => {
    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            onRequestClose={onClose}
            overlayClassName="!z-[9999]"
            className="!z-[10000]"
            style={{
                overlay: {
                    zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)'
                },
                content: {
                    zIndex: 10000
                }
            }}
        >
            <div className="p-6 relative z-[10001]">
                <p className="mb-6">
                    ¿Está seguro de que desea eliminar esta plantilla? Esta
                    acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="default" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        color="red"
                        onClick={onDelete}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default DeleteTemplateDialog
