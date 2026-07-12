import { Box, Button, Flex, Grid, GridItem, Heading, HStack, IconButton, Input, Popover, Portal, Separator, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../components/ui/color-mode';

interface Props {
    currentPassword: string;
    setCurrentPassword: (v: string) => void;
    newPassword: string;
    setNewPassword: (v: string) => void;
    confirmPassword: string;
    setConfirmPassword: (v: string) => void;
    showNewPassword: boolean;
    setShowNewPassword: (v: boolean) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (v: boolean) => void;
    passwordError: string | null;
    hasMinLength: boolean;
    hasUpperCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    handleUpdatePassword: () => void;
    isUpdatingPassword: boolean;
}

const ProfileSettings = ({
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showNewPassword, setShowNewPassword,
    showConfirmPassword, setShowConfirmPassword,
    passwordError,
    hasMinLength, hasUpperCase, hasNumber, hasSpecialChar,
    handleUpdatePassword, isUpdatingPassword,
}: Props) => {
    const { t, i18n } = useTranslation();
    const { colorMode } = useColorMode();
    const mainText = "textMain";
    const subText = "textSub";
    const borderColor = "border";
    const cardBg = "card";
    const contentBg = "background";

    const languages = [
        { label: 'Français', code: 'fr', icon: 'translate' },
        { label: 'English', code: 'en', icon: 'language' },
        { label: 'Malagasy', code: 'mg', icon: 'flag' }
    ];

    const currentLang = languages.find(l => l.code === i18n.language.split('-')[0]) || languages[1];
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    const RequirementItem = ({ met, label }: { met: boolean, label: string }) => (
        <Flex align="center" gap="2" color={met ? "green.500" : "gray.400"}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {met ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <Text fontSize="sm" fontWeight="medium">{label}</Text>
        </Flex>
    );

    return (
        <>
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
                                    <Popover.Content bg={cardBg} borderColor={borderColor} boxShadow="xl" p={1} borderRadius="lg" zIndex="popover" width="var(--trigger-width)">
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
        </>
    );
};

export default ProfileSettings;
