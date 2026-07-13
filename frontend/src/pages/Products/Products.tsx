import React, { useState } from 'react';
import { Box, Button, Flex, HStack, TabsList, TabsRoot, TabsTrigger, Text } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/navigation/sidebar';
import { useColorMode } from '../../components/ui/color-mode';
import ProductsListTabContent from './ProductsListTabContent';
import CategoryListTabContent from './CategoryListTabContent';
import AddProductModal from './modal/AddProductModal';
import ImportProductsModal from './modal/ImportProductsModal';
import { useAppToast } from '../../hooks/useAppToast';
import Icon from '../../components/ui/Icon';

const Products = () => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const [activeTab, setActiveTab] = useState('products');
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { showToast } = useAppToast();
    const mainText = 'textMain';
    const subText = 'textSub';
    const borderColor = 'border';
    const cardBg = 'card';

    const handleAddProductSuccess = () => {
        setIsAddProductModalOpen(false);
        setRefreshKey(prev => prev + 1);
    };

    const handleImportSuccess = (count: number) => {
        setRefreshKey(prev => prev + 1);
        showToast({ title: `${count} ${t('products.imported_success', 'produits importés avec succès')}` });
    };

    return (
        <Sidebar>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Flex direction="column" gap="6">
                    <Flex justify="space-between" align="center" wrap="wrap" gap="4">
                        <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight">
                            {activeTab === 'products' ? t('products.title') : t('products.categories_title')}
                        </Text>
                        {activeTab === 'products' && (
                            <HStack gap="3">
                                <Button h="10" px="4" bg={cardBg} border="1px solid" borderColor={borderColor} color={mainText} _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50' }} borderRadius="lg" fontSize="sm" fontWeight="bold" onClick={() => setIsImportModalOpen(true)}>
                                    <Flex align="center" gap="2">
                                        <Icon name="upload" size={20} />
                                        <span>{t('products.import', 'Importer')}</span>
                                    </Flex>
                                </Button>
                                <Button h="10" px="4" bg="primary" color="white" _hover={{ bg: 'blue.600' }} borderRadius="lg" fontSize="sm" fontWeight="bold" boxShadow="sm" onClick={() => setIsAddProductModalOpen(true)}>
                                    <Flex align="center" gap="2">
                                        <Icon name="add" size={20} />
                                        <span>{t('products.add_product')}</span>
                                    </Flex>
                                </Button>
                            </HStack>
                        )}
                    </Flex>
                    <TabsRoot value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="line" colorPalette="blue">
                        <TabsList mb="4" borderBottom="1px solid" borderColor={borderColor}>
                            <TabsTrigger value="products" fontWeight="bold" color={subText} bg="transparent" _hover={{ color: mainText }} _selected={{ color: 'primary', borderColor: 'primary', bg: 'transparent' }} transition="color 0.2s">
                                {t('products.list_tab')}
                            </TabsTrigger>
                            <TabsTrigger value="categories" fontWeight="bold" color={subText} bg="transparent" _hover={{ color: mainText }} _selected={{ color: 'primary', borderColor: 'primary', bg: 'transparent' }} transition="color 0.2s">
                                {t('products.categories_tab')}
                            </TabsTrigger>
                        </TabsList>
                    </TabsRoot>
                    <Box position="relative" overflow="hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === 'products' && (
                                <motion.div
                                    key="products"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ProductsListTabContent key={`products-${refreshKey}`} />
                                </motion.div>
                            )}
                            {activeTab === 'categories' && (
                                <motion.div
                                    key="categories"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <CategoryListTabContent key={`categories-${refreshKey}`} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>
                    <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} onSuccess={handleAddProductSuccess} />
                    <ImportProductsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={handleImportSuccess} />
                </Flex>
            </motion.div>
        </Sidebar>
    );
};

export default Products;