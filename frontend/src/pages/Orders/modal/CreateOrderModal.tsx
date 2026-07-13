import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, Dialog, Field, Flex, HStack, IconButton, Input, Popover, Portal, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../../components/ui/color-mode';
import { useAppToast } from '../../../hooks/useAppToast';
import Icon from '../../../components/ui/Icon';
import { API_BASE_URL, authHeaders } from '../../../config/api';

interface Customer {
    id: string;
    name: string;
    email: string;
}

interface Product {
    id: string;
    name: string;
    reference: string;
    price: number;
    stockQuantity: number;
}

interface OrderLine {
    productId: string;
    quantity: number;
}

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type PopoverOption = {
    value: string;
    label: string;
};

const PopoverSelect = ({
    value,
    onChange,
    placeholder,
    options,
    mainText,
    subText,
    borderColor,
    bg,
    hoverBg,
    selectedBg,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: PopoverOption[];
    mainText: string;
    subText: string;
    borderColor: string;
    bg: string;
    hoverBg: string;
    selectedBg: string;
}) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = useMemo(() => {
        if (!value) return placeholder;
        return options.find((o) => o.value === value)?.label ?? placeholder;
    }, [options, placeholder, value]);

    return (
        <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)} positioning={{ placement: 'bottom-start', sameWidth: true, fitViewport: true }} >
            <Popover.Trigger asChild>
                <Button variant="outline" h="10" px="3" w="full" justifyContent="space-between" borderColor={borderColor} bg={bg} _hover={{ bg: hoverBg }} gap="3" >
                    <Text fontSize="sm" color={value ? mainText : subText} fontWeight={value ? 'medium' : 'normal'}>
                        {selectedLabel}
                    </Text>
                    <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-flex' }}>
                        <Icon name="expand_more" size={20} color={subText} />
                    </span>
                </Button>
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content bg={bg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p="2" shadow="lg" w="full" maxW="full" zIndex="popover">
                        <VStack align="stretch" gap="1">
                            <Button w="full" variant="ghost" justifyContent="flex-start" h="10" px="3" fontSize="sm" color={subText} _hover={{ bg: hoverBg, color: mainText }} onClick={() => { onChange(''); setOpen(false); }} >
                                {placeholder}
                            </Button>
                            {options.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <Button w="full" key={opt.value} variant="ghost" justifyContent="flex-start" h="10" px="3" fontSize="sm" bg={isSelected ? selectedBg : 'transparent'} color={isSelected ? 'primary' : mainText} fontWeight={isSelected ? 'bold' : 'medium'} _hover={{ bg: hoverBg }} onClick={() => { onChange(opt.value); setOpen(false); }} >
                                        {opt.label}
                                    </Button>
                                );
                            })}
                        </VStack>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
};

const CreateOrderModal = ({ isOpen, onClose, onSuccess }: CreateOrderModalProps) => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const { showToast } = useAppToast();
    const mainText = 'textMain';
    const subText = 'textSub';
    const borderColor = 'border';
    const cardBg = 'card';
    const inputBg = 'inputBg';
    const inputBorder = 'inputBorder';
    const hoverRowBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50';
    const selectHoverBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50';
    const selectSelectedBg = colorMode === 'dark' ? 'blue.900/20' : 'blue.50';

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [orderLines, setOrderLines] = useState<Array<{ productId: string; quantity: number }>>([]);
    const [loading, setLoading] = useState(false);

    const customerOptions: PopoverOption[] = useMemo(() => {
        return customers.map(c => ({ value: c.id, label: `${c.name} (${c.email || c.id.slice(0, 8)})` }));
    }, [customers]);

    const productOptions: PopoverOption[] = useMemo(() => {
        return products
            .filter(p => p.stockQuantity > 0)
            .map(p => ({
                value: p.id,
                label: `${p.name} (${p.reference}) - ${p.stockQuantity} ${t('stock.status.in_stock')} - ${new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(p.price)}`
            }));
    }, [products, t]);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            fetchProducts();
            setSelectedCustomerId('');
            setOrderLines([{ productId: '', quantity: 1 }]);
        }
    }, [isOpen]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/customers?limit=100`, {
                headers: authHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products?limit=200`, {
                headers: authHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const addOrderLine = () => {
        setOrderLines(prev => [...prev, { productId: '', quantity: 1 }]);
    };

    const removeOrderLine = (index: number) => {
        setOrderLines(prev => prev.filter((_, i) => i !== index));
    };

    const updateOrderLine = (index: number, field: 'productId' | 'quantity', value: string | number) => {
        setOrderLines(prev => prev.map((line, i) =>
            i === index ? { ...line, [field]: value } : line
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId) {
            showToast({ title: t('orders.select_customer_error', 'Please select a customer'), status: 'error' });
            return;
        }
        const validLines = orderLines.filter(line => line.productId && line.quantity > 0);
        if (validLines.length === 0) {
            showToast({ title: t('orders.select_product_error', 'Please add at least one product'), status: 'error' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    customerId: selectedCustomerId,
                    items: validLines,
                }),
            });

            if (response.ok) {
                showToast({ title: t('orders.create_success', 'Order created successfully'), status: 'success' });
                onSuccess();
                onClose();
            } else {
                const err = await response.json();
                showToast({ title: err.message || t('common.error', 'Error'), status: 'error' });
            }
        } catch (error) {
            showToast({ title: t('common.error', 'Error'), status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !loading && onClose()} placement="center" size="lg">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="6" shadow="2xl" maxW="700px">
                        <Dialog.Header>
                            <Dialog.Title fontSize="2xl" fontWeight="bold">{t('orders.new_order')}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body pt="6">
                            <form id="create-order-form" onSubmit={handleSubmit}>
                                <Stack gap="5">
                                    <VStack align="stretch" gap="1.5">
                                        <Text fontSize="sm" fontWeight="medium" color={mainText}>
                                            {t('orders.table.customer')} *
                                        </Text>
                                        <PopoverSelect value={selectedCustomerId} onChange={setSelectedCustomerId} placeholder={t('orders.select_customer', 'Select a customer...')} options={customerOptions} mainText={mainText} subText={subText} borderColor={inputBorder} bg={inputBg} hoverBg={selectHoverBg} selectedBg={selectSelectedBg} />
                                    </VStack>
                                    <Box>
                                        <Flex justify="space-between" align="center" mb="3">
                                            <Text fontSize="sm" fontWeight="medium" color={mainText}>{t('orders.items', 'Order Items')}</Text>
                                            <Button size="sm" variant="outline" borderColor={borderColor} onClick={addOrderLine}>
                                                <Flex align="center" gap="1">
                                                    <Icon name="add" size={16} />
                                                    {t('orders.add_item', 'Add item')}
                                                </Flex>
                                            </Button>
                                        </Flex>
                                        {orderLines.map((line, index) => (
                                            <Flex key={index} gap="3" mb="3" align="flex-end">
                                                <Box flex="2">
                                                    {index === 0 && <Text fontSize="xs" fontWeight="medium" color={subText} mb="1">{t('orders.table.product')}</Text>}
                                                    <PopoverSelect value={line.productId} onChange={(value) => updateOrderLine(index, 'productId', value)} placeholder={t('orders.select_product', 'Select product...')} options={productOptions} mainText={mainText} subText={subText} borderColor={inputBorder} bg={inputBg} hoverBg={selectHoverBg} selectedBg={selectSelectedBg} />
                                                </Box>
                                                <Box flex="1">
                                                    {index === 0 && <Text fontSize="xs" fontWeight="medium" color={subText} mb="1">{t('orders.table.quantity')}</Text>}
                                                    <Input type="number" min={1} value={line.quantity} onChange={(e) => updateOrderLine(index, 'quantity', parseInt(e.target.value) || 1)} bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" />
                                                </Box>
                                                <IconButton aria-label="Remove" size="sm" variant="ghost" color="red.500" onClick={() => removeOrderLine(index)} disabled={orderLines.length <= 1} _hover={{ bg: 'red.50' }}>
                                                    <Icon name="close" size={18} />
                                                </IconButton>
                                            </Flex>
                                        ))}
                                    </Box>
                                </Stack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer mt="8" gap="3">
                            <Button variant="outline" h="11" px="6" borderRadius="xl" borderColor={borderColor} color={mainText} _hover={{ bg: hoverRowBg }} onClick={onClose} disabled={loading}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" form="create-order-form" h="11" px="8" borderRadius="xl" bg="primary" color="white" _hover={{ bg: 'blue.600' }} loading={loading}>
                                {t('orders.create', 'Create Order')}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default CreateOrderModal;