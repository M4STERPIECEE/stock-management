import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Flex, Text, Button, Link, Span, Container } from '@chakra-ui/react';
import { useColorMode } from '../../components/ui/color-mode';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../../components/navigation/headerbar';

const LinkVerification = () => {
    const { t } = useTranslation();
    const { colorMode } = useColorMode();
    const navigate = useNavigate();

    const mainText = "textMain";
    const subText = "textSub";
    const cardBg = "card";
    const borderColor = "border";

    return (
        <Span display="contents" className={`chakra-theme ${colorMode}`}>
            <Flex direction="column" minH="100vh" bg="background" color={mainText}>
                <HeaderBar />
                <Flex flex="1" align="center" justify="center" p={{ base: 4, sm: 6, lg: 8 }}>
                    <Box w="full" maxW="480px" bg={cardBg} borderRadius="xl" boxShadow="sm" border="1px" borderColor={borderColor} p={{ base: 8, md: 10 }} display="flex" flexDirection="column" alignItems="center">
                        <Box mb="8" position="relative" display="flex" alignItems="center" justifyContent="center">
                            <Box position="absolute" inset="0" bg="rgba(19, 127, 236, 0.2)" borderRadius="full" animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" filter="blur(12px)" />
                            <Box position="relative" bg="rgba(19, 127, 236, 0.1)" borderRadius="full" p="6" display="flex" alignItems="center" justifyContent="center">
                                <span className="material-symbols-outlined" style={{ color: '#137fec', fontSize: '48px' }}>mark_email_read</span>
                            </Box>
                        </Box>
                        <Flex direction="column" align="center" gap="3" textAlign="center" mb="8">
                            <Text fontSize="2xl" fontWeight="bold" lineHeight="tight" letterSpacing="-0.015em" color={mainText}>
                                Vérifiez votre boîte mail
                            </Text>
                            <Text fontSize="sm" lineHeight="relaxed" color={subText}>
                                Nous avons envoyé un lien de vérification à <br />
                                <Text as="span" fontWeight="semibold" color={mainText}>michaelramana2021@gmail.com</Text>
                            </Text>
                            <Box mt="2" px="4" py="2" bg={colorMode === 'light' ? "gray.50" : "whiteAlpha.100"} borderRadius="lg" border="1px" borderColor={borderColor}>
                                <Text fontSize="xs" color="gray.500">
                                    Si vous ne voyez pas l'email dans quelques minutes, vérifiez votre dossier de spam ou courriers indésirables.
                                </Text>
                            </Box>
                        </Flex>
                        <Flex w="full" direction="column" gap="4">
                            <Button w="full" h="11" bg="primary" color="white" fontSize="sm" fontWeight="bold" _hover={{ bg: "blue.600" }} _active={{ transform: "scale(0.98)" }} borderRadius="lg">
                                Renvoyer l'email
                            </Button>
                            <Link as="button" onClick={() => navigate('/login')} display="flex" alignItems="center" justifyContent="center" gap="2" color={subText} _hover={{ color: "primary", textDecoration: "none" }} fontSize="sm" fontWeight="medium" py="1" className="group">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', transition: 'transform 0.2s' }}>arrow_back</span>
                                Retour à la connexion
                            </Link>
                        </Flex>
                        <Box mt="8" textAlign="center" px="4">
                            <Text fontSize="xs" color="gray.500">
                                Besoin d'aide ? Contactez notre <Link href="#" textDecoration="underline" _hover={{ color: "primary" }}>support technique</Link>.
                            </Text>
                        </Box>
                    </Box>
                </Flex>
                <Box as="footer" w="full" py="6" textAlign="center" zIndex="10">
                    <Text fontSize="sm" color={subText}>
                        {t('login.copyright', { year: new Date().getFullYear() })}
                    </Text>
                </Box>
            </Flex>
        </Span>
    );
};

export default LinkVerification;
