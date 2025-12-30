import React, { useState } from 'react';
import {
	Badge,
	Box,
	Button,
	Checkbox,
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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../components/ui/color-mode';
import AddCategoryModal from './modal/AddCategoryModal';
import { useEffect } from 'react';
import { SnackbarContent } from '../../components/ui/Snackbar';

type CategoryRow = {
	id: string;
	name: string;
	description: string;
	productCount: number;
	status: 'ACTIVE' | 'INACTIVE';
};

const TableCheckbox = () => (
	<Checkbox.Root colorPalette="blue" variant="subtle">
		<Checkbox.HiddenInput />
		<Checkbox.Control
			border="1px solid"
			borderColor="gray.300"
			_checked={{ bg: 'primary', borderColor: 'primary' }}
			borderRadius="sm"
		/>
	</Checkbox.Root>
);

const CategoryListTabContent = () => {
	const { t } = useTranslation();
	const { colorMode } = useColorMode();
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [categories, setCategories] = useState<CategoryRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

	const mainText = 'textMain';
	const subText = 'textSub';
	const borderColor = 'border';
	const cardBg = 'card';
	const inputBg = 'inputBg';
	const inputBorder = 'inputBorder';
	const hoverRowBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50';

	useEffect(() => {
		fetchCategories();
	}, [searchTerm]);

	const fetchCategories = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
			const url = new URL('http://localhost:3000/api/v1/categories');
			if (searchTerm) url.searchParams.append('search', searchTerm);
			
			const response = await fetch(url.toString(), {
				headers: {
					'Authorization': `Bearer ${token}`,
				}
			});
			if (response.ok) {
				const data = await response.json();
				setCategories(data.items || []);
			}
		} catch (error) {
			console.error('Error fetching categories:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddSuccess = () => {
		fetchCategories();
		setIsAddModalOpen(false);
		setShowSuccessSnackbar(true);
		setTimeout(() => setShowSuccessSnackbar(false), 3000);
	};

	const getStatusStyle = (status: 'ACTIVE' | 'INACTIVE') => {
		if (status === 'ACTIVE') {
			return {
				bg: colorMode === 'dark' ? 'green.900/30' : 'green.50',
				color: colorMode === 'dark' ? 'green.300' : 'green.700',
				borderColor: colorMode === 'dark' ? 'green.800' : 'green.200',
				dotBg: 'green.500',
				label: t('products.categories.active'),
			};
		}
		return {
			bg: colorMode === 'dark' ? 'gray.800' : 'gray.100',
			color: colorMode === 'dark' ? 'gray.400' : 'gray.600',
			borderColor: colorMode === 'dark' ? 'gray.700' : 'gray.200',
			dotBg: 'gray.400',
			label: t('products.categories.inactive'),
		};
	};

	return (
		<Flex direction="column" gap="6">
			<Flex bg={cardBg} p="4" borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" justify="space-between" align="center" wrap="wrap" gap="4">
				<InputGroup maxW="md" minW="280px" startElement={
						<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
							search
						</span>
					} startElementProps={{ color: subText }}>
					<Input placeholder={t('products.categories.search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg={inputBg} border="1px solid" borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" fontSize="sm"/>
				</InputGroup>
				<Button h="10" px="4" bg="primary" color="white" _hover={{ bg: 'blue.600' }} borderRadius="lg" fontSize="sm" fontWeight="bold" boxShadow="sm" onClick={() => setIsAddModalOpen(true)}>
					<Flex align="center" gap="2">
						<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
							add
						</span>
						<span>{t('products.categories.new_category')}</span>
					</Flex>
				</Button>
			</Flex>

			<Box bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" overflow="hidden">
				<Box overflowX="auto">
					<TableRoot>
						<TableHeader>
							<TableRow bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}>
								<TableColumnHeader px="4" py="4" w="12">
									<TableCheckbox />
								</TableColumnHeader>
								<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">
									{t('products.table.name')}
								</TableColumnHeader>
								<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">
									{t('products.table.description')}
								</TableColumnHeader>
								<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" textAlign="center">
									{t('products.table.products_count')}
								</TableColumnHeader>
								<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider">
									{t('products.table.status')}
								</TableColumnHeader>
								<TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" textAlign="right">
									{t('products.table.actions')}
								</TableColumnHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={6} textAlign="center" py="10">
										<Text color={subText}>{t('common.loading', 'Chargement...')}</Text>
									</TableCell>
								</TableRow>
							) : categories.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} textAlign="center" py="10">
										<Text color={subText}>{t('common.no_results', 'Aucun résultat trouvé')}</Text>
									</TableCell>
								</TableRow>
							) : (
								categories.map((category) => {
									const statusStyle = getStatusStyle(category.status);
									return (
										<TableRow key={category.id} _hover={{ bg: hoverRowBg }} transition="background 0.2s">
											<TableCell px="4" py="4">
												<TableCheckbox />
											</TableCell>
											<TableCell px="4" py="4">
												<Text fontSize="sm" fontWeight="semibold" color={mainText}>
													{category.name}
												</Text>
											</TableCell>
											<TableCell px="4" py="4">
												<Text fontSize="sm" color={subText} maxW="300px" truncate>
													{category.description}
												</Text>
											</TableCell>
											<TableCell px="4" py="4" textAlign="center">
												<Badge variant="subtle" colorPalette="blue" borderRadius="md">
													{category.productCount}
												</Badge>
											</TableCell>
											<TableCell px="4" py="4">
												<Badge px="2.5" py="1" borderRadius="full" fontSize="xs" fontWeight="medium" bg={statusStyle.bg} color={statusStyle.color} border="1px solid" borderColor={statusStyle.borderColor} display="inline-flex" alignItems="center" gap="1.5" textTransform="none">
													<Box w="1.5" h="1.5" borderRadius="full" bg={statusStyle.dotBg} />
													{statusStyle.label}
												</Badge>
											</TableCell>
											<TableCell px="4" py="4" textAlign="right">
												<HStack justify="flex-end" gap="2">
													<IconButton aria-label="Modifier" size="sm" variant="ghost" color={subText} _hover={{ bg: cardBg, color: 'primary', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }}>
														<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
															edit
														</span>
													</IconButton>
													<IconButton aria-label="Supprimer" size="sm" variant="ghost" color={subText} _hover={{ bg: cardBg, color: 'red.600', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }}>
														<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
															delete
														</span>
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
				<Flex justify="space-between" align="center" p="4" borderTop="1px solid" borderColor={borderColor} bg={cardBg}>
					<Text fontSize="sm" color={subText}>
						{t('products.pagination.showing')} <Text as="span" fontWeight="medium" color={mainText}>1</Text> {t('products.pagination.to')} <Text as="span" fontWeight="medium" color={mainText}>{categories.length}</Text> {t('products.pagination.of')} <Text as="span" fontWeight="medium" color={mainText}>{categories.length}</Text> {t('products.pagination.categories')}
					</Text>
					<HStack gap="2">
						<IconButton aria-label="Previous" size="sm" variant="outline" borderColor={borderColor} color={subText} disabled>
							<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
								chevron_left
							</span>
						</IconButton>
						<Button size="sm" bg="primary" color="white" _hover={{ bg: 'blue.600' }}>
							1
						</Button>
						<IconButton aria-label="Next" size="sm" variant="outline" borderColor={borderColor} color={subText} disabled>
							<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
								chevron_right
							</span>
						</IconButton>
					</HStack>
				</Flex>
			</Box>
			<AddCategoryModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleAddSuccess} />
			{showSuccessSnackbar && <SnackbarContent message={t('products.categories.add_success', 'Catégorie ajoutée avec succès')} />}
		</Flex>
	);
};

export default CategoryListTabContent;
