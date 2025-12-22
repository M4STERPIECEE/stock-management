import { Box, Flex, Text, VStack, Span, Link, Avatar, Input, InputGroup, IconButton, ClientOnly, } from '@chakra-ui/react';
import { useColorMode } from '../ui/color-mode';
import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

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
    const searchIconColor = "textSub";
    const location = useLocation();
    const { colorMode, toggleColorMode } = useColorMode();
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
            default:
                return "Gestion des Stocks";
        }
    };

    const buttonIconColor = colorMode === 'light' ? "black" : "white";
    const buttonBg = colorMode === 'light' ? "#e7e7e7ff" : "#1a1a1a";

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
                        <VStack flex="1" overflowY="auto" py="4" px="3" gap="4" align="stretch">
                            <SidebarItem icon="dashboard" label="Dashboard" href="/dashboard" active={isActive('/dashboard')} />
                            <SidebarItem icon="package_2" label="Stock" href="/stock" active={isActive('/stock')} />
                            <SidebarItem icon="group" label="Client" href="/customers" active={isActive('/customers')} />
                            <SidebarItem icon="sell" label="Produit" href="/products" active={isActive('/products')} />
                            <SidebarItem icon="shopping_cart" label="Commandes" href="/orders" active={isActive('/orders')} />
                            <Box mt="4" pt="4" borderTop="1px" borderColor={borderColor}>
                                <Text px="3" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" mb="2" color={subText}>
                                    Rapports
                                </Text>
                                <SidebarItem icon="bar_chart" label="Analyses" />
                            </Box>
                        </VStack>

                        <Box p="4" borderTop="1px" borderColor={borderColor}>
                            <Flex align="center" gap="3">
                                <Avatar.Root size="sm">
                                    <Avatar.Image src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyGE9_jaCHsIhA_wo4JKLDfRxhoHuGBRHuQf1aPH9v-sA0vIJRDc8Kt89d9RHtiGFlv40VMPN5hYKXykFacmpuImgaaNCRjraFOqdxoJ1rZMbPB0yoWBmTlKiHtMlsFr8FZqDREEOwFd0Tx2-npsDXf-eZ8OOrM1pFPv2OpHFiMxQY3sJ9EfwK4bI1H7rYSxSdRr0M3B3Wcid7E1ZqPCiz2FX7rgb9Xd5R_E-Q5V0eQER82r287tSzbzNpPrB4na6CEKsHxkN0dJ5Z" />
                                    <Avatar.Fallback name="Jean Dupont" />
                                </Avatar.Root>
                                <Flex direction="column" overflow="hidden">
                                    <Text fontSize="sm" fontWeight="medium" lineClamp={1} color={mainText}>
                                        Jean Dupont
                                    </Text>
                                    <Text fontSize="xs" lineClamp={1} color={subText}>
                                        Admin
                                    </Text>
                                </Flex>
                            </Flex>
                        </Box>
                    </Box>

                    {/* Main Content Area (Header included based on snippet) */}
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
                                <InputGroup w="64" display={{ base: "none", md: "flex" }} startElement={
                                    <span className="material-symbols-outlined" style={{ color: searchIconColor, fontSize: '20px' }}>
                                        search
                                    </span>}>
                                    <Input placeholder="Rechercher produit..." bg={contentBg} border="1px" borderRadius="4px" borderColor="transparent" _focus={{ borderColor: "primary" }} fontSize="sm" />
                                </InputGroup>
                                <Flex align="center" gap="2">
                                    <Box position="relative">
                                        <IconButton aria-label="Notifications" bg={buttonBg} color={buttonIconColor} _focusVisible={{ outline: 'none' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                                        </IconButton>
                                        <Box position="absolute" top="-2px" right="-2px" boxSize="2" bg="red.500" rounded="full" border="2px" borderColor={bg} />
                                    </Box>
                                    <IconButton aria-label="Settings" bg={buttonBg} color={buttonIconColor} _focusVisible={{ outline: 'none' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                                    </IconButton>
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
                        <Box flex="1" p="6" bg={contentBg} overflowY="auto">
                            {children}
                        </Box>
                    </Flex>
                </Flex>
            </Flex>
        </Span>
    );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
    return <NavigationContent>{children}</NavigationContent>;
}

export default Sidebar;