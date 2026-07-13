import React from 'react';
import { Badge, Box, Button, Dialog, Flex, HStack, Portal, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../../components/ui/color-mode';

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

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onStatusUpdate: (id: string, status: OrderStatus) => void;
}

const OrderDetailModal = ({ isOpen, onClose, order, onStatusUpdate }: OrderDetailModalProps) => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();

    const mainText = 'textMain';
    const subText = 'textSub';
    const borderColor = 'border';
    const cardBg = 'card';
    const hoverRowBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50';

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
            <Badge px="2.5" py="1" borderRadius="full" fontSize="xs" fontWeight="medium"
                bg={style.bg} color={style.color} border="1px solid" borderColor={style.borderColor}
                display="inline-flex" alignItems="center" gap="1.5" textTransform="none">
                <Box w="1.5" h="1.5" borderRadius="full" bg={style.dotBg} />
                {t(`orders.status.${status.toLowerCase()}`)}
            </Badge>
        );
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => onClose()} placement="center" size="lg">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="6" shadow="2xl" maxW="700px">
                        <Dialog.Header>
                            <Dialog.Title fontSize="2xl" fontWeight="bold">
                                {t('orders.detail_title', 'Order')} #{order?.id.slice(0, 8) || ''}
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body pt="6">
                            {order && (
                                <Stack gap="5">
                                    <Flex gap="8" wrap="wrap">
                                        <Box>
                                            <Text fontSize="xs" fontWeight="medium" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.customer')}</Text>
                                            <Text fontSize="md" fontWeight="semibold" color={mainText}>{order.customer?.name || '-'}</Text>
                                            <Text fontSize="sm" color={subText}>{order.customer?.email || ''}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="medium" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.date')}</Text>
                                            <Text fontSize="md" fontWeight="semibold" color={mainText}>{new Date(order.orderDate).toLocaleDateString()}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="medium" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.status')}</Text>
                                            <Box mt="1">{getStatusBadge(order.status)}</Box>
                                        </Box>
                                    </Flex>

                                    <Box borderTop="1px solid" borderColor={borderColor} pt="4">
                                        <Text fontSize="md" fontWeight="bold" color={mainText} mb="3">{t('orders.items', 'Items')}</Text>
                                        {order.items?.map((item) => (
                                            <Flex key={item.id} justify="space-between" align="center" py="2" borderBottom="1px solid" borderColor={borderColor}>
                                                <Box flex="2">
                                                    <Text fontSize="sm" fontWeight="medium" color={mainText}>{item.product?.name || item.productId}</Text>
                                                    <Text fontSize="xs" color={subText}>{item.product?.reference || ''}</Text>
                                                </Box>
                                                <Text fontSize="sm" color={subText}>x{item.quantity}</Text>
                                                <Text fontSize="sm" fontWeight="bold" color={mainText}>
                                                    {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(Number(item.unitPrice) * item.quantity)}
                                                </Text>
                                            </Flex>
                                        ))}
                                        <Flex justify="space-between" align="center" pt="3">
                                            <Text fontSize="md" fontWeight="bold" color={mainText}>{t('orders.table.total')}</Text>
                                            <Text fontSize="xl" fontWeight="black" color="primary">
                                                {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(Number(order.totalAmount))}
                                            </Text>
                                        </Flex>
                                    </Box>

                                    {order.status !== 'LIVREE' && order.status !== 'ANNULEE' && (
                                        <Box borderTop="1px solid" borderColor={borderColor} pt="4">
                                            <Text fontSize="sm" fontWeight="medium" color={subText} mb="3">{t('orders.update_status', 'Update Status')}</Text>
                                            <HStack gap="2">
                                                {order.status === 'EN_ATTENTE' && (
                                                    <Button size="sm" colorPalette="blue" onClick={() => onStatusUpdate(order.id, 'EXPEDIEE')}>
                                                        {t('orders.mark_shipped', 'Mark as Shipped')}
                                                    </Button>
                                                )}
                                                {order.status === 'EXPEDIEE' && (
                                                    <Button size="sm" colorPalette="green" onClick={() => onStatusUpdate(order.id, 'LIVREE')}>
                                                        {t('orders.mark_delivered', 'Mark as Delivered')}
                                                    </Button>
                                                )}
                                                <Button size="sm" colorPalette="red" variant="outline" onClick={() => onStatusUpdate(order.id, 'ANNULEE')}>
                                                    {t('orders.cancel_order', 'Cancel Order')}
                                                </Button>
                                            </HStack>
                                        </Box>
                                    )}
                                </Stack>
                            )}
                        </Dialog.Body>
                        <Dialog.Footer mt="4">
                            <Button variant="outline" h="11" px="6" borderRadius="xl" borderColor={borderColor} color={mainText}
                                _hover={{ bg: hoverRowBg }} onClick={onClose}>
                                {t('common.close', 'Close')}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default OrderDetailModal;
