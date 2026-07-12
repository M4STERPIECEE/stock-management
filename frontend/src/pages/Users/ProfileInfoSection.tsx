import { Box, Button, Flex, Heading, HStack, Input, Popover, Portal, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../components/ui/color-mode';

interface Country {
    code: string;
    label: string;
    flag: string;
}

interface Props {
    firstName: string;
    setFirstName: (v: string) => void;
    lastName: string;
    setLastName: (v: string) => void;
    phoneCode: string;
    setPhoneCode: (v: string) => void;
    phoneNumber: string;
    setPhoneNumber: (v: string) => void;
    user: { username: string; email: string; role: string; profilePicture?: string; phoneNumber?: string; firstName?: string; lastName?: string } | null;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    handleSaveProfile: () => void;
    countries: Country[];
}

const ProfileInfoSection = ({ firstName, setFirstName, lastName, setLastName, phoneCode, setPhoneCode, phoneNumber, setPhoneNumber, user, isEditing, setIsEditing, handleSaveProfile, countries }: Props) => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const [isPhoneMenuOpen, setIsPhoneMenuOpen] = useState(false);
    const mainText = "textMain";
    const subText = "textSub";
    const borderColor = "border";
    const cardBg = "card";
    const contentBg = "background";
    const selectedCountry = countries.find(c => c.code === phoneCode) || countries[0];

    return (
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
    );
};

export default ProfileInfoSection;
