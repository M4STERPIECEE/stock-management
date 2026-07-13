import { motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Flex, HStack, IconButton, TableBody, TableCell, TableColumnHeader, TableHeader, TableRoot, TableRow, Text, VStack, Spinner, Center, Badge, Stack } from '@chakra-ui/react';
import Sidebar from '../../components/navigation/sidebar';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../components/ui/color-mode';
import { useAppToast } from '../../hooks/useAppToast';
import Icon from '../../components/ui/Icon';
import { API_BASE_URL, authHeaders } from '../../config/api';
import CreateOrderModal from './modal/CreateOrderModal';
import OrderDetailModal from './modal/OrderDetailModal';

type OrderStatus = 'EN_ATTENTE' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE';

interface OrderItem {
    id: string;
    productId: string;
    product?: { id: string; name: string; reference: string };
    quantity: number;
    unitPrice: number;
}

interface Order {
    id: string;
    customerId: string;
    customer?: { id: string; name: string; email: string };
    status: OrderStatus;
    totalAmount: number;
    orderDate: string;
    items: OrderItem[];
}

const DEFAULT_PAGE_SIZE = 10;

const Orders = () => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const { showToast } = useAppToast();
    const mainText = 'textMain';
    const subText = 'textSub';
    const borderColor = 'border';
    const cardBg = 'card';
    const hoverRowBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50';

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL(`${API_BASE_URL}/orders`);
            if (statusFilter) url.searchParams.append('status', statusFilter);
            url.searchParams.append('page', currentPage.toString());
            url.searchParams.append('limit', DEFAULT_PAGE_SIZE.toString());

            const response = await fetch(url.toString(), {
                headers: authHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data.items || []);
                setTotalItems(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / DEFAULT_PAGE_SIZE));
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleViewDetail = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                headers: authHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedOrder(data);
                setIsDetailModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching order detail:', error);
        }
    };

    const handleStatusUpdate = async (id: string, status: OrderStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                showToast({ title: t('orders.status_updated', 'Status updated'), status: 'success' });
                fetchOrders();
                setIsDetailModalOpen(false);
            } else {
                const err = await response.json();
                showToast({ title: err.message || t('common.error', 'Error'), status: 'error' });
            }
        } catch (error) {
            showToast({ title: t('common.error', 'Error'), status: 'error' });
        }
    };

    const getStatusBadge = (status: OrderStatus) => {
        const statusColors: Record<string, { bg: string; color: string; borderColor: string; dotBg: string }> = {
            'EN_ATTENTE': {
                bg: colorMode === 'dark' ? 'yellow.900/30' : 'yellow.50',
                color: colorMode === 'dark' ? 'yellow.300' : 'yellow.700',
                borderColor: colorMode === 'dark' ? 'yellow.800' : 'yellow.200',
                dotBg: 'yellow.500',
            },
            'EXPEDIEE': {
                bg: colorMode === 'dark' ? 'blue.900/30' : 'blue.50',
                color: colorMode === 'dark' ? 'blue.300' : 'blue.700',
                borderColor: colorMode === 'dark' ? 'blue.800' : 'blue.200',
                dotBg: 'blue.500',
            },
            'LIVREE': {
                bg: colorMode === 'dark' ? 'green.900/30' : 'green.50',
                color: colorMode === 'dark' ? 'green.300' : 'green.700',
                borderColor: colorMode === 'dark' ? 'green.800' : 'green.200',
                dotBg: 'green.500',
            },
            'ANNULEE': {
                bg: colorMode === 'dark' ? 'red.900/30' : 'red.50',
                color: colorMode === 'dark' ? 'red.300' : 'red.700',
                borderColor: colorMode === 'dark' ? 'red.800' : 'red.200',
                dotBg: 'red.500',
            },
        };
        const style = statusColors[status];
        return (
            <Badge px="2.5" py="1" borderRadius="full" fontSize="xs" fontWeight="medium" bg={style.bg} color={style.color} border="1px solid" borderColor={style.borderColor} display="inline-flex" alignItems="center" gap="1.5" textTransform="none">
                <Box w="1.5" h="1.5" borderRadius="full" bg={style.dotBg} />
                {t(`orders.status.${status.toLowerCase()}`)}
            </Badge>
        );
    };

    const statusOptions: Array<{ value: string; label: string }> = [
        { value: '', label: t('orders.all_statuses', 'All statuses') },
        { value: 'EN_ATTENTE', label: t('orders.status.en_attente', 'Pending') },
        { value: 'EXPEDIEE', label: t('orders.status.expediee', 'Shipped') },
        { value: 'LIVREE', label: t('orders.status.livree', 'Delivered') },
        { value: 'ANNULEE', label: t('orders.status.annulee', 'Cancelled') },
    ];

    const from = totalItems === 0 ? 0 : (currentPage - 1) * DEFAULT_PAGE_SIZE + 1;
    const to = Math.min(currentPage * DEFAULT_PAGE_SIZE, totalItems);

    return (
        <Sidebar>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Flex direction="column" gap="6">
                    <Flex direction={{ base: "column", md: "row" }} align={{ base: "flex-start", md: "center" }} justify="space-between" gap="4">
                        <Stack gap="1">
                            <Text color={mainText} fontSize="3xl" fontWeight="900" letterSpacing="tight">
                                {t('orders.title')}
                            </Text>
                            <Text color={subText} fontSize="md">
                                {t('orders.subtitle')}
                            </Text>
                        </Stack>
                    </Flex>

                    <Flex bg={cardBg} p="4" borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" justify="space-between" align="center" wrap="wrap" gap="4">
                        <HStack gap="3" overflowX="auto">
                            {statusOptions.map(opt => (
                                <Button key={opt.value} size="sm" variant={statusFilter === opt.value ? 'solid' : 'outline'} bg={statusFilter === opt.value ? 'primary' : 'transparent'} color={statusFilter === opt.value ? 'white' : mainText} borderColor={borderColor} _hover={{ bg: statusFilter === opt.value ? 'blue.600' : hoverRowBg }} borderRadius="lg" fontSize="sm" onClick={() => setStatusFilter(opt.value)}>
                                    {opt.label}
                                </Button>
                            ))}
                        </HStack>
                        <Button h="10" px="4" bg="primary" color="white" _hover={{ bg: 'blue.600' }} borderRadius="lg" fontSize="sm" fontWeight="bold" boxShadow="sm" onClick={() => setIsCreateModalOpen(true)}>
                            <Flex align="center" gap="2">
                                <Icon name="add" size={20} />
                                <span>{t('orders.new_order')}</span>
                            </Flex>
                        </Button>
                    </Flex>

                    <Box bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" overflow="hidden">
                        <Box overflowX="auto">
                            <TableRoot>
                                <TableHeader>
                                    <TableRow bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.id')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.customer')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" display={{ base: 'none', md: 'table-cell' }}>{t('orders.table.date')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.status')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" textAlign="right">{t('orders.table.total')}</TableColumnHeader>
                                        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" textAlign="right">{t('products.table.actions')}</TableColumnHeader>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} textAlign="center" py="10">
                                                <Center><Spinner color="primary" /></Center>
                                            </TableCell>
                                        </TableRow>
                                    ) : orders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} textAlign="center" py="10">
                                                <VStack gap={2}>
                                                    <Icon name="shopping_cart_off" size={48} color="gray" />
                                                    <Text color={subText} fontSize="lg">{t('common.no_results')}</Text>
                                                </VStack>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        orders.map((order) => (
                                            <TableRow key={order.id} _hover={{ bg: hoverRowBg }} transition="background 0.2s" cursor="pointer" onClick={() => handleViewDetail(order.id)}>
                                                <TableCell px="4" py="4">
                                                    <Text fontSize="sm" fontWeight="semibold" color={mainText} fontFamily="mono">#{order.id.slice(0, 8)}</Text>
                                                </TableCell>
                                                <TableCell px="4" py="4">
                                                    <Text fontSize="sm" color={mainText}>{order.customer?.name || '-'}</Text>
                                                </TableCell>
                                                <TableCell px="4" py="4" display={{ base: 'none', md: 'table-cell' }}>
                                                    <Text fontSize="sm" color={subText}>{new Date(order.orderDate).toLocaleDateString()}</Text>
                                                </TableCell>
                                                <TableCell px="4" py="4">{getStatusBadge(order.status)}</TableCell>
                                                <TableCell px="4" py="4" textAlign="right">
                                                    <Text fontSize="sm" fontWeight="bold" color={mainText}>
                                                        {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(Number(order.totalAmount))}
                                                    </Text>
                                                </TableCell>
                                                <TableCell px="4" py="4" textAlign="right">
                                                    <IconButton aria-label="View" size="sm" variant="ghost" color={subText} _hover={{ bg: cardBg, color: 'primary', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }} onClick={(e) => { e.stopPropagation(); handleViewDetail(order.id); }}>
                                                        <Icon name="visibility" size={18} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </TableRoot>
                        </Box>
                        <Flex justify="space-between" align="center" p="4" borderTop="1px solid" borderColor={borderColor} bg={cardBg}>
                            <Text fontSize="sm" color={subText}>
                                {t('products.pagination.showing')} <Text as="span" fontWeight="medium" color={mainText}>{from}</Text> {t('products.pagination.to')} <Text as="span" fontWeight="medium" color={mainText}>{to}</Text> {t('products.pagination.of')} <Text as="span" fontWeight="medium" color={mainText}>{totalItems}</Text> {t('products.pagination.results')}
                            </Text>
                            <HStack gap="2">
                                <IconButton aria-label="Previous" size="sm" variant="outline" borderColor={borderColor} color={subText} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                                    <Icon name="chevron_left" size={20} />
                                </IconButton>
                                <Button size="sm" bg="primary" color="white" _hover={{ bg: 'blue.600' }}>
                                    {currentPage}
                                </Button>
                                <IconButton aria-label="Next" size="sm" variant="outline" borderColor={borderColor} color={subText} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                                    <Icon name="chevron_right" size={20} />
                                </IconButton>
                            </HStack>
                        </Flex>
                    </Box>
                </Flex>

                <CreateOrderModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchOrders} />

                <OrderDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} order={selectedOrder} onStatusUpdate={handleStatusUpdate} />
            </motion.div>
        </Sidebar>
    );
};

export default Orders;