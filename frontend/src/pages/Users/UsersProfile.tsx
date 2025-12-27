import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    Heading,
    VStack,
    HStack,
    Button,
    Input,
    Avatar,
    Badge,
    Separator,
    Container,
    IconButton,
    Portal,
    Tabs,
    Field
} from '@chakra-ui/react';
import { useColorMode } from '../../components/ui/color-mode';
import Sidebar from '../../components/navigation/sidebar';

const UsersProfile = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const [user, setUser] = useState<{ username: string; email: string; role: string; profilePicture?: string } | null>(null);
    const [activeSection, setActiveSection] = useState('settings__information');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const mainText = "textMain";
    const subText = "textSub";
    const borderColor = "border";
    const cardBg = "card";
    const contentBg = "background";

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
        const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

        try {
            const response = await fetch(`${baseUrl}/api/v1/auth/upload-avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    const storage = window.localStorage.getItem('access_token') ? window.localStorage : window.sessionStorage;
                    storage.setItem('access_token', data.access_token);
                }
                fetchProfile();
            }
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        const container = document.getElementById('main-content-area');
        if (element && container) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const relativeOffset = elementRect.top - containerRect.top + container.scrollTop;
            container.scrollTo({
                top: relativeOffset - 20,
                behavior: "smooth"
            });

            setActiveSection(sectionId);
        } else if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(sectionId);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <Sidebar>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
            <Box w="full" minH="full" transition="all 0.3s">
                <Container maxW="container.xl" py={8}>
                    <VStack align="stretch" gap={8}>
                        <Box px={{ base: 4, md: 0 }}>
                            <Heading size="4xl" fontWeight="900" letterSpacing="tight" mb={2} color={mainText}>
                                Profil Administrateur
                            </Heading>
                            <Text color={subText} fontSize="md">
                                Gérez vos informations personnelles et vos paramètres de sécurité.
                            </Text>
                        </Box>
                        <Box bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" p={6}>
                            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={6}>
                                <Flex align="center" gap={6}>
                                    <Box position="relative" role="group">
                                        <Avatar.Root w="24" h="24" ring="4px solid" ringColor={colorMode === 'light' ? "gray.50" : "gray.800"}>
                                            <Avatar.Image src={user?.profilePicture} />
                                            <Avatar.Fallback name={user?.username} />
                                        </Avatar.Root>
                                        <IconButton aria-label="Edit avatar" position="absolute" bottom="0" right="0" size="xs" rounded="full" bg="primary" color="white" shadow="lg" _hover={{ bg: "blue.700" }} opacity="0" _groupHover={{ opacity: 1 }} transition="all 0.2s" onClick={() => fileInputRef.current?.click()}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                                        </IconButton>
                                    </Box>
                                    <VStack align="flex-start" gap={1}>
                                        <Heading size="2xl" color={mainText}>{user?.username || "Jean Dupont"}</Heading>
                                        <Text color={subText} fontWeight="medium">Gestionnaire de Stock</Text>
                                        <HStack gap={2} mt={2}>
                                            <Badge bg="green.50" color="green.700" ring="1px solid" ringColor="green.600/20" rounded="full" px={2}>Compte Actif</Badge>
                                            <Badge bg="blue.50" color="blue.700" ring="1px solid" ringColor="blue.600/20" rounded="full" px={2}>{user?.role || "Admin"}</Badge>
                                        </HStack>
                                    </VStack>
                                </Flex>
                                <Button variant="outline" gap={2} rounded="lg" h="10" px={4} fontWeight="bold" color={colorMode === 'light' ? "#111418" : "white"} bg={colorMode === 'light' ? "white" : "transparent"} borderColor={borderColor} _hover={{ bg: colorMode === 'light' ? "gray.50" : "rgba(255, 255, 255, 0.05)", borderColor: colorMode === 'light' ? "gray.300" : borderColor }} w={{ base: "full", md: "auto" }} onClick={() => fileInputRef.current?.click()}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_camera</span>
                                    Modifier photo
                                </Button>
                            </Flex>
                        </Box>
                        <Flex direction={{ base: "column", lg: "row" }} gap={8}>
                            <Box w={{ base: "full", lg: "64" }} flexShrink={0} className="settings__menu">
                                <Box position={{ lg: "sticky" }} top={{ lg: "24" }} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" overflow="hidden">
                                    <VStack align="stretch" gap={0}>
                                        <Button variant="ghost" justifyContent="flex-start" h="14" px={6} rounded="none" gap={3} position="relative" bg={activeSection === 'settings__information' ? (colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.2)") : "transparent"} color={activeSection === 'settings__information' ? "primary" : subText} fontWeight={activeSection === 'settings__information' ? "bold" : "medium"} _before={activeSection === 'settings__information' ? { content: '""', position: 'absolute', left: '0', top: '20%', height: '60%', width: '4px', bg: 'primary', borderTopRightRadius: 'full', borderBottomRightRadius: 'full', } : {}} _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.800", color: activeSection === 'settings__information' ? "primary" : mainText }} onClick={() => scrollToSection('settings__information')}>
                                            <span className="material-symbols-outlined">person</span>
                                            Informations
                                        </Button>
                                        <Button variant="ghost" justifyContent="flex-start" h="14" px={6} rounded="none" gap={3} position="relative" bg={activeSection === 'settings__preference' ? (colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.2)") : "transparent"} color={activeSection === 'settings__preference' ? "primary" : subText} fontWeight={activeSection === 'settings__preference' ? "bold" : "medium"} _before={activeSection === 'settings__preference' ? { content: '""', position: 'absolute', left: '0', top: '20%', height: '60%', width: '4px', bg: 'primary', borderTopRightRadius: 'full', borderBottomRightRadius: 'full', } : {}} _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.800", color: activeSection === 'settings__preference' ? "primary" : mainText }} onClick={() => scrollToSection('settings__preference')}>
                                            <span className="material-symbols-outlined">settings</span>
                                            Préférences
                                        </Button>
                                        <Button variant="ghost" justifyContent="flex-start" h="14" px={6} rounded="none" gap={3} position="relative" bg={activeSection === 'settings__security' ? (colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.2)") : "transparent"} color={activeSection === 'settings__security' ? "primary" : subText} fontWeight={activeSection === 'settings__security' ? "bold" : "medium"} _before={activeSection === 'settings__security' ? { content: '""', position: 'absolute', left: '0', top: '20%', height: '60%', width: '4px', bg: 'primary', borderTopRightRadius: 'full', borderBottomRightRadius: 'full', } : {}} _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.800", color: activeSection === 'settings__security' ? "primary" : mainText }} onClick={() => scrollToSection('settings__security')}>
                                            <span className="material-symbols-outlined">lock</span>
                                            Sécurité
                                        </Button>
                                    </VStack>
                                </Box>
                            </Box>
                            <VStack flex={1} gap={6} align="stretch">
                                <Box id="settings__information" bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" p={{ base: 6, md: 8 }} scrollMarginTop="100px">
                                    <Flex align="center" justify="space-between" mb={6}>
                                        <Heading size="md" color={mainText}>Informations Personnelles</Heading>
                                        {!isEditing && (
                                            <Button variant="ghost" bg={colorMode === 'light' ? "transparent" : "#111418"} color="primary" size="sm" fontWeight="bold" _hover={{ bg: colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.15)", }} onClick={() => setIsEditing(true)}>
                                                Modifier
                                            </Button>
                                        )}
                                    </Flex>
                                    <VStack gap={6} align="stretch">
                                        <Flex direction={{ base: "column", md: "row" }} gap={6}>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Prénom</Text>
                                                <Input h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRing={isEditing ? "2px solid" : "none"} focusRingColor="primary" defaultValue="Jean" readOnly={!isEditing} cursor={!isEditing ? "default" : "text"} transition="all 0.2s" />
                                            </Box>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Nom</Text>
                                                <Input h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRing={isEditing ? "2px solid" : "none"} focusRingColor="primary" defaultValue="Dupont" readOnly={!isEditing} cursor={!isEditing ? "default" : "text"} transition="all 0.2s" />
                                            </Box>
                                        </Flex>
                                        <Box>
                                            <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Email Professionnel</Text>
                                            <Box position="relative">
                                                <Box position="absolute" left="3" top="2.5" color="gray.400" zIndex="1" pointerEvents="none">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
                                                </Box>
                                                <Input h="11" rounded="lg" bg={colorMode === 'light' ? "gray.100" : "gray.900"} borderColor={borderColor} color="gray.500" pl="10" pr="4" focusRing="none" value={user?.email || ""} cursor="not-allowed" disabled />
                                            </Box>
                                        </Box>
                                        <Flex direction={{ base: "column", md: "row" }} gap={6}>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Numéro de téléphone</Text>
                                                <Input h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRing={isEditing ? "2px solid" : "none"} focusRingColor="primary" defaultValue="+33 6 12 34 56 78" readOnly={!isEditing} cursor={!isEditing ? "default" : "text"} transition="all 0.2s" />
                                            </Box>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Poste</Text>
                                                <Input h="11" rounded="lg" bg={colorMode === 'light' ? "gray.100" : "gray.900"} color="gray.500" px={4} cursor="not-allowed" disabled defaultValue="Gestionnaire de Stock" />
                                            </Box>
                                        </Flex>
                                    </VStack>
                                    <Box maxH={isEditing ? "100px" : "0"} opacity={isEditing ? 1 : 0} mt={isEditing ? 8 : 0} overflow="hidden" transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)">
                                        <Flex justify="flex-end" gap={3}>
                                            <Button variant="outline" h="10" px={6} rounded="lg" borderColor={borderColor} color={colorMode === 'light' ? "#111418" : "white"} bg={colorMode === 'light' ? "white" : "transparent"} fontWeight="bold" _hover={{ bg: colorMode === 'light' ? "gray.50" : "rgba(255, 255, 255, 0.05)", borderColor: colorMode === 'light' ? "gray.300" : borderColor }} onClick={() => setIsEditing(false)} >
                                                Annuler
                                            </Button>
                                            <Button h="10" px={6} rounded="lg" bg="primary" color="white" fontWeight="bold" shadow="sm" _hover={{ bg: "blue.700" }}>
                                                Enregistrer les modifications
                                            </Button>
                                        </Flex>
                                    </Box>
                                </Box>
                                <Box id="settings__preference" bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" p={{ base: 6, md: 8 }} scrollMarginTop="100px">
                                    <Heading size="md" color={mainText} mb={6}>Préférences</Heading>
                                    <VStack gap={6} align="stretch" mt={2}>
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text color={mainText} fontWeight="medium" fontSize="sm">Langue de l'interface</Text>
                                                <Text color={subText} fontSize="xs">Choisissez la langue d'affichage par défaut.</Text>
                                            </Box>
                                            <select className='language-select' style={{ height: '40px', borderRadius: '8px', border: '1px solid', borderColor: colorMode === 'light' ? "#e2e8f0" : "var(--chakra-colors-border)", backgroundColor: colorMode === 'light' ? "white" : "var(--chakra-colors-card)", color: colorMode === 'light' ? "#111418" : "var(--chakra-colors-textMain)", padding: '0 12px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                                                <option>Français</option>
                                                <option>English</option>
                                                <option>Malagasy</option>
                                            </select>
                                        </Flex>
                                        <Separator color={borderColor} opacity={0.6} />
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text color={mainText} fontWeight="medium" fontSize="sm">Mode Sombre</Text>
                                                <Text color={subText} fontSize="xs">Ajuster l'apparence de l'application.</Text>
                                            </Box>
                                            <Box w="10" h="5" bg={colorMode === 'dark' ? "primary" : "gray.300"} rounded="full" position="relative" cursor="pointer" transition="all 0.3s ease" onClick={toggleColorMode} _hover={{ opacity: 0.8 }}>
                                                <Box position="absolute" top="0.5" left={colorMode === 'dark' ? "5" : "0.5"} boxSize="4" bg="white" rounded="full" shadow="sm" transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" />
                                            </Box>
                                        </Flex>
                                    </VStack>
                                </Box>
                                <Box id="settings__security" bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" p={{ base: 6, md: 8 }} scrollMarginTop="100px">
                                    <Heading size="md" color={mainText} mb={6}>Sécurité</Heading>
                                    <VStack gap={8} align="stretch">
                                        <Box bg={colorMode === 'light' ? "rgba(19, 111, 236, 0.05)" : "rgba(19, 111, 236, 0.15)"} border="1px solid" borderColor="primary/20" rounded="lg" p={4}>
                                            <Flex align="flex-start" gap={3}>
                                                <Box color="primary" mt={0.5}>
                                                    <span className="material-symbols-outlined">verified_user</span>
                                                </Box>
                                                <Box>
                                                    <Text color={mainText} fontWeight="bold" fontSize="sm">Authentification à deux facteurs (2FA)</Text>
                                                    <Text color={subText} fontSize="xs" mt={1}>Votre compte est sécurisé. La 2FA est actuellement activée.</Text>
                                                </Box>
                                                <Button variant="ghost" bg={colorMode === 'light' ? "transparent" : "#111418"} ml="auto" color="primary" size="sm" fontWeight="bold" _hover={{ bg: colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.15)", }}>
                                                    Gérer
                                                </Button>
                                            </Flex>
                                        </Box>
                                        <Box borderTop="1px solid" borderColor={borderColor} pt={6}>
                                            <Text color={mainText} fontWeight="bold" fontSize="sm" mb={4}>Changer de mot de passe</Text>
                                            <VStack gap={4} maxW="md" align="stretch">
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Mot de passe actuel</Text>
                                                    <Input type="password" h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRingColor="primary" placeholder="••••••••" />
                                                </Box>
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Nouveau mot de passe</Text>
                                                    <Input type="password" h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRingColor="primary" placeholder="••••••••" />
                                                </Box>
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>Confirmer le nouveau mot de passe</Text>
                                                    <Input type="password" h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRingColor="primary" placeholder="••••••••" />
                                                </Box>
                                                <Button h="11" bg={colorMode === 'light' ? "primary" : "gray.700"} color="white" fontWeight="bold" rounded="lg" _hover={{ bg: "black" }} mt={2}>
                                                    Mettre à jour le mot de passe
                                                </Button>
                                            </VStack>
                                        </Box>
                                    </VStack>
                                </Box>
                            </VStack>
                        </Flex>
                    </VStack>
                </Container>
            </Box>
        </Sidebar>
    );
};

export default UsersProfile;
