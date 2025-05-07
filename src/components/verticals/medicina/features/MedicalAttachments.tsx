/**
 * frontend/src/components/verticals/medicina/features/MedicalAttachments.tsx
 * Componente para la gestión de documentos y archivos adjuntos a expedientes médicos.
 * Permite subir, visualizar y organizar estudios, radiografías, resultados de laboratorio y otros documentos.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Tipos de documentos médicos
 */
export type MedicalDocumentType = 
  'laboratory' | 
  'radiology' | 
  'prescription' | 
  'consent_form' | 
  'clinical_note' | 
  'referral' | 
  'discharge_summary' | 
  'vaccination' | 
  'other';

/**
 * Interfaz para documento/archivo médico
 */
export interface MedicalDocument {
  id: string;
  patientId: string;
  consultationId?: string;
  fileName: string;
  fileType: string; // Extensión o tipo MIME
  fileSize: number; // En bytes
  documentType: MedicalDocumentType;
  description?: string;
  tags?: string[];
  uploadDate: Date;
  uploadedBy: string;
  url: string;
  thumbnailUrl?: string;
  isArchived: boolean;
}

/**
 * Props para el componente MedicalAttachments
 */
interface MedicalAttachmentsProps {
  /** ID del paciente */
  patientId: string;
  /** ID de consulta específica (opcional) */
  consultationId?: string;
  /** Función para cargar documentos */
  loadDocuments?: (patientId: string, consultationId?: string) => Promise<MedicalDocument[]>;
  /** Función para subir documento */
  uploadDocument?: (file: File, metadata: {
    patientId: string,
    consultationId?: string,
    documentType: MedicalDocumentType,
    description?: string,
    tags?: string[]
  }) => Promise<MedicalDocument>;
  /** Función para eliminar documento */
  deleteDocument?: (documentId: string) => Promise<boolean>;
  /** Función para archivar documento */
  archiveDocument?: (documentId: string, archive: boolean) => Promise<boolean>;
  /** Modo de visualización */
  viewMode?: 'grid' | 'list';
  /** ID del usuario actual */
  currentUserId: string;
  /** Nombre del usuario actual */
  currentUserName: string;
  /** Solo lectura */
  readOnly?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente para la gestión de documentos médicos adjuntos
 */
export default function MedicalAttachments({
  patientId,
  consultationId,
  loadDocuments,
  uploadDocument,
  deleteDocument,
  archiveDocument,
  viewMode: initialViewMode = 'grid',
  currentUserId,
  currentUserName,
  readOnly = false,
  className = '',
}: MedicalAttachmentsProps) {
  // Estado para documentos médicos
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  
  // Estado para la carga de documentos
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para mensajes de error
  const [error, setError] = useState<string | null>(null);
  
  // Estado para modo de visualización
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  
  // Estado para filtro de tipo de documento
  const [typeFilter, setTypeFilter] = useState<MedicalDocumentType | 'all'>('all');
  
  // Estado para búsqueda de texto
  const [searchText, setSearchText] = useState<string>('');
  
  // Estado para incluir archivados
  const [showArchived, setShowArchived] = useState<boolean>(false);
  
  // Estado para documento seleccionado para vista previa
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocument | null>(null);
  
  // Estado para mostrar modal de vista previa
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Estado para nuevo documento
  const [newDocument, setNewDocument] = useState<{
    file: File | null,
    documentType: MedicalDocumentType,
    description: string,
    tags: string[]
  }>({
    file: null,
    documentType: 'laboratory',
    description: '',
    tags: []
  });
  
  // Estado para progreso de carga
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Estado para mostrar formulario de carga
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  
  // Estado para tag que se está editando
  const [currentTag, setCurrentTag] = useState<string>('');

  // Referencia para input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar documentos
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!patientId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (loadDocuments) {
          const docs = await loadDocuments(patientId, consultationId);
          setDocuments(docs);
        } else {
          // Datos de ejemplo para desarrollo
          setDocuments([
            {
              id: '1',
              patientId,
              fileName: 'hemograma-completo.pdf',
              fileType: 'application/pdf',
              fileSize: 1458000,
              documentType: 'laboratory',
              description: 'Resultados de hemograma completo',
              tags: ['sangre', 'laboratorio', 'urgente'],
              uploadDate: new Date(2025, 3, 15),
              uploadedBy: 'Dr. García',
              url: '/documents/hemograma-completo.pdf',
              thumbnailUrl: '/thumbnails/pdf-thumbnail.png',
              isArchived: false
            },
            {
              id: '2',
              patientId,
              fileName: 'radiografia-torax.jpg',
              fileType: 'image/jpeg',
              fileSize: 2540000,
              documentType: 'radiology',
              description: 'Radiografía de tórax AP y lateral',
              tags: ['radiografía', 'tórax', 'pulmones'],
              uploadDate: new Date(2025, 3, 10),
              uploadedBy: 'Dr. Martínez',
              url: '/documents/radiografia-torax.jpg',
              thumbnailUrl: '/documents/radiografia-torax.jpg',
              isArchived: false
            },
            {
              id: '3',
              patientId,
              consultationId: consultationId || '12345',
              fileName: 'consentimiento-informado.pdf',
              fileType: 'application/pdf',
              fileSize: 890000,
              documentType: 'consent_form',
              description: 'Consentimiento informado para procedimiento',
              tags: ['consentimiento', 'firmado'],
              uploadDate: new Date(2025, 3, 5),
              uploadedBy: 'Dra. López',
              url: '/documents/consentimiento-informado.pdf',
              thumbnailUrl: '/thumbnails/pdf-thumbnail.png',
              isArchived: true
            }
          ]);
        }
      } catch (err) {
        console.error('Error cargando documentos:', err);
        setError('No se pudieron cargar los documentos médicos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [patientId, consultationId, loadDocuments]);

  // Filtrar documentos según criterios
  const filteredDocuments = documents.filter(doc => {
    // Filtrar por archivo
    if (!showArchived && doc.isArchived) return false;
    
    // Filtrar por tipo
    if (typeFilter !== 'all' && doc.documentType !== typeFilter) return false;
    
    // Filtrar por texto de búsqueda
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        doc.fileName.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Abrir selector de archivo
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setNewDocument(prev => ({
        ...prev,
        file: files[0]
      }));
      setShowUploadForm(true);
    }
  };

  // Agregar tag
  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    
    setNewDocument(prev => ({
      ...prev,
      tags: [...prev.tags, currentTag.trim()]
    }));
    
    setCurrentTag('');
  };

  // Eliminar tag
  const handleRemoveTag = (index: number) => {
    setNewDocument(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Subir documento
  const handleUploadDocument = async () => {
    if (!newDocument.file || !patientId) return;
    
    setError(null);
    setUploadProgress(0);
    
    try {
      // Simulación de progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      let uploadedDoc: MedicalDocument;
      
      if (uploadDocument) {
        // Subir a través de API
        uploadedDoc = await uploadDocument(newDocument.file, {
          patientId,
          consultationId,
          documentType: newDocument.documentType,
          description: newDocument.description,
          tags: newDocument.tags
        });
      } else {
        // Simulación local
        uploadedDoc = {
          id: `temp-${Date.now()}`,
          patientId,
          consultationId,
          fileName: newDocument.file.name,
          fileType: newDocument.file.type,
          fileSize: newDocument.file.size,
          documentType: newDocument.documentType,
          description: newDocument.description,
          tags: newDocument.tags,
          uploadDate: new Date(),
          uploadedBy: currentUserName,
          url: URL.createObjectURL(newDocument.file),
          thumbnailUrl: newDocument.file.type.startsWith('image') 
            ? URL.createObjectURL(newDocument.file) 
            : '/thumbnails/generic-file.png',
          isArchived: false
        };
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Agregar a la lista
      setDocuments(prev => [uploadedDoc, ...prev]);
      
      // Reiniciar formulario
      setTimeout(() => {
        setNewDocument({
          file: null,
          documentType: 'laboratory',
          description: '',
          tags: []
        });
        setUploadProgress(0);
        setShowUploadForm(false);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      console.error('Error subiendo documento:', err);
      setError('No se pudo subir el documento. Por favor, intente nuevamente.');
      setUploadProgress(0);
    }
  };

  // Eliminar documento
  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('¿Está seguro de eliminar este documento? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      if (deleteDocument) {
        // Eliminar a través de API
        const success = await deleteDocument(documentId);
        if (success) {
          setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        }
      } else {
        // Simulación local
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }
    } catch (err) {
      console.error('Error eliminando documento:', err);
      setError('No se pudo eliminar el documento. Por favor, intente nuevamente.');
    }
  };

  // Archivar/desarchivar documento
  const handleToggleArchive = async (documentId: string, currentStatus: boolean) => {
    try {
      if (archiveDocument) {
        // Archivar a través de API
        const success = await archiveDocument(documentId, !currentStatus);
        if (success) {
          setDocuments(prev => prev.map(doc => 
            doc.id === documentId ? { ...doc, isArchived: !currentStatus } : doc
          ));
        }
      } else {
        // Simulación local
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId ? { ...doc, isArchived: !currentStatus } : doc
        ));
      }
    } catch (err) {
      console.error('Error archivando documento:', err);
      setError(`No se pudo ${currentStatus ? 'desarchivar' : 'archivar'} el documento. Por favor, intente nuevamente.`);
    }
  };

  // Abrir vista previa
  const handleOpenPreview = (document: MedicalDocument) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  // Cerrar vista previa
  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedDocument(null);
  };

  // Obtener texto para tipo de documento
  const getDocumentTypeText = (type: MedicalDocumentType) => {
    const typeMap: Record<MedicalDocumentType, string> = {
      laboratory: 'Laboratorio',
      radiology: 'Radiología/Imágenes',
      prescription: 'Receta',
      consent_form: 'Consentimiento',
      clinical_note: 'Nota Clínica',
      referral: 'Referencia',
      discharge_summary: 'Resumen de Alta',
      vaccination: 'Vacunación',
      other: 'Otro'
    };
    
    return typeMap[type] || type;
  };

  // Obtener icono para tipo de documento
  const getDocumentTypeIcon = (type: MedicalDocumentType) => {
    switch (type) {
      case 'laboratory':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'radiology':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'prescription':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'consent_form':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'clinical_note':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'referral':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'discharge_summary':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'vaccination':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  // Obtener icono para tipo de archivo
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('video/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('audio/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Renderizar vista de cuadrícula
  const renderGridView = () => {
    if (filteredDocuments.length === 0) {
      return (
        <div className="text-center p-6">
          <p className="text-gray-500 dark:text-gray-400">
            No hay documentos que coincidan con los criterios de búsqueda
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <div 
            key={doc.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border ${doc.isArchived ? 'border-gray-300 dark:border-gray-700 opacity-60' : 'border-transparent'}`}
          >
            <div className="relative h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {doc.thumbnailUrl ? (
                <img 
                  src={doc.thumbnailUrl} 
                  alt={doc.fileName}
                  className="w-full h-full object-cover"
                  onClick={() => handleOpenPreview(doc)}
                />
              ) : (
                <div className="text-gray-400 dark:text-gray-500">
                  {getFileTypeIcon(doc.fileType)}
                </div>
              )}
              
              {doc.isArchived && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                  <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-md">
                    Archivado
                  </span>
                </div>
              )}
              
              <button
                onClick={() => handleOpenPreview(doc)}
                className="absolute bottom-2 right-2 p-1 rounded-full bg-white dark:bg-gray-800 shadow hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Ver documento"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white truncate" title={doc.fileName}>
                  {doc.fileName}
                </h3>
                <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs">
                  {getDocumentTypeText(doc.documentType)}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatFileSize(doc.fileSize)}
              </p>
              
              {doc.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2" title={doc.description}>
                  {doc.description}
                </p>
              )}
              
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doc.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      +{doc.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(doc.uploadDate, { addSuffix: true, locale: es })}
                </div>
                
                {!readOnly && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleToggleArchive(doc.id, doc.isArchived)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={doc.isArchived ? "Desarchivar" : "Archivar"}
                    >
                      {doc.isArchived ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar vista de lista
  const renderListView = () => {
    if (filteredDocuments.length === 0) {
      return (
        <div className="text-center p-6">
          <p className="text-gray-500 dark:text-gray-400">
            No hay documentos que coincidan con los criterios de búsqueda
          </p>
        </div>
      );
    }
    
    return (
      <div className="overflow-hidden rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Documento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Subido
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tamaño
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Etiquetas
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {filteredDocuments.map((doc) => (
              <tr 
                key={doc.id}
                className={doc.isArchived ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      {getFileTypeIcon(doc.fileType)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs" title={doc.fileName}>
                        {doc.fileName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={doc.description || ""}>
                        {doc.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400 mr-2">
                      {getDocumentTypeIcon(doc.documentType)}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {getDocumentTypeText(doc.documentType)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {doc.uploadedBy}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(doc.fileSize)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags?.slice(0, 2).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {doc.tags && doc.tags.length > 2 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        +{doc.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleOpenPreview(doc)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      Ver
                    </button>
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => handleToggleArchive(doc.id, doc.isArchived)}
                          className={doc.isArchived 
                            ? "text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300" 
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          }
                        >
                          {doc.isArchived ? "Desarchivar" : "Archivar"}
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Encabezado */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documentos Médicos
        </h2>
        
        {!readOnly && (
          <button
            onClick={handleClickUpload}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir Documento
          </button>
        )}
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-1/3">
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="sm:w-1/3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MedicalDocumentType | 'all')}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="laboratory">Laboratorio</option>
              <option value="radiology">Radiología/Imágenes</option>
              <option value="prescription">Recetas</option>
              <option value="consent_form">Consentimientos</option>
              <option value="clinical_note">Notas Clínicas</option>
              <option value="referral">Referencias</option>
              <option value="discharge_summary">Resumenes de Alta</option>
              <option value="vaccination">Vacunación</option>
              <option value="other">Otros</option>
            </select>
          </div>
          
          <div className="sm:w-1/3 flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="showArchived"
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showArchived" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Mostrar archivados
              </label>
            </div>
            
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
                title="Vista de cuadrícula"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
                title="Vista de lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mensajes de error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Formulario de carga */}
      {showUploadForm && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <h3 className="text-md font-medium text-blue-900 dark:text-blue-400 mb-3">
            Subir Nuevo Documento
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="mr-2 text-gray-700 dark:text-gray-300">
                Archivo:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {newDocument.file?.name} ({formatFileSize(newDocument.file?.size || 0)})
              </span>
            </div>
            
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Documento
              </label>
              <select
                id="documentType"
                value={newDocument.documentType}
                onChange={(e) => setNewDocument(prev => ({ ...prev, documentType: e.target.value as MedicalDocumentType }))} 
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="laboratory">Laboratorio</option>
                <option value="radiology">Radiología/Imágenes</option>
                <option value="prescription">Receta</option>
                <option value="consent_form">Consentimiento</option>
                <option value="clinical_note">Nota Clínica</option>
                <option value="referral">Referencia</option>
                <option value="discharge_summary">Resumen de Alta</option>
                <option value="vaccination">Vacunación</option>
                <option value="other">Otro</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                value={newDocument.description}
                onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Describe brevemente el contenido del documento"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Etiquetas
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  className="block w-full rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Agregar etiqueta"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!currentTag.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              
              {newDocument.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newDocument.tags.map((tag, index) => (
                    <div 
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded flex items-center"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {uploadProgress > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {uploadProgress}%
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-blue-200 dark:border-blue-800">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setNewDocument({
                    file: null,
                    documentType: 'laboratory',
                    description: '',
                    tags: []
                  });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUploadDocument}
                disabled={!newDocument.file}
                className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Subir Documento
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido principal */}
      <div className="p-4 bg-white dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          viewMode === 'grid' ? renderGridView() : renderListView()
        )}
      </div>
      
      {/* Paginación (si es necesario) */}
      {filteredDocuments.length > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando <span className="font-medium">{filteredDocuments.length}</span> documentos
          </p>
        </div>
      )}
      
      {/* Input de archivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.csv,.dicom"
        className="hidden"
      />
      
      {/* Modal de vista previa */}
      {showPreview && selectedDocument && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {selectedDocument.fileName}
                    </h3>
                    
                    <div className="mt-4">
                      {/* Vista previa basada en tipo de archivo */}
                      {selectedDocument.fileType.startsWith('image/') ? (
                        <div className="flex justify-center">
                          <img 
                            src={selectedDocument.url} 
                            alt={selectedDocument.fileName}
                            className="max-h-96 object-contain"
                          />
                        </div>
                      ) : selectedDocument.fileType === 'application/pdf' ? (
                        <div className="h-96 border border-gray-300 dark:border-gray-700 rounded-md">
                          <iframe 
                            src={selectedDocument.url} 
                            title={selectedDocument.fileName}
                            className="w-full h-full"
                          ></iframe>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-md">
                          <div className="text-gray-400 dark:text-gray-500 mb-4">
                            {getFileTypeIcon(selectedDocument.fileType)}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No hay vista previa disponible para este tipo de archivo
                          </p>
                          <a 
                            href={selectedDocument.url} 
                            download={selectedDocument.fileName} 
                            className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Descargar Archivo
                          </a>
                        </div>
                      )}
                      
                      {/* Detalles del documento */}
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Tipo de documento
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                              {getDocumentTypeText(selectedDocument.documentType)}
                            </dd>
                          </div>
                          
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Tamaño
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                              {formatFileSize(selectedDocument.fileSize)}
                            </dd>
                          </div>
                          
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Fecha de carga
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                              {new Date(selectedDocument.uploadDate).toLocaleDateString()} {new Date(selectedDocument.uploadDate).toLocaleTimeString()}
                            </dd>
                          </div>
                          
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Subido por
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                              {selectedDocument.uploadedBy}
                            </dd>
                          </div>
                          
                          {selectedDocument.description && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Descripción
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                {selectedDocument.description}
                              </dd>
                            </div>
                          )}
                          
                          {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Etiquetas
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                <div className="flex flex-wrap gap-2">
                                  {selectedDocument.tags.map((tag, index) => (
                                    <span 
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <a
                  href={selectedDocument.url}
                  download={selectedDocument.fileName}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}