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
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose}>
            <div className="p-6">
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
