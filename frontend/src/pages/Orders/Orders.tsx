import { motion } from 'framer-motion';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
	Box,
	Button,
	Flex,
	HStack,
	IconButton,
	Input,
	InputGroup,
	TableBody,
	TableCell,
	TableColumnHeader,
	TableHeader,
	TableRoot,
	TableRow,
	Text,
	VStack,
	Spinner,
	Center,
	Badge,
	Dialog,
	Portal,
	Stack,
	Field,
} from '@chakra-ui/react';
import Sidebar from '../../components/navigation/sidebar';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../components/ui/color-mode';
import { useAppToast } from '../../hooks/useAppToast';
import Icon from '../../components/ui/Icon';
import { API_BASE_URL, authHeaders } from '../../config/api';

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

interface Product {
	id: string;
	name: string;
	reference: string;
	price: number;
	stockQuantity: number;
}

interface Customer {
	id: string;
	name: string;
	email: string;
}

const DEFAULT_PAGE_SIZE = 10;

const statusConfig: Record<OrderStatus, { bg: string; color: string; dotBg: string; labelKey: string }> = {
	'EN_ATTENTE': { bg: 'yellow.50', color: 'yellow.700', dotBg: 'yellow.500', labelKey: 'orders.status.pending' },
	'EXPEDIEE': { bg: 'blue.50', color: 'blue.700', dotBg: 'blue.500', labelKey: 'orders.status.shipped' },
	'LIVREE': { bg: 'green.50', color: 'green.700', dotBg: 'green.500', labelKey: 'orders.status.delivered' },
	'ANNULEE': { bg: 'red.50', color: 'red.700', dotBg: 'red.500', labelKey: 'orders.status.cancelled' },
};

const Orders = () => {
	const { t } = useTranslation();
	const { colorMode } = useColorMode();
	const { showToast } = useAppToast();
	const mainText = 'textMain';
	const subText = 'textSub';
	const borderColor = 'border';
	const cardBg = 'card';
	const inputBg = 'inputBg';
	const inputBorder = 'inputBorder';
	const bg = 'background';
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
	// Create order form
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [selectedCustomerId, setSelectedCustomerId] = useState('');
	const [orderLines, setOrderLines] = useState<Array<{ productId: string; quantity: number }>>([]);
	const [createLoading, setCreateLoading] = useState(false);

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

	const fetchCustomers = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/customers?limit=100`, {
				headers: authHeaders()
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
				headers: authHeaders()
			});
			if (response.ok) {
				const data = await response.json();
				setProducts(data.items || []);
			}
		} catch (error) {
			console.error('Error fetching products:', error);
		}
	};

	const handleCreateOpen = () => {
		fetchCustomers();
		fetchProducts();
		setSelectedCustomerId('');
		setOrderLines([{ productId: '', quantity: 1 }]);
		setIsCreateModalOpen(true);
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

	const handleCreateOrder = async (e: React.FormEvent) => {
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

		setCreateLoading(true);
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
				setIsCreateModalOpen(false);
				fetchOrders();
			} else {
				const err = await response.json();
				showToast({ title: err.message || t('common.error', 'Error'), status: 'error' });
			}
		} catch (error) {
			showToast({ title: t('common.error', 'Error'), status: 'error' });
		} finally {
			setCreateLoading(false);
		}
	};

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
		const config = statusConfig[status];
		if (!config) return null;

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
				{/* En-tête */}
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

				{/* Toolbar */}
				<Flex bg={cardBg} p="4" borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" justify="space-between" align="center" wrap="wrap" gap="4">
					<HStack gap="3" overflowX="auto">
						{statusOptions.map(opt => (
							<Button key={opt.value} size="sm" variant={statusFilter === opt.value ? 'solid' : 'outline'}
								bg={statusFilter === opt.value ? 'primary' : 'transparent'}
								color={statusFilter === opt.value ? 'white' : mainText}
								borderColor={borderColor}
								_hover={{ bg: statusFilter === opt.value ? 'blue.600' : hoverRowBg }}
								borderRadius="lg" fontSize="sm"
								onClick={() => setStatusFilter(opt.value)}>
								{opt.label}
							</Button>
						))}
					</HStack>
					<Button h="10" px="4" bg="primary" color="white" _hover={{ bg: 'blue.600' }} borderRadius="lg" fontSize="sm" fontWeight="bold" boxShadow="sm" onClick={handleCreateOpen}>
						<Flex align="center" gap="2">
							<Icon name="add" size={20} />
							<span>{t('orders.new_order')}</span>
						</Flex>
					</Button>
				</Flex>

				{/* Table */}
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
												<IconButton aria-label="View" size="sm" variant="ghost" color={subText}
													_hover={{ bg: cardBg, color: 'primary', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }}
													onClick={(e) => { e.stopPropagation(); handleViewDetail(order.id); }}>
													<Icon name="visibility" size={18} />
												</IconButton>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</TableRoot>
					</Box>
					{/* Pagination */}
					<Flex justify="space-between" align="center" p="4" borderTop="1px solid" borderColor={borderColor} bg={cardBg}>
						<Text fontSize="sm" color={subText}>
							{t('products.pagination.showing')} <Text as="span" fontWeight="medium" color={mainText}>{from}</Text> {t('products.pagination.to')} <Text as="span" fontWeight="medium" color={mainText}>{to}</Text> {t('products.pagination.of')} <Text as="span" fontWeight="medium" color={mainText}>{totalItems}</Text> {t('products.pagination.results')}
						</Text>
						<HStack gap="2">
							<IconButton aria-label="Previous" size="sm" variant="outline" borderColor={borderColor} color={subText}
								onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
								<Icon name="chevron_left" size={20} />
							</IconButton>
							<Button size="sm" bg="primary" color="white" _hover={{ bg: 'blue.600' }}>
								{currentPage}
							</Button>
							<IconButton aria-label="Next" size="sm" variant="outline" borderColor={borderColor} color={subText}
								onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
								<Icon name="chevron_right" size={20} />
							</IconButton>
						</HStack>
					</Flex>
				</Box>
			</Flex>

			{/* Create Order Modal */}
			<Dialog.Root open={isCreateModalOpen} onOpenChange={(e) => !createLoading && setIsCreateModalOpen(e.open)} placement="center" size="lg">
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content bg={cardBg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="6" shadow="2xl" maxW="700px">
							<Dialog.Header>
								<Dialog.Title fontSize="2xl" fontWeight="bold">{t('orders.new_order')}</Dialog.Title>
							</Dialog.Header>
							<Dialog.Body pt="6">
								<form id="create-order-form" onSubmit={handleCreateOrder}>
									<Stack gap="5">
										<Field.Root>
											<Field.Label fontSize="sm" fontWeight="medium" color={mainText}>{t('orders.table.customer')} *</Field.Label>
											<select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}
												style={{
													width: '100%', padding: '10px 12px', borderRadius: '8px',
													border: '1px solid var(--chakra-colors-inputBorder)',
													background: 'var(--chakra-colors-inputBg)', color: 'var(--chakra-colors-textMain)',
													fontSize: '14px',
												}}>
												<option value="">{t('orders.select_customer', 'Select a customer...')}</option>
												{customers.map(c => (
													<option key={c.id} value={c.id}>{c.name} ({c.email || c.id.slice(0, 8)})</option>
												))}
											</select>
										</Field.Root>

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
														<select value={line.productId} onChange={(e) => updateOrderLine(index, 'productId', e.target.value)}
															style={{
																width: '100%', padding: '10px 12px', borderRadius: '8px',
																border: '1px solid var(--chakra-colors-inputBorder)',
																background: 'var(--chakra-colors-inputBg)', color: 'var(--chakra-colors-textMain)',
																fontSize: '14px',
															}}>
															<option value="">{t('orders.select_product', 'Select product...')}</option>
															{products.filter(p => p.stockQuantity > 0 || line.productId === p.id).map(p => (
																<option key={p.id} value={p.id}>
																	{p.name} ({p.reference}) - {p.stockQuantity} {t('stock.status.in_stock', 'in stock')} - {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(p.price)}
																</option>
															))}
														</select>
													</Box>
													<Box flex="1">
														{index === 0 && <Text fontSize="xs" fontWeight="medium" color={subText} mb="1">{t('orders.table.quantity')}</Text>}
														<Input type="number" min={1} value={line.quantity}
															onChange={(e) => updateOrderLine(index, 'quantity', parseInt(e.target.value) || 1)}
															bg={inputBg} borderColor={inputBorder}
															_focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" />
													</Box>
													<IconButton aria-label="Remove" size="sm" variant="ghost" color="red.500"
														onClick={() => removeOrderLine(index)} disabled={orderLines.length <= 1}
														_hover={{ bg: 'red.50' }}>
														<Icon name="close" size={18} />
													</IconButton>
												</Flex>
											))}
										</Box>
									</Stack>
								</form>
							</Dialog.Body>
							<Dialog.Footer mt="8" gap="3">
								<Button variant="outline" h="11" px="6" borderRadius="xl" borderColor={borderColor} color={mainText}
									_hover={{ bg: hoverRowBg }} onClick={() => setIsCreateModalOpen(false)} disabled={createLoading}>
									{t('common.cancel')}
								</Button>
								<Button type="submit" form="create-order-form" h="11" px="8" borderRadius="xl" bg="primary" color="white"
									_hover={{ bg: 'blue.600' }} loading={createLoading}>
									{t('orders.create', 'Create Order')}
								</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>

			{/* Order Detail Modal */}
			<Dialog.Root open={isDetailModalOpen} onOpenChange={(e) => setIsDetailModalOpen(e.open)} placement="center" size="lg">
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content bg={cardBg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="6" shadow="2xl" maxW="700px">
							<Dialog.Header>
								<Dialog.Title fontSize="2xl" fontWeight="bold">
									{t('orders.detail_title', 'Order')} #{selectedOrder?.id.slice(0, 8) || ''}
								</Dialog.Title>
							</Dialog.Header>
							<Dialog.Body pt="6">
								{selectedOrder && (
									<Stack gap="5">
										<Flex gap="8" wrap="wrap">
											<Box>
												<Text fontSize="xs" fontWeight="medium" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.customer')}</Text>
												<Text fontSize="md" fontWeight="semibold" color={mainText}>{selectedOrder.customer?.name || '-'}</Text>
												<Text fontSize="sm" color={subText}>{selectedOrder.customer?.email || ''}</Text>
											</Box>
											<Box>
												<Text fontSize="xs" fontWeight="medium" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.date')}</Text>
												<Text fontSize="md" fontWeight="semibold" color={mainText}>{new Date(selectedOrder.orderDate).toLocaleDateString()}</Text>
											</Box>
											<Box>
												<Text fontSize="xs" fontWeight="medium" color={subText} textTransform="uppercase" letterSpacing="wider">{t('orders.table.status')}</Text>
												<Box mt="1">{getStatusBadge(selectedOrder.status)}</Box>
											</Box>
										</Flex>

										<Box borderTop="1px solid" borderColor={borderColor} pt="4">
											<Text fontSize="md" fontWeight="bold" color={mainText} mb="3">{t('orders.items', 'Items')}</Text>
											{selectedOrder.items?.map((item) => (
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
													{new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(Number(selectedOrder.totalAmount))}
												</Text>
											</Flex>
										</Box>

										{selectedOrder.status !== 'LIVREE' && selectedOrder.status !== 'ANNULEE' && (
											<Box borderTop="1px solid" borderColor={borderColor} pt="4">
												<Text fontSize="sm" fontWeight="medium" color={subText} mb="3">{t('orders.update_status', 'Update Status')}</Text>
												<HStack gap="2">
													{selectedOrder.status === 'EN_ATTENTE' && (
														<Button size="sm" colorPalette="blue" onClick={() => handleStatusUpdate(selectedOrder.id, 'EXPEDIEE')}>
															{t('orders.mark_shipped', 'Mark as Shipped')}
														</Button>
													)}
													{selectedOrder.status === 'EXPEDIEE' && (
														<Button size="sm" colorPalette="green" onClick={() => handleStatusUpdate(selectedOrder.id, 'LIVREE')}>
															{t('orders.mark_delivered', 'Mark as Delivered')}
														</Button>
													)}
													<Button size="sm" colorPalette="red" variant="outline" onClick={() => handleStatusUpdate(selectedOrder.id, 'ANNULEE')}>
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
									_hover={{ bg: hoverRowBg }} onClick={() => setIsDetailModalOpen(false)}>
									{t('common.close', 'Close')}
								</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>

			</motion.div>
		</Sidebar>
	);
};

export default Orders;
