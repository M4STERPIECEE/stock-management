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
import { SnackbarContent } from '../../components/ui/Snackbar';

interface Customer {
	id: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	orderCount: number;
	status: string;
	createdAt: string;
}

const DEFAULT_PAGE_SIZE = 10;

const Customers = () => {
	const { t } = useTranslation();
	const { colorMode } = useColorMode();
	const mainText = 'textMain';
	const subText = 'textSub';
	const borderColor = 'border';
	const cardBg = 'card';
	const inputBg = 'inputBg';
	const inputBorder = 'inputBorder';
	const bg = 'background';
	const hoverRowBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50';

	const [customers, setCustomers] = useState<Customer[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
	const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
	const [snackbarError, setSnackbarError] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		address: '',
	});
	const [formLoading, setFormLoading] = useState(false);

	const showSnackbar = (msg: string, isError = false) => {
		setSnackbarMessage(msg);
		setSnackbarError(isError);
		setTimeout(() => setSnackbarMessage(null), 3000);
	};

	const fetchCustomers = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
			const url = new URL('http://localhost:3005/api/v1/customers');
			if (debouncedSearchTerm) url.searchParams.append('search', debouncedSearchTerm);
			url.searchParams.append('page', currentPage.toString());
			url.searchParams.append('limit', DEFAULT_PAGE_SIZE.toString());

			const response = await fetch(url.toString(), {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (response.ok) {
				const data = await response.json();
				setCustomers(data.items || []);
				setTotalItems(data.total || 0);
				setTotalPages(Math.ceil((data.total || 0) / DEFAULT_PAGE_SIZE));
			}
		} catch (error) {
			console.error('Error fetching customers:', error);
		} finally {
			setLoading(false);
		}
	}, [debouncedSearchTerm, currentPage]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearchTerm]);

	useEffect(() => {
		fetchCustomers();
	}, [fetchCustomers]);

	const handleEdit = (customer: Customer) => {
		setEditingCustomer(customer);
		setFormData({
			name: customer.name,
			email: customer.email || '',
			phone: customer.phone || '',
			address: customer.address || '',
		});
		setIsModalOpen(true);
	};

	const handleAdd = () => {
		setEditingCustomer(null);
		setFormData({ name: '', email: '', phone: '', address: '' });
		setIsModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (!window.confirm(t('customers.delete_confirm', 'Are you sure you want to delete this customer?'))) return;
		try {
			const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
			const response = await fetch(`http://localhost:3005/api/v1/customers/${id}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (response.ok) {
				showSnackbar(t('customers.delete_success', 'Customer deleted successfully'));
				fetchCustomers();
			} else {
				const err = await response.json();
				showSnackbar(err.message || t('common.error', 'Error'), true);
			}
		} catch (error) {
			showSnackbar(t('common.error', 'Error'), true);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormLoading(true);
		try {
			const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
			const url = editingCustomer
				? `http://localhost:3005/api/v1/customers/${editingCustomer.id}`
				: 'http://localhost:3005/api/v1/customers';
			const method = editingCustomer ? 'PATCH' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				showSnackbar(
					editingCustomer
						? t('customers.edit_success', 'Customer updated successfully')
						: t('customers.add_success', 'Customer added successfully')
				);
				setIsModalOpen(false);
				fetchCustomers();
			} else {
				const err = await response.json();
				showSnackbar(err.message || t('common.error', 'Error'), true);
			}
		} catch (error) {
			showSnackbar(t('common.error', 'Error'), true);
		} finally {
			setFormLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const getStatusStyle = (status: string) => {
		if (status === 'ACTIVE') {
			return {
				bg: colorMode === 'dark' ? 'green.900/30' : 'green.50',
				color: colorMode === 'dark' ? 'green.300' : 'green.700',
				borderColor: colorMode === 'dark' ? 'green.800' : 'green.200',
				dotBg: 'green.500',
			};
		}
		return {
			bg: colorMode === 'dark' ? 'gray.800' : 'gray.100',
			color: colorMode === 'dark' ? 'gray.400' : 'gray.600',
			borderColor: colorMode === 'dark' ? 'gray.700' : 'gray.200',
			dotBg: 'gray.400',
		};
	};

	const from = totalItems === 0 ? 0 : (currentPage - 1) * DEFAULT_PAGE_SIZE + 1;
	const to = Math.min(currentPage * DEFAULT_PAGE_SIZE, totalItems);

	return (
		<Sidebar>
			<Flex direction="column" gap="6">
				{/* Toolbar */}
				<Flex bg={cardBg} p="4" borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" justify="space-between" align="center" wrap="wrap" gap="4">
					<InputGroup maxW="md" minW="280px"
						startElement={<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>}
						startElementProps={{ color: subText }}>
						<Input placeholder={t('customers.search_placeholder')}
							bg={inputBg} border="1px solid" borderColor={inputBorder}
							_focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" fontSize="sm"
							value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
					</InputGroup>
					<Button h="10" px="4" bg="primary" color="white" _hover={{ bg: 'blue.600' }} borderRadius="lg" fontSize="sm" fontWeight="bold" boxShadow="sm" onClick={handleAdd}>
						<Flex align="center" gap="2">
							<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
							<span>{t('customers.add_customer')}</span>
						</Flex>
					</Button>
				</Flex>

				{/* Table */}
				<Box bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" overflow="hidden">
					<Box overflowX="auto">
						<TableRoot>
							<TableHeader>
								<TableRow bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}>
									<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('customers.table.name')}</TableColumnHeader>
									<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" display={{ base: 'none', md: 'table-cell' }}>{t('customers.table.email')}</TableColumnHeader>
									<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" display={{ base: 'none', md: 'table-cell' }}>{t('customers.table.phone')}</TableColumnHeader>
									<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" textAlign="center">{t('customers.table.orders')}</TableColumnHeader>
									<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">{t('customers.table.status')}</TableColumnHeader>
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
								) : customers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} textAlign="center" py="10">
											<VStack gap={2}>
												<span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'gray' }}>group_off</span>
												<Text color={subText} fontSize="lg">{t('common.no_results')}</Text>
											</VStack>
										</TableCell>
									</TableRow>
								) : (
									customers.map((customer) => {
										const statusStyle = getStatusStyle(customer.status);
										return (
											<TableRow key={customer.id} _hover={{ bg: hoverRowBg }} transition="background 0.2s">
												<TableCell px="4" py="4">
													<Text fontSize="sm" fontWeight="semibold" color={mainText}>{customer.name}</Text>
												</TableCell>
												<TableCell px="4" py="4" display={{ base: 'none', md: 'table-cell' }}>
													<Text fontSize="sm" color={subText}>{customer.email || '-'}</Text>
												</TableCell>
												<TableCell px="4" py="4" display={{ base: 'none', md: 'table-cell' }}>
													<Text fontSize="sm" color={subText}>{customer.phone || '-'}</Text>
												</TableCell>
												<TableCell px="4" py="4" textAlign="center">
													<Badge variant="subtle" colorPalette="blue" borderRadius="md">{customer.orderCount}</Badge>
												</TableCell>
												<TableCell px="4" py="4">
													<Badge px="2.5" py="1" borderRadius="full" fontSize="xs" fontWeight="medium"
														bg={statusStyle.bg} color={statusStyle.color} border="1px solid" borderColor={statusStyle.borderColor}
														display="inline-flex" alignItems="center" gap="1.5" textTransform="none">
														<Box w="1.5" h="1.5" borderRadius="full" bg={statusStyle.dotBg} />
														{customer.status === 'ACTIVE' ? t('customers.active') : t('customers.inactive')}
													</Badge>
												</TableCell>
												<TableCell px="4" py="4" textAlign="right">
													<HStack justify="flex-end" gap="2">
														<IconButton aria-label="Edit" size="sm" variant="ghost" color={subText}
															_hover={{ bg: cardBg, color: 'primary', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }}
															onClick={() => handleEdit(customer)}>
															<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
														</IconButton>
														<IconButton aria-label="Delete" size="sm" variant="ghost" color={subText}
															_hover={{ bg: cardBg, color: 'red.600', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }}
															onClick={() => handleDelete(customer.id)}>
															<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
														</IconButton>
													</HStack>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</TableRoot>
					</Box>
					{/* Pagination */}
					<Flex justify="space-between" align="center" p="4" borderTop="1px solid" borderColor={borderColor}>
						<Text fontSize="sm" color={subText}>
							{t('products.pagination.showing')} <Text as="span" fontWeight="medium" color={mainText}>{from}</Text>{' '}
							{t('products.pagination.to')} <Text as="span" fontWeight="medium" color={mainText}>{to}</Text>{' '}
							{t('products.pagination.of')} <Text as="span" fontWeight="medium" color={mainText}>{totalItems}</Text>{' '}
							{t('products.pagination.results')}
						</Text>
						<HStack gap="2">
							<IconButton aria-label="Previous" size="sm" variant="outline" borderColor={borderColor} color={subText}
								onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
								_hover={{ bg: hoverRowBg, color: mainText }}>
								<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
							</IconButton>
							<Text fontSize="sm" fontWeight="medium" color={mainText} px="2">
								{t('products.pagination.page')} {currentPage} {t('products.pagination.of_pages')} {totalPages}
							</Text>
							<IconButton aria-label="Next" size="sm" variant="outline" borderColor={borderColor} color={subText}
								onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
								_hover={{ bg: hoverRowBg, color: mainText }}>
								<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
							</IconButton>
						</HStack>
					</Flex>
				</Box>
			</Flex>

			{/* Add/Edit Modal */}
			<Dialog.Root open={isModalOpen} onOpenChange={(e) => !formLoading && setIsModalOpen(e.open)} placement="center" size="md">
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content bg={cardBg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="6" shadow="2xl">
							<Dialog.Header>
								<Dialog.Title fontSize="2xl" fontWeight="bold">
									{editingCustomer ? t('customers.edit_customer') : t('customers.add_customer')}
								</Dialog.Title>
							</Dialog.Header>
							<Dialog.Body pt="6">
								<form id="customer-form" onSubmit={handleSubmit}>
									<Stack gap="5">
										<Field.Root>
											<Field.Label fontSize="sm" fontWeight="medium" color={mainText}>{t('customers.table.name')} *</Field.Label>
											<Input name="name" value={formData.name} onChange={handleChange} required
												bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" />
										</Field.Root>
										<Field.Root>
											<Field.Label fontSize="sm" fontWeight="medium" color={mainText}>{t('customers.table.email')}</Field.Label>
											<Input name="email" type="email" value={formData.email} onChange={handleChange}
												bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" />
										</Field.Root>
										<Field.Root>
											<Field.Label fontSize="sm" fontWeight="medium" color={mainText}>{t('customers.table.phone')}</Field.Label>
											<Input name="phone" value={formData.phone} onChange={handleChange}
												bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" />
										</Field.Root>
										<Field.Root>
											<Field.Label fontSize="sm" fontWeight="medium" color={mainText}>{t('customers.table.address')}</Field.Label>
											<Input name="address" value={formData.address} onChange={handleChange}
												bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" />
										</Field.Root>
									</Stack>
								</form>
							</Dialog.Body>
							<Dialog.Footer mt="8" gap="3">
								<Button variant="outline" h="11" px="6" borderRadius="xl" borderColor={borderColor} color={mainText}
									_hover={{ bg: hoverRowBg }} onClick={() => setIsModalOpen(false)} disabled={formLoading}>
									{t('common.cancel')}
								</Button>
								<Button type="submit" form="customer-form" h="11" px="8" borderRadius="xl" bg="primary" color="white"
									_hover={{ bg: 'blue.600' }} loading={formLoading}>
									{editingCustomer ? t('common.save') : t('customers.add_customer')}
								</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>

			{snackbarMessage && <SnackbarContent message={snackbarMessage} isError={snackbarError} />}
		</Sidebar>
	);
};

export default Customers;
