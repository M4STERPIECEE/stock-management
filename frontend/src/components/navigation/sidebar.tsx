import { Box, Flex, Text, VStack, Span, Link, Avatar, Input, InputGroup, IconButton, ClientOnly, Popover, Dialog, Button, Separator, } from '@chakra-ui/react';
import { useColorMode } from '../ui/color-mode';
import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

const SidebarItem = ({ icon, label, active = false, href = "#" }: {
    icon: string,
    label: string,
    active?: boolean,
    href?: string
}) => {
    const activeColor = "primary";
    const activeBg = "rgba(19, 127, 236, 0.1)";
    const inactiveColor = "textSub";
    const hoverBg = "background";

    return (
        <Link asChild _hover={{ textDecoration: 'none' }} w="full" display="flex">
            <RouterLink to={href}>
                <Flex align="center" gap="3" px="3" py="2.5" rounded="lg" w="full" bg={active ? activeBg : "transparent"} color={active ? activeColor : inactiveColor} _hover={{ bg: active ? activeBg : hoverBg, color: active ? activeColor : "primary" }} transition="all 0.2s" role="group">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0", fontSize: '24px' }}>
                        {icon}
                    </span>
                    <Text fontSize="sm" fontWeight="500">
                        {label}
                    </Text>
                </Flex>
            </RouterLink>
        </Link>
    );
};

const NavigationContent = ({ children }: { children: React.ReactNode }) => {
    const bg = "card";
    const borderColor = "border";
    const mainText = "textMain";
    const subText = "textSub";
    const contentBg = "background";
    const hoverBg = "background";
    const searchIconColor = "textSub";
    const location = useLocation();
    const navigate = useNavigate();
    const { colorMode, toggleColorMode } = useColorMode();
    const [user, setUser] = React.useState<{ username: string; email: string; role: string; profilePicture?: string } | null>(null);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    React.useEffect(() => {
        const fetchProfile = async () => {
            const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
            if (!token) return;

            try {
                const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
                const response = await fetch(`${baseUrl}/api/v1/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    const isActive = (path: string) => location.pathname === path;
    const getPageTitle = (path: string) => {
        switch (path) {
            case '/':
            case '/dashboard':
                return "Vue d'ensemble";
            case '/stock':
                return "Gestion des stocks";
            case '/customers':
                return "Gestion des Clients";
            case '/products':
                return "Gestion des Produits";
            case '/orders':
                return "Gestion des commandes";
            case '/profile':
                return "Profil Administrateur";
            default:
                return "Gestion des Stocks";
        }
    };

    const buttonIconColor = colorMode === 'light' ? "black" : "white";
    const buttonBg = colorMode === 'light' ? "#e7e7e7ff" : "#1a1a1a";

    const handleLogout = async () => {
        const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
        if (token) {
            try {
                const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
                await fetch(`${baseUrl}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error("Logout request failed", error);
            }
        }
        window.localStorage.removeItem('access_token');
        window.sessionStorage.removeItem('access_token');
        setIsLogoutDialogOpen(false);
        navigate('/login', { replace: true });
    };

    return (
        <Span display="contents" className={`chakra-theme ${colorMode}`}>
            <Flex direction="column" h="100vh" overflow="hidden" bg={contentBg}>
                <Flex h="full" flex="1" overflow="hidden">
                    <Box as="aside" w="64" bg={bg} borderRight="1px" borderColor={borderColor} display={{ base: "none", md: "flex" }} flexDirection="column" className="sidebar" zIndex="20">
                        <Flex h="16" align="center" gap="3" px="6" borderBottom="1px" borderColor={borderColor}>
                            <Flex w="8" h="8" rounded="md" bg="primary" align="center" justify="center" color="white">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                            </Flex>
                            <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color={mainText}>
                                StockManager
                            </Text>
                        </Flex>
                        <Separator />
                        <VStack flex="1" overflowY="auto" py="4" px="3" gap="4" align="stretch">
                            <SidebarItem icon="dashboard" label="Dashboard" href="/dashboard" active={isActive('/dashboard')} />
                            <SidebarItem icon="package_2" label="Stock" href="/stock" active={isActive('/stock')} />
                            <SidebarItem icon="group" label="Client" href="/customers" active={isActive('/customers')} />
                            <SidebarItem icon="sell" label="Produit" href="/products" active={isActive('/products')} />
                            <SidebarItem icon="shopping_cart" label="Commandes" href="/orders" active={isActive('/orders')} />
                            <Separator />
                            <Box mt="0" pt="4" borderTop="1px" borderColor={borderColor}>
                                <Text px="3" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" mb="2" color={subText}>
                                    Rapports
                                </Text>
                                <SidebarItem icon="bar_chart" label="Analyses" />
                            </Box>
                        </VStack>
                        <Box p="4" borderTop="1px" borderColor={borderColor}>
                            <Popover.Root open={isProfileMenuOpen} onOpenChange={(e) => setIsProfileMenuOpen(e.open)} portalled={false} positioning={{ placement: 'top-start', sameWidth: true, fitViewport: true, overflowPadding: 8 }}>
                                <Popover.Trigger asChild>
                                    <Flex align="center" gap="3" className='profile-admin' cursor="pointer" p="2" rounded="lg" _hover={{ bg: hoverBg }} transition="all 0.2s">
                                        <Avatar.Root size="sm">
                                            <Avatar.Image src={user?.profilePicture} />
                                            <Avatar.Fallback name={user?.username || "Admin"} />
                                        </Avatar.Root>
                                        <Flex direction="column" overflow="hidden" flex="1">
                                            <Text fontSize="sm" fontWeight="medium" lineClamp={1} color={mainText}>
                                                {user?.username}
                                            </Text>
                                            <Text fontSize="xs" lineClamp={1} color={subText}>
                                                {user?.email}
                                            </Text>
                                        </Flex>
                                        <Box color={subText}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>expand_more</span>
                                        </Box>
                                    </Flex>
                                </Popover.Trigger>
                                <Popover.Positioner>
                                    <Popover.Content bg={bg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p="2" w="full" maxW="full" shadow="lg">
                                        <VStack align="stretch" gap="1">
                                            <Button variant="ghost" justifyContent="flex-start" h="10" w="full" color={subText} bg="transparent" borderWidth="1px" borderColor="transparent" _hover={colorMode === 'dark' ? { bg: hoverBg, color: '#137fec' } : { bg: 'transparent', color: 'primary' }} onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }}>
                                                <Flex align="center" gap="2" w="full">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
                                                    <Text fontSize="sm" fontWeight="500">Profil</Text>
                                                </Flex>
                                            </Button>
                                            <Separator />
                                            <Button variant="ghost" justifyContent="flex-start" h="10" colorPalette="red" w="full" bg="transparent" color="red.500" borderWidth="1px" borderColor="transparent" _hover={colorMode === 'dark' ? { bg: '#101922', borderColor: 'red.500' } : { bg: 'red.50', borderColor: 'red.500' }} onClick={() => { setIsProfileMenuOpen(false); setIsLogoutDialogOpen(true); }}>
                                                <Flex align="center" gap="2" w="full">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                                                    <Text fontSize="sm" fontWeight="500">Log out</Text>
                                                </Flex>
                                            </Button>
                                        </VStack>
                                    </Popover.Content>
                                </Popover.Positioner>
                            </Popover.Root>
                        </Box>
                    </Box>
                    <Separator />
                    <Flex flex="1" direction="column" minW="0" h="full">
                        <Box as="header" h="16" px="6" bg={bg} borderBottom="1px" borderColor={borderColor} position="sticky" top="0" zIndex="10" display="flex" alignItems="center" justifyContent="space-between">
                            <Flex align="center" gap="4" className='title-page'>
                                <IconButton display={{ base: "flex", md: "none" }} aria-label="Menu" variant="ghost" size="sm" color={mainText} _focusVisible={{ outline: 'none' }}>
                                    <span className="material-symbols-outlined">menu</span>
                                </IconButton>
                                <Text fontSize="lg" fontWeight="bold" color={mainText}>
                                    {getPageTitle(location.pathname)}
                                </Text>
                            </Flex>
                            <Flex align="center" gap="4">
                                <Flex align="center" gap="2">
                                    <Box position="relative">
                                        <IconButton aria-label="Notifications" bg={buttonBg} color={buttonIconColor} _focusVisible={{ outline: 'none' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                                        </IconButton>
                                    </Box>
                                    <ClientOnly>
                                        <IconButton aria-label="Toggle Theme" bg={buttonBg} color={buttonIconColor} onClick={toggleColorMode} _focusVisible={{ outline: 'none' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                {colorMode === 'dark' ? 'light_mode' : 'dark_mode'}
                                            </span>
                                        </IconButton>
                                    </ClientOnly>
                                </Flex>
                            </Flex>
                        </Box>
                        <Box id="main-content-area" flex="1" p="6" bg={contentBg} overflowY="auto">
                            {children}
                        </Box>
                    </Flex>
                </Flex >
            </Flex >
            <Dialog.Root open={isLogoutDialogOpen} onOpenChange={(e) => setIsLogoutDialogOpen(e.open)} placement="center" size="sm" closeOnInteractOutside={false}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg={bg} color={mainText} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p="4" shadow="2xl">
                        <Dialog.Header>
                            <Flex direction="column" align="center" gap="4" pt="4" w="full" textAlign="center">
                                <Box boxSize="14" mx="auto" rounded="full" bg="red.50" color="red.500" display="flex" alignItems="center" justifyContent="center">
                                    <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>logout</span>
                                </Box>
                                <Dialog.Title fontSize="xl" fontWeight="bold" textAlign="center" w="full" color={mainText}>
                                    Confirmation de déconnexion
                                </Dialog.Title>
                            </Flex>
                        </Dialog.Header>
                        <Dialog.Body pt="2" pb="6">
                            <Text color={subText} textAlign="center">
                                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre inventaire
                            </Text>
                        </Dialog.Body>
                        <Dialog.Footer gap="3">
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" flex="1" h="11" bg={colorMode === 'dark' ? 'transparent' : 'card'} color={mainText} borderColor={borderColor} _hover={{ bg: hoverBg, borderColor: 'transparent' }} onClick={() => setIsLogoutDialogOpen(false)}>
                                    Annuler
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button colorPalette="red" flex="1" h="11" bg="red.500" color="white" borderWidth="1px" borderColor="transparent" _hover={{ bg: 'red.600', borderColor: 'transparent' }} _focusVisible={{ outline: 'none', boxShadow: 'none', borderColor: 'transparent' }} onClick={handleLogout}>
                                Se déconnecter
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Span >
    );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
    return <NavigationContent>{children}</NavigationContent>;
}

export default Sidebar;