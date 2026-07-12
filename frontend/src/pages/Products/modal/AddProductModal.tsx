import React, { useState, useEffect, useMemo } from 'react';
import {
	Button,
	Dialog,
	Field,
	Flex,
	HStack,
	Input,
	Stack,
	Textarea,
	Text,
	VStack,
	Portal,
	Popover,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../../components/ui/color-mode';
import Icon from '../../../components/ui/Icon';

interface AddProductModalProps {
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

const AddProductModal = ({ isOpen, onClose, onSuccess }: AddProductModalProps) => {
	const { t } = useTranslation();
	const { colorMode } = useColorMode();
	const [loading, setLoading] = useState(false);
	const [categories, setCategories] = useState<any[]>([]);

	const [formData, setFormData] = useState({
		name: '',
		categoryId: '',
		price: '',
		stockQuantity: '',
		minStockThreshold: '',
	});

	const mainText = 'textMain';
	const subText = 'textSub';
	const borderColor = 'border';
	const bg = 'card';
	const inputBg = 'inputBg';
	const inputBorder = 'inputBorder';
	const selectHoverBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50';
	const selectSelectedBg = colorMode === 'dark' ? 'blue.900/20' : 'blue.50';

	const categoryOptions: PopoverOption[] = useMemo(() => {
		return categories.map(cat => ({ value: cat.id, label: cat.name }));
	}, [categories]);

	useEffect(() => {
		if (isOpen) {
			fetchCategories();
		}
	}, [isOpen]);

	const fetchCategories = async () => {
		try {
			const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
			const response = await fetch('http://localhost:3005/api/v1/categories', {
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
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCategoryChange = (value: string) => {
		setFormData((prev) => ({ ...prev, categoryId: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
			const response = await fetch('http://localhost:3005/api/v1/products', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({
					...formData,
					price: parseFloat(formData.price),
					stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
					minStockThreshold: parseInt(formData.minStockThreshold, 10) || 10,
				}),
			});

			if (response.ok) {
				onSuccess();
				onClose();
				setFormData({
					name: '',
					categoryId: '',
					price: '',
					stockQuantity: '',
					minStockThreshold: '',
				});
			} else {
				const errorData = await response.json();
				alert(errorData.message || 'Error creating product');
			}
		} catch (error) {
			console.error('Error creating product:', error);
			alert('An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !loading && onClose()} placement="center" size="lg">
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content bg={bg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="6" shadow="2xl" maxW="600px">
						<Dialog.Header>
							<Dialog.Title fontSize="2xl" fontWeight="bold">
								{t('products.add_product')}
							</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body pt="6">
							<form id="add-product-form" onSubmit={handleSubmit}>
								<Stack gap="5">
									<VStack align="stretch" gap="1.5">
										<Text fontSize="sm" fontWeight="medium" color={mainText}>
											{t('products.table.name')}
										</Text>
										<Input name="name" value={formData.name} onChange={handleChange} placeholder={t('products.placeholders.name', 'Nom du produit')} bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" required />
									</VStack>

									<VStack align="stretch" gap="1.5">
										<Text fontSize="sm" fontWeight="medium" color={mainText}>
											{t('products.table.category')}
										</Text>
										<PopoverSelect 
											value={formData.categoryId} 
											onChange={handleCategoryChange} 
											placeholder={t('products.all_categories')} 
											options={categoryOptions} 
											mainText={mainText} 
											subText={subText} 
											borderColor={inputBorder} 
											bg={inputBg} 
											hoverBg={selectHoverBg} 
											selectedBg={selectSelectedBg} 
										/>
									</VStack>

									<HStack gap="4" wrap="wrap">
										<VStack align="stretch" gap="1.5" flex="1" minW="150px">
											<Text fontSize="sm" fontWeight="medium" color={mainText}>
												{t('products.table.price')}
											</Text>
											<Input name="price" type="number" step="1" value={formData.price} onChange={handleChange} placeholder="0" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" required />
										</VStack>
										<VStack align="stretch" gap="1.5" flex="1" minW="150px">
											<Text fontSize="sm" fontWeight="medium" color={mainText}>
												{t('products.table.stock')}
											</Text>
											<Input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} placeholder="0" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" required />
										</VStack>
										<VStack align="stretch" gap="1.5" flex="1" minW="150px">
											<Text fontSize="sm" fontWeight="medium" color={mainText}>
												{t('products.table.min_stock', 'Seuil d\'alerte')}
											</Text>
											<Input name="minStockThreshold" type="number" value={formData.minStockThreshold} onChange={handleChange} placeholder="10" bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" />
										</VStack>
									</HStack>
								</Stack>
							</form>
						</Dialog.Body>
						<Dialog.Footer mt="8" gap="3">
							<Button variant="outline" h="11" px="6" borderRadius="xl" borderColor={borderColor} color={mainText} _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50' }} onClick={onClose} disabled={loading} >
								{t('common.cancel', 'Annuler')}
							</Button>
							<Button type="submit" form="add-product-form" h="11" px="8" borderRadius="xl" bg="primary" color="white" _hover={{ bg: 'blue.600' }} loading={loading} >
								{t('products.add_product')}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default AddProductModal;
