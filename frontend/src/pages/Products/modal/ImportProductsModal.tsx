import React, { useState } from 'react';
import {
    Button,
    Dialog,
    VStack,
    Text,
    Box,
    Flex,
    Spinner,
    Portal,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { useColorMode } from '../../../components/ui/color-mode';

interface ImportProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (count: number) => void;
}

const PRODUCT_NAME_COLUMNS = ['PRODUCT NAME', 'Product Name', 'product name', 'NOM DU PRODUIT', 'Nom du produit'];
const CATEGORY_COLUMNS = ['CATEGORY', 'Category', 'category', 'CATEGORIE', 'Catégorie'];
const PRICE_COLUMNS = ['PRICE', 'Price', 'price', 'PRIX', 'Prix', 'prix'];
const STOCK_COLUMNS = ['STOCK', 'Stock', 'stock'];
const MIN_STOCK_COLUMNS = ['Min STOCK Treshold', 'Min Stock Threshold', 'MIN STOCK TRESHOLD', 'Min Stock Treshold'];

const getRowValue = (row: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
        if (key in row && row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
        }
    }
    return undefined;
};

const toNumericValue = (value: unknown, fallback = 0) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toIntegerValue = (value: unknown, fallback = 0) => {
    const numeric = toNumericValue(value, fallback);
    return Math.max(0, Math.floor(numeric));
};

const ImportProductsModal = ({ isOpen, onClose, onSuccess }: ImportProductsModalProps) => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<{ created: number; errors: string[] } | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const borderColor = 'border';
    const cardBg = 'card';
    const subText = 'textSub';
    const mainText = 'textMain';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);
        setError(null);
        setResults(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                const formattedData = jsonData.map((row) => {
                    const r = row as Record<string, unknown>;
                    return {
                        name: getRowValue(r, PRODUCT_NAME_COLUMNS) as string,
                        categoryName: getRowValue(r, CATEGORY_COLUMNS) as string,
                        price: toNumericValue(getRowValue(r, PRICE_COLUMNS)),
                        stockQuantity: toIntegerValue(getRowValue(r, STOCK_COLUMNS)),
                        minStockThreshold: toIntegerValue(getRowValue(r, MIN_STOCK_COLUMNS)),
                    };
                });

                const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
                const response = await fetch('http://localhost:3005/api/v1/products/bulk', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(formattedData),
                });

                if (response.ok) {
                    const res = await response.json();
                    setResults(res);
                    if (res.created > 0) {
                        onSuccess(res.created);
                        onClose();
                    }
                } else {
                    setError(t('products.import_error', 'Erreur lors de l’importation'));
                }
            } catch (err) {
                console.error(err);
                setError(t('products.invalid_file', 'Fichier invalide ou mal formaté'));
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor}>
                        <Dialog.Header>
                            <Dialog.Title fontSize="xl" fontWeight="bold">
                                {t('products.import_title', 'Importer des produits')}
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger />
                        <Dialog.Body>
                            <VStack gap="6" align="stretch" py="4">
                                <Box border="2px dashed" borderColor={borderColor} borderRadius="xl" p="10" textAlign="center" transition="all 0.2s" _hover={{ borderColor: 'primary', bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50' }} cursor="pointer" position="relative" >
                                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                    <VStack gap="2">
                                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'gray' }}>
                                            upload_file
                                        </span>
                                        <Text fontWeight="medium" color={mainText}>{fileName || t('products.import_drag_drop', 'Cliquez ou glissez un fichier Excel ici')}</Text>
                                        <Text fontSize="xs" color={subText}>
                                            Colonnes requises: PRODUCT NAME, CATEGORY, PRICE, STOCK, Min STOCK Treshold
                                        </Text>
                                    </VStack>
                                </Box>

                                {loading && (
                                    <Flex justify="center" align="center" gap="3">
                                        <Spinner size="sm" color="primary" />
                                        <Text fontSize="sm" color={mainText}>{t('common.processing', 'Traitement en cours...')}</Text>
                                    </Flex>
                                )}

                                {error && (
                                    <Box p="4" bg="red.900/10" border="1px solid" borderColor="red.500/50" borderRadius="lg">
                                        <Text color="red.500" fontSize="sm">{error}</Text>
                                    </Box>
                                )}

                                {results && results.errors.length > 0 && (
                                    <VStack align="stretch" gap="3">
                                        <Box maxH="200px" overflowY="auto" p="4" bg="orange.900/10" border="1px solid" borderColor="orange.500/50" borderRadius="lg">
                                            <Text color="orange.500" fontSize="sm" fontWeight="bold" mb="2">
                                                {t('products.import_warnings', 'Avertissements / Erreurs :')}
                                            </Text>
                                            <VStack align="stretch" gap="1">
                                                {results.errors.map((err, i) => (
                                                    <Text key={i} color="orange.400" fontSize="xs">• {err}</Text>
                                                ))}
                                            </VStack>
                                        </Box>
                                    </VStack>
                                )}
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer mt="4" gap="3">
                            <Button variant="outline" onClick={onClose} borderRadius="lg" borderColor={borderColor} color={mainText} _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50' }}>
                                {t('common.close', 'Fermer')}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default ImportProductsModal;
