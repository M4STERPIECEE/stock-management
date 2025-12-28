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
    Field,
    Popover,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { useColorMode } from '../../components/ui/color-mode';
import Sidebar from '../../components/navigation/sidebar';
import { useTranslation } from 'react-i18next';

const UsersProfile = () => {
    const { t, i18n } = useTranslation();
    const { colorMode, toggleColorMode } = useColorMode();
    const [user, setUser] = useState<{ username: string; email: string; role: string; profilePicture?: string; phoneNumber?: string; firstName?: string; lastName?: string } | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneCode, setPhoneCode] = useState('+33');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isPhoneMenuOpen, setIsPhoneMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('settings__information');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const hasMinLength = newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    const RequirementItem = ({ met, label }: { met: boolean, label: string }) => (
        <Flex align="center" gap="2" color={met ? "green.500" : "gray.400"}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {met ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <Text fontSize="sm" fontWeight="medium">{label}</Text>
        </Flex>
    );

    const languages = [
        { label: 'Français', code: 'fr', icon: 'translate' },
        { label: 'English', code: 'en', icon: 'language' },
        { label: 'Malagasy', code: 'mg', icon: 'flag' }
    ];

    const countries = [
        { code: '+33', label: 'France', flag: '🇫🇷' },
        { code: '+261', label: 'Madagascar', flag: '🇲🇬' },
        { code: '+1', label: 'USA', flag: '🇺🇸' },
        { code: '+44', label: 'UK', flag: '🇬🇧' },
        { code: '+49', label: 'Germany', flag: '🇩🇪' },
        { code: '+39', label: 'Italy', flag: '🇮🇹' },
        { code: '+34', label: 'Spain', flag: '🇪🇸' },
        { code: '+86', label: 'China', flag: '🇨🇳' },
        { code: '+81', label: 'Japan', flag: '🇯🇵' },
    ];

    const selectedCountry = countries.find(c => c.code === phoneCode) || countries[0];

    const currentLang = languages.find(l => l.code === i18n.language.split('-')[0]) || languages[1];
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
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
                if (data.firstName) setFirstName(data.firstName);
                if (data.lastName) setLastName(data.lastName);
                if (data.phoneNumber) {
                    let foundCode = '+33';
                    let num = '';
                    const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);

                    for (const c of sortedCountries) {
                        if (data.phoneNumber.startsWith(c.code)) {
                            foundCode = c.code;
                            num = data.phoneNumber.slice(c.code.length);
                            break;
                        }
                    }
                    if (!num && data.phoneNumber) {
                        num = data.phoneNumber;
                    }

                    setPhoneCode(foundCode);
                    setPhoneNumber(num);
                } else {
                    setPhoneNumber('');
                    setPhoneCode('+33');
                }
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

    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

    useEffect(() => {
        if (showSuccessSnackbar) {
            const timer = setTimeout(() => {
                setShowSuccessSnackbar(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessSnackbar]);

    const handleSaveProfile = async () => {
        const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
        if (!token) return;
        const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

        const fullPhoneNumber = phoneNumber ? `${phoneCode}${phoneNumber}` : null;

        try {
            const response = await fetch(`${baseUrl}/api/v1/auth/update-profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: fullPhoneNumber,
                    firstName: firstName,
                    lastName: lastName
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    const storage = window.localStorage.getItem('access_token') ? window.localStorage : window.sessionStorage;
                    storage.setItem('access_token', data.access_token);
                }
                setIsEditing(false);
                setShowSuccessSnackbar(true);
                fetchProfile();
            }
        } catch (error) {
            console.error("Failed to update profile", error);
        }
    };

    const handleUpdatePassword = async () => {
        setPasswordError(null);
        if (newPassword !== confirmPassword) {
            setPasswordError("Les mots de passe ne correspondent pas.");
            return;
        }
        if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
            setPasswordError("Le mot de passe ne respecte pas les critères de sécurité.");
            return;
        }

        setIsUpdatingPassword(true);
        const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
        if (!token) return;
        const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

        try {
            const response = await fetch(`${baseUrl}/api/v1/auth/update-profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: newPassword
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    const storage = window.localStorage.getItem('access_token') ? window.localStorage : window.sessionStorage;
                    storage.setItem('access_token', data.access_token);
                }
                setNewPassword('');
                setConfirmPassword('');
                setCurrentPassword('');
                setShowSuccessSnackbar(true);
            } else {
                setPasswordError("Erreur lors de la mise à jour du mot de passe.");
            }
        } catch (e) {
            setPasswordError("Erreur réseau.");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const SnackbarContent = ({ message }: { message: string }) => {
        return (
            <Portal>
                <Box position="fixed" bottom={8} left="50%" transform="translateX(-50%)" bg="green.600" color="white" px={6} py={3} borderRadius="lg" boxShadow="xl" display="flex" alignItems="center" gap={3} zIndex={9999} animation="fade-in 0.3s">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>check_circle</span>
                    <Text fontSize="md" fontWeight="medium">{message}</Text>
                </Box>
            </Portal>
        );
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
            {showSuccessSnackbar && <SnackbarContent message={t('profile.save_success')} />}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
            <Box w="full" minH="full" transition="all 0.3s">
                <Container maxW="container.xl" py={8}>
                    <VStack align="stretch" gap={8}>
                        <Box px={{ base: 4, md: 0 }}>
                            <Heading size="4xl" fontWeight="900" letterSpacing="tight" mb={2} color={mainText}>
                                {t('profile.title')}
                            </Heading>
                            <Text color={subText} fontSize="md">
                                {t('profile.subtitle')}
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
                                        <Heading size="2xl" color={mainText}>
                                            {user?.firstName || user?.lastName
                                                ? `${user?.firstName || ''} ${user?.lastName || ''} (${user?.username})`
                                                : (user?.username)
                                            }
                                        </Heading>
                                        <Text color={subText} fontWeight="medium">Gestionnaire de Stock</Text>
                                        <HStack gap={2} mt={2}>
                                            <Badge bg="green.50" color="green.700" ring="1px solid" ringColor="green.600/20" rounded="full" px={2}>Compte Actif</Badge>
                                            <Badge bg="blue.50" color="blue.700" ring="1px solid" ringColor="blue.600/20" rounded="full" px={2}>{user?.role || "Admin"}</Badge>
                                        </HStack>
                                    </VStack>
                                </Flex>
                                <Button variant="outline" gap={2} rounded="lg" h="10" px={4} fontWeight="bold" color={colorMode === 'light' ? "#111418" : "white"} bg={colorMode === 'light' ? "white" : "transparent"} borderColor={borderColor} _hover={{ bg: colorMode === 'light' ? "gray.50" : "rgba(255, 255, 255, 0.05)", borderColor: colorMode === 'light' ? "gray.300" : borderColor }} w={{ base: "full", md: "auto" }} onClick={() => fileInputRef.current?.click()}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_camera</span>
                                    {t('profile.edit')} photo
                                </Button>
                            </Flex>
                        </Box>
                        <Flex direction={{ base: "column", lg: "row" }} gap={8}>
                            <Box w={{ base: "full", lg: "64" }} flexShrink={0} className="settings__menu">
                                <Box position={{ lg: "sticky" }} top={{ lg: "24" }} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" overflow="hidden">
                                    <VStack align="stretch" gap={0}>
                                        <Button variant="ghost" justifyContent="flex-start" h="14" px={6} rounded="none" gap={3} position="relative" bg={activeSection === 'settings__information' ? (colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.2)") : "transparent"} color={activeSection === 'settings__information' ? "primary" : subText} fontWeight={activeSection === 'settings__information' ? "bold" : "medium"} _before={activeSection === 'settings__information' ? { content: '""', position: 'absolute', left: '0', top: '20%', height: '60%', width: '4px', bg: 'primary', borderTopRightRadius: 'full', borderBottomRightRadius: 'full', } : {}} _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.800", color: activeSection === 'settings__information' ? "primary" : mainText }} onClick={() => scrollToSection('settings__information')}>
                                            <span className="material-symbols-outlined">person</span>
                                            {t('profile.personal_info')}
                                        </Button>
                                        <Button variant="ghost" justifyContent="flex-start" h="14" px={6} rounded="none" gap={3} position="relative" bg={activeSection === 'settings__preference' ? (colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.2)") : "transparent"} color={activeSection === 'settings__preference' ? "primary" : subText} fontWeight={activeSection === 'settings__preference' ? "bold" : "medium"} _before={activeSection === 'settings__preference' ? { content: '""', position: 'absolute', left: '0', top: '20%', height: '60%', width: '4px', bg: 'primary', borderTopRightRadius: 'full', borderBottomRightRadius: 'full', } : {}} _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.800", color: activeSection === 'settings__preference' ? "primary" : mainText }} onClick={() => scrollToSection('settings__preference')}>
                                            <span className="material-symbols-outlined">settings</span>
                                            {t('profile.preferences')}
                                        </Button>
                                        <Button variant="ghost" justifyContent="flex-start" h="14" px={6} rounded="none" gap={3} position="relative" bg={activeSection === 'settings__security' ? (colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.2)") : "transparent"} color={activeSection === 'settings__security' ? "primary" : subText} fontWeight={activeSection === 'settings__security' ? "bold" : "medium"} _before={activeSection === 'settings__security' ? { content: '""', position: 'absolute', left: '0', top: '20%', height: '60%', width: '4px', bg: 'primary', borderTopRightRadius: 'full', borderBottomRightRadius: 'full', } : {}} _hover={{ bg: colorMode === 'light' ? "gray.50" : "gray.800", color: activeSection === 'settings__security' ? "primary" : mainText }} onClick={() => scrollToSection('settings__security')}>
                                            <span className="material-symbols-outlined">lock</span>
                                            {t('profile.security')}
                                        </Button>
                                    </VStack>
                                </Box>
                            </Box>
                            <VStack flex={1} gap={6} align="stretch">
                                <Box id="settings__information" bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" p={{ base: 6, md: 8 }} scrollMarginTop="100px">
                                    <Flex align="center" justify="space-between" mb={6}>
                                        <Heading size="md" color={mainText}>{t('profile.personal_info')}</Heading>
                                        {!isEditing && (
                                            <Button variant="ghost" bg={colorMode === 'light' ? "transparent" : "#111418"} color="primary" size="sm" fontWeight="bold" _hover={{ bg: colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.15)", }} onClick={() => setIsEditing(true)}>
                                                {t('profile.edit')}
                                            </Button>
                                        )}
                                    </Flex>
                                    <VStack gap={6} align="stretch">
                                        <Flex direction={{ base: "column", md: "row" }} gap={6}>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.first_name')}</Text>
                                                <Input h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRing={isEditing ? "2px solid" : "none"} focusRingColor="primary" value={firstName} onChange={(e) => setFirstName(e.target.value)} readOnly={!isEditing} cursor={!isEditing ? "default" : "text"} transition="all 0.2s" placeholder={isEditing ? "Jean" : ""} />
                                            </Box>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.last_name')}</Text>
                                                <Input h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRing={isEditing ? "2px solid" : "none"} focusRingColor="primary" value={lastName} onChange={(e) => setLastName(e.target.value)} readOnly={!isEditing} cursor={!isEditing ? "default" : "text"} transition="all 0.2s" placeholder={isEditing ? "Dupont" : ""} />
                                            </Box>
                                        </Flex>
                                        <Box>
                                            <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.email')}</Text>
                                            <Box position="relative">
                                                <Box position="absolute" left="3" top="2.5" color="gray.400" zIndex="1" pointerEvents="none">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
                                                </Box>
                                                <Input h="11" rounded="lg" bg={colorMode === 'light' ? "gray.100" : "gray.900"} borderColor={borderColor} color="gray.500" pl="10" pr="4" focusRing="none" value={user?.email || ""} cursor="not-allowed" disabled />
                                            </Box>
                                        </Box>
                                        <Flex direction={{ base: "column", md: "row" }} gap={6}>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.phone')}</Text>
                                                <HStack gap={2}>
                                                    <Popover.Root open={isPhoneMenuOpen} onOpenChange={(e) => isEditing && setIsPhoneMenuOpen(e.open)} positioning={{ placement: "bottom-start" }}>
                                                        <Popover.Trigger asChild>
                                                            <Button disabled={!isEditing} variant="outline" h="11" w="auto" minW="100px" px={3} justifyContent="space-between" borderColor={borderColor} bg={contentBg} _hover={{ bg: isEditing ? (colorMode === 'light' ? "gray.50" : "whiteAlpha.100") : "transparent" }} cursor={isEditing ? "pointer" : "not-allowed"} opacity={isEditing ? 1 : 0.8}>
                                                                <HStack gap={2}>
                                                                    <Text fontSize="lg">{selectedCountry.flag}</Text>
                                                                    <Text fontSize="sm" color={mainText}>{selectedCountry.code}</Text>
                                                                </HStack>
                                                                {isEditing && (
                                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: subText }}>expand_more</span>
                                                                )}
                                                            </Button>
                                                        </Popover.Trigger>
                                                        <Portal>
                                                            <Popover.Positioner>
                                                                <Popover.Content bg={cardBg} borderColor={borderColor} boxShadow="xl" p={1} borderRadius="lg" zIndex="popover" w="240px">
                                                                    <VStack gap={0} align="stretch" maxH="240px" overflowY="auto">
                                                                        {countries.map((country) => (
                                                                            <Button key={country.code} variant="ghost" justifyContent="flex-start" h="10" px={3} gap={3} bg={phoneCode === country.code ? (colorMode === 'light' ? "blue.50" : "blue.900/20") : "transparent"} color={phoneCode === country.code ? "primary" : mainText} _hover={{ bg: colorMode === 'light' ? "gray.50" : "whiteAlpha.100" }} onClick={() => { setPhoneCode(country.code); setIsPhoneMenuOpen(false); }}>
                                                                                <Text fontSize="lg">{country.flag}</Text>
                                                                                <Text fontSize="sm" flex={1}>{country.label}</Text>
                                                                                <Text fontSize="sm" color="subText">{country.code}</Text>
                                                                            </Button>
                                                                        ))}
                                                                    </VStack>
                                                                </Popover.Content>
                                                            </Popover.Positioner>
                                                        </Portal>
                                                    </Popover.Root>
                                                    <Input h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRing={isEditing ? "2px solid" : "none"} focusRingColor="primary" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} readOnly={!isEditing} cursor={!isEditing ? "default" : "text"} transition="all 0.2s" placeholder="6 12 34 56 78" flex={1} />
                                                </HStack>
                                            </Box>
                                            <Box flex={1}>
                                                <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.position')}</Text>
                                                <Input h="11" rounded="lg" bg={colorMode === 'light' ? "gray.100" : "gray.900"} color="gray.500" px={4} cursor="not-allowed" disabled defaultValue="Gestionnaire de Stock" />
                                            </Box>
                                        </Flex>
                                    </VStack>
                                    <Box maxH={isEditing ? "100px" : "0"} opacity={isEditing ? 1 : 0} mt={isEditing ? 8 : 0} overflow="hidden" transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)">
                                        <Flex justify="flex-end" gap={3}>
                                            <Button variant="outline" h="10" px={6} rounded="lg" borderColor={borderColor} color={colorMode === 'light' ? "#111418" : "white"} bg={colorMode === 'light' ? "white" : "transparent"} fontWeight="bold" _hover={{ bg: colorMode === 'light' ? "gray.50" : "rgba(255, 255, 255, 0.05)", borderColor: colorMode === 'light' ? "gray.300" : borderColor }} onClick={() => setIsEditing(false)} >
                                                {t('profile.cancel')}
                                            </Button>
                                            <Button h="10" px={6} rounded="lg" bg="primary" color="white" fontWeight="bold" shadow="sm" _hover={{ bg: "blue.700" }} onClick={handleSaveProfile} loading={false}>
                                                {t('profile.save')}
                                            </Button>
                                        </Flex>
                                    </Box>
                                </Box>
                                <Box id="settings__preference" bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" p={{ base: 6, md: 8 }} scrollMarginTop="100px">
                                    <Heading size="md" color={mainText} mb={6}>{t('profile.preferences')}</Heading>
                                    <VStack gap={6} align="stretch" mt={2}>
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text color={mainText} fontWeight="medium" fontSize="sm">{t('profile.language')}</Text>
                                                <Text color={subText} fontSize="xs">{t('profile.language_desc')}</Text>
                                            </Box>
                                            <Popover.Root open={isLangMenuOpen} onOpenChange={(e) => setIsLangMenuOpen(e.open)} positioning={{ placement: "bottom-end" }}>
                                                <Popover.Trigger asChild>
                                                    <Button variant="outline" h="10" px={4} minW="160px" justifyContent="space-between" borderColor={borderColor} bg={colorMode === 'light' ? "white" : "transparent"} _hover={{ bg: colorMode === 'light' ? "gray.50" : "whiteAlpha.50" }} gap={3}>
                                                        <HStack gap={2}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colorMode === 'light' ? "#3182ce" : "#63b3ed" }}>
                                                                {currentLang.icon}
                                                            </span>
                                                            <Text fontSize="sm" color={mainText}>{currentLang.label}</Text>
                                                        </HStack>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', transform: isLangMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: subText }}>
                                                            expand_more
                                                        </span>
                                                    </Button>
                                                </Popover.Trigger>
                                                <Portal>
                                                    <Popover.Positioner>
                                                        <Popover.Content bg={cardBg} borderColor={borderColor} boxShadow="xl" p={1} borderRadius="lg" zIndex="popover" minW="180px">
                                                            <VStack gap={1} align="stretch">
                                                                {languages.map((lang) => (
                                                                    <Button key={lang.code} variant="ghost" justifyContent="flex-start" h="10" px={3} gap={3} bg={currentLang.code === lang.code ? (colorMode === 'light' ? "blue.50" : "blue.900/20") : "transparent"} color={currentLang.code === lang.code ? "primary" : mainText} fontWeight={currentLang.code === lang.code ? "bold" : "medium"} _hover={{ bg: colorMode === 'light' ? "gray.50" : "whiteAlpha.100" }} onClick={() => { i18n.changeLanguage(lang.code); setIsLangMenuOpen(false); }}>
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                                            {lang.icon}
                                                                        </span>
                                                                        <Text fontSize="sm" flex={1}>{lang.label}</Text>
                                                                        {currentLang.code === lang.code && (
                                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                                                check
                                                                            </span>
                                                                        )}
                                                                    </Button>
                                                                ))}
                                                            </VStack>
                                                        </Popover.Content>
                                                    </Popover.Positioner>
                                                </Portal>
                                            </Popover.Root>
                                        </Flex>
                                        <Separator color={borderColor} opacity={0.6} />
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text color={mainText} fontWeight="medium" fontSize="sm">{t('profile.dark_mode')}</Text>
                                                <Text color={subText} fontSize="xs">{t('profile.dark_mode_desc')}</Text>
                                            </Box>
                                            <Box w="10" h="5" bg={colorMode === 'dark' ? "primary" : "gray.300"} rounded="full" position="relative" cursor="pointer" transition="all 0.3s ease" onClick={toggleColorMode} _hover={{ opacity: 0.8 }}>
                                                <Box position="absolute" top="0.5" left={colorMode === 'dark' ? "5" : "0.5"} boxSize="4" bg="white" rounded="full" shadow="sm" transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" />
                                            </Box>
                                        </Flex>
                                    </VStack>
                                </Box>
                                <Box id="settings__security" bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" p={{ base: 6, md: 8 }} scrollMarginTop="100px">
                                    <Heading size="md" color={mainText} mb={6}>{t('profile.security')}</Heading>
                                    <VStack gap={8} align="stretch">
                                        <Box bg={colorMode === 'light' ? "rgba(19, 111, 236, 0.05)" : "rgba(19, 111, 236, 0.15)"} border="1px solid" borderColor="primary/20" rounded="lg" p={4}>
                                            <Flex align="flex-start" gap={3}>
                                                <Box color="primary" mt={0.5}>
                                                    <span className="material-symbols-outlined">verified_user</span>
                                                </Box>
                                                <Box>
                                                    <Text color={mainText} fontWeight="bold" fontSize="sm">{t('profile.2fa')}</Text>
                                                    <Text color={subText} fontSize="xs" mt={1}>{t('profile.2fa_desc')}</Text>
                                                </Box>
                                                <Button variant="ghost" bg={colorMode === 'light' ? "transparent" : "#111418"} ml="auto" color="primary" size="sm" fontWeight="bold" _hover={{ bg: colorMode === 'light' ? "rgba(19, 111, 236, 0.08)" : "rgba(19, 111, 236, 0.15)", }}>
                                                    {t('profile.manage')}
                                                </Button>
                                            </Flex>
                                        </Box>
                                        <Box borderTop="1px solid" borderColor={borderColor} pt={6}>
                                            <Text color={mainText} fontWeight="bold" fontSize="sm" mb={4}>{t('profile.change_password')}</Text>
                                            <VStack gap={4} maxW="md" align="stretch">
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.current_password')}</Text>
                                                    <Input type="password" h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} focusRingColor="primary" placeholder="Optionnel" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                                </Box>
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.new_password')}</Text>
                                                    <Box position="relative">
                                                        <Input type={showNewPassword ? "text" : "password"} h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} pr="10" focusRingColor="primary" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                                        <IconButton aria-label="Toggle password visibility" variant="ghost" position="absolute" right="0" top="0" bottom="0" h="full" px="3" color={subText} bg="transparent" _hover={{ bg: "transparent", color: "primary" }} _active={{ bg: "transparent" }} onClick={() => setShowNewPassword(!showNewPassword)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                                {showNewPassword ? 'visibility_off' : 'visibility'}
                                                            </span>
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                {newPassword.length > 0 && (
                                                    <Box className="criteriaSuccess" bg={colorMode === 'light' ? "gray.50" : "whiteAlpha.100"} rounded="lg" p="4" border="1px" borderColor={borderColor}>
                                                        <Text fontSize="xs" fontWeight="semibold" color={subText} textTransform="uppercase" letterSpacing="wider" mb="3">
                                                            Critères de sécurité
                                                        </Text>
                                                        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="3">
                                                            <GridItem><RequirementItem met={hasMinLength} label="Au moins 8 caractères" /></GridItem>
                                                            <GridItem><RequirementItem met={hasUpperCase} label="Une majuscule" /></GridItem>
                                                            <GridItem><RequirementItem met={hasNumber} label="Un chiffre" /></GridItem>
                                                            <GridItem><RequirementItem met={hasSpecialChar} label="Caractère spécial" /></GridItem>
                                                        </Grid>
                                                    </Box>
                                                )}

                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" mb={2} color={mainText}>{t('profile.confirm_password')}</Text>
                                                    <Box position="relative">
                                                        <Input type={showConfirmPassword ? "text" : "password"} h="11" rounded="lg" bg={contentBg} borderColor={borderColor} color={mainText} px={4} pr="10" focusRingColor="primary" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                                        <IconButton aria-label="Toggle password visibility" variant="ghost" position="absolute" right="0" top="0" bottom="0" h="full" px="3" color={subText} bg="transparent" _hover={{ bg: "transparent", color: "primary" }} _active={{ bg: "transparent" }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                                            </span>
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                                {passwordError && (
                                                    <Text color="red.500" fontSize="sm" fontWeight="medium">{passwordError}</Text>
                                                )}
                                                <Button h="11" bg={colorMode === 'light' ? "primary" : "gray.700"} color="white" fontWeight="bold" rounded="lg" _hover={{ bg: "black" }} mt={2} onClick={handleUpdatePassword} loading={isUpdatingPassword} disabled={isUpdatingPassword}>
                                                    {t('profile.update_password')}
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
