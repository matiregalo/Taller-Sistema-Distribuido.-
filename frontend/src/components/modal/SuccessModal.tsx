import type { FC } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SuccessModal: FC<SuccessModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            className="text-center p-8"
        >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte Enviado!</h2>
            <p className="text-gray-500 mb-8">
                Hemos recibido tu reporte de incidente. Un técnico revisará tu caso pronto.
            </p>

            <Button 
                onClick={onClose} 
                fullWidth
            >
                Entendido
            </Button>
        </Modal>
    );
};

export default SuccessModal;
