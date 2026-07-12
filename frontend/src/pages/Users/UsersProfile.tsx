import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Heading, VStack, HStack, Button, Avatar, Badge, Container, IconButton } from '@chakra-ui/react';
import { useColorMode } from '../../components/ui/color-mode';
import Sidebar from '../../components/navigation/sidebar';
import { useTranslation } from 'react-i18next';
import { useAppToast } from '../../hooks/useAppToast';
import ProfileInfoSection from './ProfileInfoSection';
import ProfileSettings from './ProfileSettings';

const UsersProfile = () => {
    const { i18n } = useTranslation();
    const { colorMode } = useColorMode();
    const [user, setUser] = useState<{ username: string; email: string; role: string; profilePicture?: string; phoneNumber?: string; firstName?: string; lastName?: string } | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneCode, setPhoneCode] = useState('+33');
    const [phoneNumber, setPhoneNumber] = useState('');
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

    const { showToast } = useAppToast();
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
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
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
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
            const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';

            try {
                const response = await fetch(`${baseUrl}/api/v1/auth/update-profile`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        profilePicture: base64String
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.access_token) {
                        const storage = window.localStorage.getItem('access_token') ? window.localStorage : window.sessionStorage;
                        storage.setItem('access_token', data.access_token);
                    }
                    showToast({ title: t('profile.save_success') });
                    fetchProfile();
                }
            } catch (error) {
                console.error("Upload failed", error);
            }
        };
        reader.readAsDataURL(file);
    };

    const { t } = useTranslation();

    const handleSaveProfile = async () => {
        const token = window.localStorage.getItem('access_token') || window.sessionStorage.getItem('access_token');
        if (!token) return;
        const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';

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
                showToast({ title: t('profile.save_success') });
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
        const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';

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
                showToast({ title: t('profile.save_success') });
            } else {
                setPasswordError("Erreur lors de la mise à jour du mot de passe.");
            }
        } catch (e) {
            setPasswordError("Erreur réseau.");
        } finally {
            setIsUpdatingPassword(false);
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
                                <ProfileInfoSection
                                    firstName={firstName}
                                    setFirstName={setFirstName}
                                    lastName={lastName}
                                    setLastName={setLastName}
                                    phoneCode={phoneCode}
                                    setPhoneCode={setPhoneCode}
                                    phoneNumber={phoneNumber}
                                    setPhoneNumber={setPhoneNumber}
                                    user={user}
                                    isEditing={isEditing}
                                    setIsEditing={setIsEditing}
                                    handleSaveProfile={handleSaveProfile}
                                    countries={countries}
                                />
                                <ProfileSettings
                                    currentPassword={currentPassword}
                                    setCurrentPassword={setCurrentPassword}
                                    newPassword={newPassword}
                                    setNewPassword={setNewPassword}
                                    confirmPassword={confirmPassword}
                                    setConfirmPassword={setConfirmPassword}
                                    showNewPassword={showNewPassword}
                                    setShowNewPassword={setShowNewPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    passwordError={passwordError}
                                    hasMinLength={hasMinLength}
                                    hasUpperCase={hasUpperCase}
                                    hasNumber={hasNumber}
                                    hasSpecialChar={hasSpecialChar}
                                    handleUpdatePassword={handleUpdatePassword}
                                    isUpdatingPassword={isUpdatingPassword}
                                />
                            </VStack>
                        </Flex>
                    </VStack>
                </Container>
            </Box>
        </Sidebar>
    );
};

export default UsersProfile;
