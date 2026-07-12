import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Badge, Box, Button, Flex, HStack, IconButton, Input, InputGroup, Popover, Portal, TableBody, TableCell, TableColumnHeader, TableHeader, TableRoot, TableRow, Text, VStack, Spinner, Center, SimpleGrid } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../components/ui/color-mode';
import Icon from '../../components/ui/Icon';
import { API_BASE_URL, authHeaders } from '../../config/api';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    reference: string;
    name: string;
    price: number;
    stockQuantity: number;
    minStockThreshold: number;
    category: Category;
}

type StockVariant = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

const DEFAULT_PAGE_SIZE = 5;

const TableCheckbox = ({ checked, onCheckedChange, indeterminate }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; indeterminate?: boolean }) => (
    <Box as="label" cursor="pointer">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            ref={(el) => {
                if (el) el.indeterminate = !!indeterminate;
            }}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
    </Box>
);

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
                <Button variant="outline" h="10" px="3" minW="220px" justifyContent="space-between" borderColor={borderColor} bg={bg} _hover={{ bg: hoverBg }} gap="3" >
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
                    <Popover.Content bg={bg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p="2" shadow="lg" w="full" maxW="full" >
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

const SortableHeader = ({
    label,
    field,
    currentSortBy,
    currentSortOrder,
    onSort,
    subText
}: {
    label: string;
    field: string;
    currentSortBy: string;
    currentSortOrder: 'ASC' | 'DESC';
    onSort: (field: string) => void;
    subText: string;
}) => {
    const isSorted = currentSortBy === field;
    return (
        <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" cursor="pointer" onClick={() => onSort(field)} _hover={{ color: 'primary' }}>
            <HStack gap="1">
                <Text>{label}</Text>
                {isSorted ? (
                    <Icon name={currentSortOrder === 'ASC' ? 'arrow_upward' : 'arrow_downward'} size={16} />
                ) : (
                    <Icon name="swap_vert" size={16} />
                )}
            </HStack>
        </TableColumnHeader>
    );
};

const ProductsListTabContent = () => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const mainText = 'textMain';
    const subText = 'textSub';
    const borderColor = 'border';
    const cardBg = 'card';
    const inputBg = 'inputBg';
    const inputBorder = 'inputBorder';
    const hoverRowBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50';
    const toolbarBg = cardBg;
    const selectHoverBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50';
    const selectSelectedBg = colorMode === 'dark' ? 'blue.900/20' : 'blue.50';
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryValue, setCategoryValue] = useState('');
    const [stockValue, setStockValue] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                headers: authHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL(`${API_BASE_URL}/products`);
            if (debouncedSearchTerm) url.searchParams.append('search', debouncedSearchTerm);
            if (sortBy) url.searchParams.append('sortBy', sortBy);
            if (sortOrder) url.searchParams.append('sortOrder', sortOrder);
            if (categoryValue) url.searchParams.append('category', categoryValue);
            if (stockValue) {
                const statusMap: Record<string, string> = {
                    'En stock': 'IN_STOCK',
                    'Faible stock': 'LOW_STOCK',
                    'Rupture': 'OUT_OF_STOCK'
                };
                url.searchParams.append('stockStatus', statusMap[stockValue]);
            }
            url.searchParams.append('page', currentPage.toString());
            url.searchParams.append('limit', DEFAULT_PAGE_SIZE.toString());

            const response = await fetch(url.toString(), {
                headers: authHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data.items || []);
                setTotalItems(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / DEFAULT_PAGE_SIZE));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, sortBy, sortOrder, categoryValue, stockValue, currentPage]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, categoryValue, stockValue]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
    };

    const filteredProducts = useMemo(() => {
        return products;
    }, [products]);

    const categoryOptions: PopoverOption[] = useMemo(() => {
        return categories.map(cat => ({ value: cat.name, label: cat.name }));
    }, [categories]);

    const stockOptions: PopoverOption[] = useMemo(
        () => [
            { value: 'En stock', label: t('products.in_stock') },
            { value: 'Faible stock', label: t('products.low_stock') },
            { value: 'Rupture', label: t('products.out_of_stock') },
        ],
        [t]
    );

    const totalResults = totalItems;
    const from = totalResults === 0 ? 0 : (currentPage - 1) * DEFAULT_PAGE_SIZE + 1;
    const to = Math.min(currentPage * DEFAULT_PAGE_SIZE, totalResults);

    const getStockStyle = (quantity: number, threshold: number) => {
        if (quantity <= 0) {
            return {
                bg: colorMode === 'dark' ? 'red.900/30' : 'red.50',
                color: colorMode === 'dark' ? 'red.300' : 'red.700',
                borderColor: colorMode === 'dark' ? 'red.800' : 'red.200',
                dotBg: 'red.500',
                label: t('products.out_of_stock')
            };
        }
        if (quantity <= threshold) {
            return {
                bg: colorMode === 'dark' ? 'orange.900/30' : 'orange.50',
                color: colorMode === 'dark' ? 'orange.300' : 'orange.700',
                borderColor: colorMode === 'dark' ? 'orange.800' : 'orange.200',
                dotBg: 'orange.500',
                label: `${quantity} ${t('products.in_stock')}`
            };
        }
        return {
            bg: colorMode === 'dark' ? 'green.900/30' : 'green.50',
            color: colorMode === 'dark' ? 'green.300' : 'green.700',
            borderColor: colorMode === 'dark' ? 'green.800' : 'green.200',
            dotBg: 'green.500',
            label: `${quantity} ${t('products.in_stock')}`
        };
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredProducts.map((p) => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((i) => i !== id));
        }
    };

    const isAllSelected = filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < filteredProducts.length;

    return (
        <Flex direction="column" gap="6">
            <Flex bg={toolbarBg} p="4" borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="sm" justify="space-between" align="center" wrap="wrap" gap="4">
                <InputGroup maxW="md" minW="280px" startElement={<Icon name="search" size={20} />} startElementProps={{ color: subText }}>
                    <Input placeholder={t('products.search_placeholder')} bg={inputBg} border="1px solid" borderColor={inputBorder} _focus={{ borderColor: 'primary', outline: 'none' }} borderRadius="lg" fontSize="sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </InputGroup>
                <HStack gap="3" overflowX="auto" pb={{ base: '1', sm: '0' }}>
                    <PopoverSelect value={categoryValue} onChange={setCategoryValue} placeholder={t('products.all_categories')} options={categoryOptions} mainText={mainText} subText={subText} borderColor={inputBorder} bg={cardBg} hoverBg={selectHoverBg} selectedBg={selectSelectedBg} />
                    <PopoverSelect value={stockValue} onChange={setStockValue} placeholder={t('products.stock_status')} options={stockOptions} mainText={mainText} subText={subText} borderColor={inputBorder} bg={cardBg} hoverBg={selectHoverBg} selectedBg={selectSelectedBg} />
                    <Flex align="center" bg={inputBg} border="1px solid" borderColor={inputBorder} borderRadius="lg" p="1">
                        <IconButton aria-label="List view" size="sm" variant="ghost" bg={viewMode === 'list' ? cardBg : 'transparent'} shadow={viewMode === 'list' ? 'sm' : 'none'} color={viewMode === 'list' ? 'primary' : subText} _focusVisible={{ outline: 'none' }} onClick={() => setViewMode('list')} >
                            <Icon name="format_list_bulleted" size={20} />
                        </IconButton>
                        <IconButton aria-label="Grid view" size="sm" variant="ghost" bg={viewMode === 'grid' ? cardBg : 'transparent'} shadow={viewMode === 'grid' ? 'sm' : 'none'} color={viewMode === 'grid' ? 'primary' : subText} _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.100', color: mainText }} _focusVisible={{ outline: 'none' }} onClick={() => setViewMode('grid')} >
                            <Icon name="grid_view" size={20} />
                        </IconButton>
                    </Flex>
                </HStack>
            </Flex>
            <Box bg={viewMode === 'list' ? cardBg : 'transparent'} borderRadius="xl" border={viewMode === 'list' ? '1px solid' : 'none'} borderColor={borderColor} boxShadow={viewMode === 'list' ? 'sm' : 'none'} overflow="hidden">
                {loading ? (
                    <Center py={20} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                        <VStack gap={3}>
                            <Spinner size="xl" color="primary" borderWidth="4px" />
                            <Text color={subText} fontWeight="medium">{t('common.loading')}</Text>
                        </VStack>
                    </Center>
                ) : filteredProducts.length === 0 ? (
                    <Center py={20} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                        <VStack gap={2}>
                            <Icon name="inventory_2" size={48} color="gray" />
                            <Text color={subText} fontSize="lg">{t('common.no_results')}</Text>
                        </VStack>
                    </Center>
                ) : viewMode === 'list' ? (
                    <Box overflowX="auto">
                        <TableRoot>
                            <TableHeader>
                                <TableRow bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}>
                                    <TableColumnHeader px="4" py="4" w="12">
                                        <TableCheckbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={toggleSelectAll} />
                                    </TableColumnHeader>
                                    <SortableHeader label={t('products.table.ref')} field="reference" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} subText={subText} />
                                    <SortableHeader label={t('products.table.name')} field="name" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} subText={subText} />
                                    <SortableHeader label={t('products.table.category')} field="category.name" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} subText={subText} />
                                    <SortableHeader label={t('products.table.price')} field="price" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} subText={subText} />
                                    <SortableHeader label={t('products.table.stock')} field="stockQuantity" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} subText={subText} />
                                    <TableColumnHeader px="4" py="4" fontSize="xs" color={subText} textTransform="uppercase" letterSpacing="wider" textAlign="right" >
                                        {t('products.table.actions')}
                                    </TableColumnHeader>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => {
                                    const stockStyle = getStockStyle(product.stockQuantity, product.minStockThreshold);
                                    return (
                                        <TableRow key={product.id} _hover={{ bg: hoverRowBg }} transition="background 0.2s">
                                            <TableCell px="4" py="4">
                                                <TableCheckbox checked={selectedIds.includes(product.id)} onCheckedChange={(checked) => toggleSelectOne(product.id, checked)} />
                                            </TableCell>
                                            <TableCell px="4" py="4">
                                                <Text fontSize="xs" color={subText} fontFamily="mono">
                                                    {product.reference}
                                                </Text>
                                            </TableCell>
                                            <TableCell px="4" py="4">
                                                <Text fontSize="sm" fontWeight="semibold" color={mainText}>
                                                    {product.name}
                                                </Text>
                                            </TableCell>
                                            <TableCell px="4" py="4" fontSize="sm" color={mainText}>
                                                {product.category?.name || '-'}
                                            </TableCell>
                                            <TableCell px="4" py="4" fontSize="sm" fontWeight="medium" color={mainText}>
                                                {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(product.price)}
                                            </TableCell>
                                            <TableCell px="4" py="4">
                                                <Badge px="2.5" py="1" borderRadius="full" fontSize="xs" fontWeight="medium" bg={stockStyle.bg} color={stockStyle.color} border="1px solid" borderColor={stockStyle.borderColor} display="inline-flex" alignItems="center" gap="1.5" textTransform="none">
                                                    <Box w="1.5" h="1.5" borderRadius="full" bg={stockStyle.dotBg} />
                                                    {stockStyle.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell px="4" py="4" textAlign="right">
                                                <HStack justify="flex-end" gap="2">
                                                    <IconButton aria-label="Modifier" size="sm" variant="ghost" color={subText} _hover={{ bg: cardBg, color: 'primary', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }}>
                                                        <Icon name="edit" size={18} />
                                                    </IconButton>
                                                    <IconButton aria-label="Supprimer" size="sm" variant="ghost" color={subText} _hover={{ bg: cardBg, color: 'red.600', boxShadow: 'sm' }} _focusVisible={{ outline: 'none' }}>
                                                        <Icon name="delete" size={18} />
                                                    </IconButton>
                                                </HStack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </TableRoot>
                    </Box>
                ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} gap="6">
                        {filteredProducts.map((product) => {
                            const stockStyle = getStockStyle(product.stockQuantity, product.minStockThreshold);
                            return (
                                <Box key={product.id} bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={borderColor} overflow="hidden" transition="all 0.3s" _hover={{ transform: 'translateY(-4px)', shadow: 'xl', borderColor: 'primary' }} position="relative" role="group" >
                                    <VStack p="5" align="stretch" gap="4">
                                        <Flex justify="space-between" align="center">
                                            <TableCheckbox checked={selectedIds.includes(product.id)} onCheckedChange={(checked) => toggleSelectOne(product.id, checked)} />
                                            <Badge px="2.5" py="1" borderRadius="full" fontSize="xs" fontWeight="bold" bg={stockStyle.bg} color={stockStyle.color} border="1px solid" borderColor={stockStyle.borderColor} >
                                                {stockStyle.label}
                                            </Badge>
                                        </Flex>
                                        <VStack align="stretch" gap="1">
                                            <Text fontSize="xs" color={subText} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                                                {product.category?.name || t('products.no_category')}
                                            </Text>
                                            <Text fontSize="md" fontWeight="bold" color={mainText} lineClamp={1}>
                                                {product.name}
                                            </Text>
                                            <Text fontSize="xs" color={subText} fontFamily="mono">
                                                {product.reference}
                                            </Text>
                                        </VStack>
                                        <Flex justify="space-between" align="center" pt="2" borderTop="1px solid" borderColor={borderColor}>
                                            <Text fontSize="lg" fontWeight="black" color="primary">
                                                {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(product.price)}
                                            </Text>
                                            <HStack gap="1" opacity="0" _groupHover={{ opacity: 1 }} transition="opacity 0.2s">
                                                <IconButton aria-label="Modifier" size="sm" variant="subtle" colorScheme="blue" borderRadius="lg">
                                                    <Icon name="edit" size={18} />
                                                </IconButton>
                                                <IconButton aria-label="Supprimer" size="sm" variant="subtle" colorScheme="red" borderRadius="lg">
                                                    <Icon name="delete" size={18} />
                                                </IconButton>
                                            </HStack>
                                        </Flex>
                                    </VStack>
                                </Box>
                            );
                        })}
                    </SimpleGrid>
                )}

                <Flex justify="space-between" align="center" p="4" borderTop="1px solid" borderColor={borderColor} bg={cardBg}>
                    <Text fontSize="sm" color={subText}>
                        {t('products.pagination.showing')} <Text as="span" fontWeight="medium" color={mainText}>{from}</Text> {t('products.pagination.to')} <Text as="span" fontWeight="medium" color={mainText}>{to}</Text> {t('products.pagination.of')} <Text as="span" fontWeight="medium" color={mainText}>{totalResults}</Text> {t('products.pagination.results')}
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
    );
};

export default ProductsListTabContent;