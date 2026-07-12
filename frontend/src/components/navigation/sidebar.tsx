import { Box, Flex, Text, VStack, Span, Link, Avatar, Input, InputGroup, IconButton, Popover, Dialog, Button, Separator, } from '@chakra-ui/react';
import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../ui/Icon';

const INK = '#151A21';
const PAPER = '#EFF1EC';
const AMBER = '#E8A33D';
const SAGE = '#4F7C6B';
const SAGE_DARK = '#3C6053';

const TEXT_MAIN = INK;
const TEXT_SUB = '#5B6675';
const BORDER_COLOR = '#D7DBE1';

const SidebarItem = ({ icon, label, active = false, href = "#" }: {
    icon: string,
    label: string,
    active?: boolean,
    href?: string
}) => {
    return (
        <Link asChild _hover={{ textDecoration: 'none' }} w="full" display="flex">
            <RouterLink to={href}>
                <Flex align="center" gap="3" px="3" py="2.5" rounded="lg" w="full" bg={active ? 'rgba(79, 124, 107, 0.1)' : "transparent"} color={active ? SAGE : TEXT_SUB} _hover={{ bg: active ? 'rgba(79, 124, 107, 0.1)' : PAPER, color: active ? SAGE : SAGE }} transition="all 0.2s" role="group">
                    <Icon name={icon} size={24} color={active ? SAGE : TEXT_SUB} />
                    <Text fontSize="sm" fontWeight="500">
                        {label}
                    </Text>
                </Flex>
            </RouterLink>
        </Link>
    );
};

const NavigationContent = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = React.useState<{ username: string; email: string; role: string; profilePicture?: string } | null>(null);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    React.useEffect(() => {
        const fetchProfile = async () => {
            const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
            if (!token) return;

            try {
                const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
                const response = await fetch(`${baseUrl}/api/v1/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                }
            } catch {
                console.error("Failed to fetch profile");
            }
        };
        fetchProfile();
    }, []);

    const isActive = (path: string) => location.pathname === path;
    const getPageTitle = (path: string) => {
        switch (path) {
            case '/':
            case '/dashboard':
                return t('sidebar.dashboard');
            case '/stock':
                return t('sidebar.stock');
            case '/customers':
                return t('sidebar.customers');
            case '/products':
                return t('sidebar.products');
            case '/orders':
                return t('sidebar.orders');
            case '/profile':
                return t('sidebar.profile');
            default:
                return "StockManager";
        }
    };

    const handleLogout = async () => {
        const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
        if (token) {
            try {
                const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
                await fetch(`${baseUrl}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch {
                console.error("Logout request failed");
            }
        }
        window.localStorage.removeItem('access_token');
        window.sessionStorage.removeItem('access_token');
        setIsLogoutDialogOpen(false);
        navigate('/login', { replace: true });
    };

    return (
        <Flex direction="column" h="100vh" overflow="hidden" bg={PAPER}>
            <Flex h="full" flex="1" overflow="hidden">
                <Box as="aside" w="64" bg="white" borderRight="1px" borderColor={BORDER_COLOR} display={{ base: "none", md: "flex" }} flexDirection="column" zIndex="20">
                    <Flex h="16" align="center" gap="3" px="6" borderBottom="1px" borderColor={BORDER_COLOR}>
                        <Flex w="8" h="8" rounded="md" bg={SAGE} align="center" justify="center" color="white">
                            <Icon name="inventory_2" size={20} />
                        </Flex>
                        <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color={TEXT_MAIN}>
                            StockManager
                        </Text>
                    </Flex>
                    <Separator />
                    <VStack flex="1" overflowY="auto" py="4" px="3" gap="4" align="stretch">
                        <SidebarItem icon="dashboard" label={t('sidebar.dashboard')} href="/dashboard" active={isActive('/dashboard')} />
                        <SidebarItem icon="package_2" label={t('sidebar.stock')} href="/stock" active={isActive('/stock')} />
                        <SidebarItem icon="group" label={t('sidebar.customers')} href="/customers" active={isActive('/customers')} />
                        <SidebarItem icon="sell" label={t('sidebar.products')} href="/products" active={isActive('/products')} />
                        <SidebarItem icon="shopping_cart" label={t('sidebar.orders')} href="/orders" active={isActive('/orders')} />
                        <Separator />
                        <Box mt="0" pt="4" borderTop="1px" borderColor={BORDER_COLOR}>
                            <Text px="3" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" mb="2" color={TEXT_SUB}>
                                {t('sidebar.reports')}
                            </Text>
                            <SidebarItem icon="bar_chart" label={t('sidebar.analysis')} />
                        </Box>
                    </VStack>
                    <Box p="4" borderTop="1px" borderColor={BORDER_COLOR}>
                        <Popover.Root open={isProfileMenuOpen} onOpenChange={(e) => setIsProfileMenuOpen(e.open)} portalled={false} positioning={{ placement: 'top-start', sameWidth: true, fitViewport: true, overflowPadding: 8 }}>
                            <Popover.Trigger asChild>
                                <Flex align="center" gap="3" cursor="pointer" p="2" rounded="lg" _hover={{ bg: PAPER }} transition="all 0.2s">
                                    <Avatar.Root size="sm">
                                        <Avatar.Image src={user?.profilePicture} />
                                        <Avatar.Fallback name={user?.username || "Admin"} />
                                    </Avatar.Root>
                                    <Flex direction="column" overflow="hidden" flex="1">
                                        <Text fontSize="sm" fontWeight="medium" lineClamp={1} color={TEXT_MAIN}>
                                            {user?.username}
                                        </Text>
                                        <Text fontSize="xs" lineClamp={1} color={TEXT_SUB}>
                                            {user?.email}
                                        </Text>
                                    </Flex>
                                    <Box color={TEXT_SUB}>
                                        <Icon name="expand_more" size={20} />
                                    </Box>
                                </Flex>
                            </Popover.Trigger>
                            <Popover.Positioner>
                                <Popover.Content bg="white" borderColor={BORDER_COLOR} borderWidth="1px" borderRadius="xl" p="2" w="full" maxW="full" shadow="lg">
                                    <VStack align="stretch" gap="1">
                                        <Button variant="ghost" justifyContent="flex-start" h="10" w="full" color={TEXT_SUB} bg="transparent" _hover={{ bg: PAPER, color: SAGE }} onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }}>
                                            <Flex align="center" gap="2" w="full">
                                                <Icon name="account_circle" size={20} />
                                                <Text fontSize="sm" fontWeight="500">{t('sidebar.profile')}</Text>
                                            </Flex>
                                        </Button>
                                        <Separator />
                                        <Button variant="ghost" justifyContent="flex-start" h="10" colorPalette="red" w="full" bg="transparent" color="red.500" borderWidth="1px" borderColor="transparent" _hover={{ bg: 'red.50', borderColor: 'red.500' }} onClick={() => { setIsProfileMenuOpen(false); setIsLogoutDialogOpen(true); }}>
                                            <Flex align="center" gap="2" w="full">
                                                <Icon name="logout" size={20} />
                                                <Text fontSize="sm" fontWeight="500">{t('sidebar.logout')}</Text>
                                            </Flex>
                                        </Button>
                                    </VStack>
                                </Popover.Content>
                            </Popover.Positioner>
                        </Popover.Root>
                    </Box>
                </Box>
                <Flex flex="1" direction="column" minW="0" h="full">
                    <Box as="header" h="16" px="6" bg="white" borderBottom="1px" borderColor={BORDER_COLOR} position="sticky" top="0" zIndex="10" display="flex" alignItems="center" justifyContent="space-between">
                        <Flex align="center" gap="4">
                            <IconButton display={{ base: "flex", md: "none" }} aria-label="Menu" variant="ghost" size="sm" color={TEXT_MAIN} _focusVisible={{ outline: 'none' }}>
                                <Icon name="menu" size={24} />
                            </IconButton>
                            <Text fontSize="lg" fontWeight="bold" color={TEXT_MAIN}>
                                {getPageTitle(location.pathname)}
                            </Text>
                        </Flex>
                        <Flex align="center" gap="4" />
                    </Box>
                    <Box id="main-content-area" flex="1" p="6" bg={PAPER} overflowY="auto">
                        {children}
                    </Box>
                </Flex>
            </Flex>
            <Dialog.Root open={isLogoutDialogOpen} onOpenChange={(e) => setIsLogoutDialogOpen(e.open)} placement="center" size="sm" closeOnInteractOutside={false}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg="white" color={TEXT_MAIN} borderColor={BORDER_COLOR} borderWidth="1px" borderRadius="2xl" p="4" shadow="2xl">
                        <Dialog.Header>
                            <Flex direction="column" align="center" gap="4" pt="4" w="full" textAlign="center">
                                <Box boxSize="14" mx="auto" rounded="full" bg="red.50" color="red.500" display="flex" alignItems="center" justifyContent="center">
                                    <Icon name="logout" size={40} />
                                </Box>
                                <Dialog.Title fontSize="xl" fontWeight="bold" textAlign="center" w="full" color={TEXT_MAIN}>
                                    {t('sidebar.logout_confirm')}
                                </Dialog.Title>
                            </Flex>
                        </Dialog.Header>
                        <Dialog.Body pt="2" pb="6">
                            <Text color={TEXT_SUB} textAlign="center">
                                {t('sidebar.logout_desc')}
                            </Text>
                        </Dialog.Body>
                        <Dialog.Footer gap="3">
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" flex="1" h="11" bg="white" color={TEXT_MAIN} borderColor={BORDER_COLOR} _hover={{ bg: PAPER, borderColor: 'transparent' }} onClick={() => setIsLogoutDialogOpen(false)}>
                                    {t('profile.cancel')}
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button colorPalette="red" flex="1" h="11" bg="red.500" color="white" borderWidth="1px" borderColor="transparent" _hover={{ bg: 'red.600', borderColor: 'transparent' }} _focusVisible={{ outline: 'none', boxShadow: 'none', borderColor: 'transparent' }} onClick={handleLogout}>
                                {t('sidebar.logout')}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Flex>
    );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
    return <NavigationContent>{children}</NavigationContent>;
}

export default Sidebar;
