import { motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Flex, Text, Button, Input, Stack, TableBody, TableCell, TableColumnHeader, TableHeader, TableRoot, TableRow, Badge, InputGroup, SimpleGrid, HStack, IconButton, Spinner, Center } from '@chakra-ui/react';
import Sidebar from '../../components/navigation/sidebar';
import { useColorMode } from '../../components/ui/color-mode';
import { useTranslation } from 'react-i18next';
import Icon from '../../components/ui/Icon';

const Stock = () => {
    const { colorMode } = useColorMode();
    const { t } = useTranslation();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0 });
    const limit = 5;

    const mainText = "textMain";
    const subText = "textSub";
    const borderColor = "border";
    const cardBg = "card";
    const bg = "background";
    const hoverRowBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50';

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await fetch('http://localhost:3005/api/v1/products/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stock stats:', error);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const url = new URL('http://localhost:3005/api/v1/products');
            if (debouncedSearchTerm) url.searchParams.append('search', debouncedSearchTerm);
            url.searchParams.append('page', currentPage.toString());
            url.searchParams.append('limit', limit.toString());

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data.items || []);
                setTotalItems(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / limit));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, currentPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchProducts();
        fetchStats();
    }, [fetchProducts, fetchStats]);

    const handleStockUpdate = async (productId: string, type: 'ENTRY' | 'EXIT', quantity: number) => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await fetch('http://localhost:3005/api/v1/stock/movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId,
                    type,
                    quantity,
                    reason: type === 'ENTRY' ? t('stock.reasons.manual_restock') : t('stock.reasons.manual_exit')
                })
            });

            if (response.ok) {
                fetchProducts();
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    };

    const getStatusInfo = (product: any) => {
        const quantity = product.stockQuantity;
        const threshold = product.minStockThreshold;

        if (quantity <= 0) {
            return { label: t('stock.status.out_of_stock'), color: 'red', icon: 'close', dotColor: 'red.500', isLow: true };
        }
        if (quantity <= threshold) {
            return { label: t('stock.status.low_stock'), color: 'orange', icon: 'warning', dotColor: 'orange.500', isLow: true };
        }
        return { label: t('stock.status.in_stock'), color: 'green', icon: 'check', dotColor: 'green.500', isLow: false };
    };

    const statsCards = [
        {
            title: t('stock.stats.total_products'),
            value: stats.total.toString(),
            badge: "+5%",
            badgeColor: "green",
            icon: "inventory_2",
            iconBg: "blue.100",
            iconBgDark: "blue.800",
        },
        {
            title: t('stock.stats.low_stock_alert'),
            value: stats.lowStock.toString(),
            subtitle: t('stock.stats.requires_attention'),
            subtitleColor: "orange",
            icon: "warning",
            iconBg: "orange.100",
            iconBgDark: "orange.800",
        },
        {
            title: t('stock.stats.out_of_stock'),
            value: stats.outOfStock.toString(),
            subtitle: t('stock.stats.critical'),
            subtitleColor: "red",
            icon: "error",
            iconBg: "red.100",
            iconBgDark: "red.800",
        },
    ];

    return (
        <Sidebar>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Flex direction="column" gap="6">
                    {/* En-tête */}
                    <Flex direction={{ base: "column", md: "row" }} align={{ base: "flex-start", md: "center" }} justify="space-between" gap="4">
                        <Stack gap="1">
                            <Text color={mainText} fontSize="3xl" fontWeight="900" letterSpacing="tight">
                                {t('stock.title')}
                            </Text>
                            <Text color={subText} fontSize="md">
                                {t('stock.subtitle')}
                            </Text>
                        </Stack>
                    </Flex>

                    {/* Cartes de statistiques */}
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                        {statsCards.map((card, index) => (
                            <Box key={index} p="5" bg={cardBg} borderRadius="xl" border="1px" borderColor={borderColor} shadow="sm">
                                <Flex justify="space-between" align="center" mb="2">
                                    <Text color={subText} fontSize="xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">{card.title}</Text>
                                    <Box p="1.5" bg={card.iconBg} _dark={{ bg: card.iconBgDark }} color={card.subtitleColor ? `${card.subtitleColor}.500` : "primary"} borderRadius="lg">
                                        <Icon name={card.icon} size={20} />
                                    </Box>
                                </Flex>
                                <Flex align="flex-end" gap="2">
                                    <Text color={mainText} fontSize="3xl" fontWeight="bold">{card.value}</Text>
                                    {card.badge && (
                                        <Badge bg={`${card.badgeColor}.50`} _dark={{ bg: `${card.badgeColor}.900/20`, color: `${card.badgeColor}.400` }} color={`${card.badgeColor}.600`} px="1.5" py="0.5" mb="1" display="flex" alignItems="center">
                                            <Icon name="trending_up" size={16} />
                                            {card.badge}
                                        </Badge>
                                    )}
                                    {card.subtitle && (
                                        <Text color={`${card.subtitleColor}.600`} _dark={{ color: `${card.subtitleColor}.400` }} fontSize="sm" fontWeight="medium" mb="1">{card.subtitle}</Text>
                                    )}
                                </Flex>
                            </Box>
                        ))}
                    </SimpleGrid>

                    {/* Barre de filtres */}
                    <Flex direction={{ base: "column", lg: "row" }} gap="4" align={{ lg: "center" }} justify="space-between" bg={cardBg} p="4" borderRadius="xl" border="1px" borderColor={borderColor} shadow="sm">
                        <Box flex="1" maxW={{ lg: "lg" }} w="full">
                            <InputGroup w="full" startElement={<Icon name="search" size={20} color="#94a3b8" />}>
                                <Input placeholder={t('stock.search_placeholder')} bg={bg} color={mainText} border="0" ring="1px" ringColor={borderColor} _focus={{ ring: "2px", ringColor: "primary" }} py="2.5" borderRadius="lg" fontSize="sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </InputGroup>
                        </Box>
                        <HStack gap="2" overflowX="auto" pb={{ base: "2", lg: "0" }}>
                            <Button variant="ghost" bg={bg} color={mainText} fontSize="sm" fontWeight="medium" borderRadius="lg" px="3" py="1.5" h="auto">
                                {t('stock.all_products')} <Icon name="keyboard_arrow_down" size={18} />
                            </Button>
                            <Button variant="outline" bg={cardBg} color={mainText} borderColor={borderColor} fontSize="sm" fontWeight="medium" borderRadius="lg" px="3" py="1.5" h="auto">
                                {t('stock.category')} <Icon name="keyboard_arrow_down" size={18} />
                            </Button>
                            <Button variant="outline" bg={cardBg} color={mainText} borderColor={borderColor} fontSize="sm" fontWeight="medium" borderRadius="lg" px="3" py="1.5" h="auto">
                                {t('stock.supplier')} <Icon name="keyboard_arrow_down" size={18} />
                            </Button>
                            <Button variant="outline" bg={cardBg} color={mainText} borderColor={borderColor} fontSize="sm" fontWeight="medium" borderRadius="lg" px="3" py="1.5" h="auto">
                                <Icon name="filter_list" size={18} /> {t('stock.filters')}
                            </Button>
                        </HStack>
                    </Flex>

                    {/* Tableau */}
                    <Box bg={cardBg} border="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden" shadow="sm">
                        <Box overflowX="auto">
                            <TableRoot>
                                <TableHeader>
                                    <TableRow bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('stock.table.reference')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('stock.table.product')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" display={{ base: "none", sm: "table-cell" }}>{t('stock.table.category')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" display={{ base: "none", md: "table-cell" }}>{t('stock.table.price')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('stock.table.status')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('stock.table.stock_level')}</TableColumnHeader>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} textAlign="center" py="10">
                                                <Center><Spinner color="primary" /></Center>
                                            </TableCell>
                                        </TableRow>
                                    ) : products.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} textAlign="center" py="10">
                                                <Text color={subText}>{t('stock.table.noProducts')}</Text>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        products.map((product) => {
                                            const status = getStatusInfo(product);
                                            const stockPercentage = Math.min((product.stockQuantity / (product.minStockThreshold * 2 || 100)) * 100, 100);

                                            return (
                                                <TableRow key={product.id} _hover={{ bg: hoverRowBg }} transition="background 0.2s">
                                                    <TableCell px="4" py="4">
                                                        <Text fontSize="xs" fontWeight="medium" color={subText}>{product.reference}</Text>
                                                    </TableCell>
                                                    <TableCell px="4" py="4">
                                                        <Text fontSize="sm" fontWeight="semibold" color={mainText}>{product.name}</Text>
                                                    </TableCell>
                                                    <TableCell px="4" py="4" fontSize="sm" color={subText} display={{ base: "none", sm: "table-cell" }}>
                                                        {product.category?.name || 'Général'}
                                                    </TableCell>
                                                    <TableCell px="4" py="4" fontSize="sm" fontWeight="medium" color={mainText} display={{ base: "none", md: "table-cell" }}>
                                                        {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(product.unitPrice || product.price || 0)}
                                                    </TableCell>
                                                    <TableCell px="4" py="4">
                                                        <Badge bg={`${status.color}.100`} color={`${status.color}.800`} _dark={{ bg: `${status.color}.900/30`, color: `${status.color}.400` }} borderRadius="full" px="2.5" py="1" fontSize="xs" fontWeight="medium" textTransform="none">
                                                            <HStack gap="1.5">
                                                                <Box w="1.5" h="1.5" borderRadius="full" bg={status.dotColor} />
                                                                {status.label}
                                                            </HStack>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell px="4" py="4">
                                                        <HStack gap="3">
                                                            <Flex align="center" border="1px" borderColor={!status.isLow ? borderColor : `${status.color}.200`} borderRadius="lg" bg={!status.isLow ? cardBg : `${status.color}.50`} _dark={!status.isLow ? {} : { borderColor: `${status.color}.800/50`, bg: `${status.color}.900/10` }} overflow="hidden">
                                                                <IconButton aria-label="Decrease" variant="ghost" size="xs" color={!status.isLow ? subText : `${status.color}.700`} _dark={{ color: status.dotColor }} onClick={() => handleStockUpdate(product.id, 'EXIT', 1)} disabled={product.stockQuantity <= 0}>
                                                                    <Icon name="remove" size={18} />
                                                                </IconButton>
                                                                <Box w="8" textAlign="center" fontSize="sm" fontWeight="semibold" color={!status.isLow ? mainText : `${status.color}.900`} _dark={{ color: `${status.color}.100` }}>
                                                                    {product.stockQuantity}
                                                                </Box>
                                                                <IconButton aria-label="Increase" variant="ghost" size="xs" color={!status.isLow ? subText : `${status.color}.700`} _dark={{ color: status.dotColor }} onClick={() => handleStockUpdate(product.id, 'ENTRY', 1)}>
                                                                    <Icon name="add" size={18} />
                                                                </IconButton>
                                                            </Flex>
                                                            <Box display={{ base: "none", xl: "block" }} w="16" h="1.5" bg={bg} borderRadius="full" overflow="hidden">
                                                                <Box h="full" bg={status.dotColor} w={`${stockPercentage}%`} borderRadius="full" />
                                                            </Box>
                                                        </HStack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </TableRoot>
                        </Box>
                        <Flex justify="space-between" align="center" p="4" borderTop="1px solid" borderColor={borderColor} bg={cardBg}>
                            <Text fontSize="sm" color={subText}>
                                {t('stock.pagination.showing', {
                                    from: (currentPage - 1) * limit + 1,
                                    to: Math.min(currentPage * limit, totalItems),
                                    total: totalItems
                                })}
                            </Text>
                            <HStack gap="2">
                                <IconButton aria-label="Previous page" size="sm" variant="outline" borderColor={borderColor} color={subText} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                                    <Icon name="chevron_left" size={20} />
                                </IconButton>
                                <Button size="sm" bg="primary" color="white" _hover={{ bg: 'blue.600' }}>
                                    {currentPage}
                                </Button>
                                <IconButton aria-label="Next page" size="sm" variant="outline" borderColor={borderColor} color={subText} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                                    <Icon name="chevron_right" size={20} />
                                </IconButton>
                            </HStack>
                        </Flex>
                    </Box>
                </Flex>
            </motion.div>
        </Sidebar>
    );
};

export default Stock;