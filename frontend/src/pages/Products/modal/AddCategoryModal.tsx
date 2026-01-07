import React, { useState, useMemo } from 'react';
import {
	Button,
	Dialog,
	Flex,
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
import { SnackbarContent } from '../../../components/ui/Snackbar';

interface AddCategoryModalProps {
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
					<span className="material-symbols-outlined" style={{ fontSize: '20px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: subText, }} >
						expand_more
					</span>
				</Button>
			</Popover.Trigger>
			<Portal>
				<Popover.Positioner>
					<Popover.Content bg={bg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p="2" shadow="lg" w="full" maxW="full" zIndex="popover">
						<VStack align="stretch" gap="1">
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

const AddCategoryModal = ({ isOpen, onClose, onSuccess }: AddCategoryModalProps) => {
	const { t } = useTranslation();
	const { colorMode } = useColorMode();
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		name: '',
		description: '',
		status: 'ACTIVE',
	});

	const mainText = 'textMain';
	const subText = 'textSub';
	const borderColor = 'border';
	const bg = 'card';
	const inputBg = 'inputBg';
	const inputBorder = 'inputBorder';
	const selectHoverBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50';
	const selectSelectedBg = colorMode === 'dark' ? 'blue.900/20' : 'blue.50';

	const statusOptions: PopoverOption[] = [
		{ value: 'ACTIVE', label: t('products.categories.active') },
		{ value: 'INACTIVE', label: t('products.categories.inactive') },
	];

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleStatusChange = (value: string) => {
		setFormData((prev) => ({ ...prev, status: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMessage(null);
		try {
			const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
			const response = await fetch('http://localhost:3000/api/v1/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				onSuccess();
				onClose();
				setFormData({
					name: '',
					description: '',
					status: 'ACTIVE',
				});
			} else {
				const errorData = await response.json();
				setErrorMessage(errorData.message || 'Error creating category');
			}
		} catch (error) {
			console.error('Error creating category:', error);
			setErrorMessage('An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !loading && onClose()} placement="center" size="md">
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content bg={bg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="6" shadow="2xl">
						<Dialog.Header>
							<Dialog.Title fontSize="2xl" fontWeight="bold">
								{t('products.categories.new_category')}
							</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body pt="6">
							<form id="add-category-form" onSubmit={handleSubmit}>
								<Stack gap="5">
									<VStack align="stretch" gap="1.5">
										<Text fontSize="sm" fontWeight="medium" color={mainText}>
											{t('products.table.name')}
										</Text>
										<Input name="name" value={formData.name} onChange={handleChange} placeholder={t('products.categories.name_placeholder', 'Nom de la catégorie')} bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" required />
									</VStack>

									<VStack align="stretch" gap="1.5">
										<Text fontSize="sm" fontWeight="medium" color={mainText}>
											{t('products.table.description')}
										</Text>
										<Textarea name="description" value={formData.description} onChange={handleChange} placeholder={t('products.categories.desc_placeholder', 'Description de la catégorie')} bg={inputBg} borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" rows={4} />
									</VStack>

									<Flex gap="4">
										<VStack align="stretch" gap="1.5" flex="1">
											<Text fontSize="sm" fontWeight="medium" color={mainText}>
												{t('products.table.status')}
											</Text>
											<PopoverSelect value={formData.status}
												onChange={handleStatusChange}
												placeholder={t('products.table.status')}
												options={statusOptions}
												mainText={mainText}
												subText={subText}
												borderColor={inputBorder}
												bg={inputBg}
												hoverBg={selectHoverBg}
												selectedBg={selectSelectedBg}
											/>
										</VStack>
									</Flex>
								</Stack>
							</form>
						</Dialog.Body>
						<Dialog.Footer mt="8" gap="3">
							<Button variant="outline" h="11" px="6" borderRadius="xl" borderColor={borderColor} color={mainText} _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50' }} onClick={onClose} disabled={loading} >
								{t('common.cancel', 'Annuler')}
							</Button>
							<Button type="submit" form="add-category-form" h="11" px="8" borderRadius="xl" bg="primary" color="white" _hover={{ bg: 'blue.600' }} loading={loading} >
								{t('products.categories.new_category')}
							</Button>
						</Dialog.Footer>
						{errorMessage && <SnackbarContent message={errorMessage} isError />}
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default AddCategoryModal;
