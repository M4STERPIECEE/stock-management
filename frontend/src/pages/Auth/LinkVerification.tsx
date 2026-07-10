import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Flex, Text, Button, Link } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const INK = '#151A21';
const INK_SOFT = '#1E252F';
const PAPER = '#EFF1EC';
const AMBER = '#E8A33D';
const SAGE = '#4F7C6B';
const SAGE_DARK = '#3C6053';

const TEXT_MAIN = INK;
const TEXT_SUB = '#5B6675';

const LinkVerification = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <>
            <style>{`
                @keyframes stockmgr-color-shift {
                    0% { transform: scale(1); opacity: 0.35; }
                    50% { transform: scale(1.2); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 0.35; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .stockmgr-color-layer {
                        animation: none !important;
                    }
                }
            `}</style>

            <Flex minH="100vh" bg={PAPER}>
                <Flex display={{ base: 'none', lg: 'flex' }} direction="column" justify="center" w="42%" minW="420px" bg={INK} color="whiteAlpha.900" p="10" pos="relative" overflow="hidden">
                    <Box pos="absolute" inset="0" bg={INK} />
                    <Box className="stockmgr-color-layer" pos="absolute" inset="0" opacity="0.35" backgroundImage={`linear-gradient(135deg, ${AMBER}, ${SAGE_DARK}, ${SAGE}, ${INK}, ${AMBER})`} backgroundSize="200% 200%" style={{ animation: 'stockmgr-color-shift 8s ease-in-out infinite' }} />
                    <Box pos="absolute" inset="0" bgGradient={`linear(to-b, ${INK} 0%, transparent 25%, transparent 75%, ${INK} 100%)`} />

                    <Flex align="center" gap="3" zIndex="1" position="absolute" top="10">
                        <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={AMBER} color={INK}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                        </Flex>
                        <Text fontSize="md" fontWeight="bold" letterSpacing="tight">StockManager</Text>
                    </Flex>

                    <Box zIndex="1" maxW="360px" textAlign="center" margin="0 auto">
                        <Text fontSize="4xl" fontWeight="800" lineHeight="1.1" letterSpacing="-0.02em" mb="4">
                            {t('auth.link_verification.title')}
                        </Text>
                        <Text color="whiteAlpha.600" fontSize="sm" lineHeight="1.6">
                            {t('auth.link_verification.subtitle')}
                        </Text>
                    </Box>
                </Flex>

                <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 10 }}>
                    <Box w="full" maxW="380px" bg="white" borderRadius="xl" p={{ base: 6, md: 8 }} boxShadow="lg" textAlign="center">
                        <Flex display={{ base: 'flex', lg: 'none' }} align="center" gap="3" mb="6" justify="center">
                            <Flex align="center" justify="center" w="9" h="9" borderRadius="md" bg={INK} color={AMBER}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                            </Flex>
                            <Text fontSize="md" fontWeight="bold" letterSpacing="tight" color={TEXT_MAIN}>StockManager</Text>
                        </Flex>

                        <Flex align="center" justify="center" mb="6">
                            <Flex align="center" justify="center" w="16" h="16" borderRadius="full" bg={SAGE} color="white">
                                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>mark_email_read</span>
                            </Flex>
                        </Flex>

                        <Text fontSize="2xl" fontWeight="800" letterSpacing="-0.02em" color={TEXT_MAIN} mb="3">
                            {t('auth.link_verification.card_title')}
                        </Text>
                        <Text color={TEXT_SUB} fontSize="sm" mb="6" lineHeight="1.6">
                            {t('auth.link_verification.card_subtitle')}
                        </Text>

                        <Box p="4" bg={PAPER} borderRadius="md" mb="6">
                            <Text fontSize="xs" color={TEXT_SUB}>
                                {t('auth.link_verification.spam_hint')}
                            </Text>
                        </Box>

                        <Flex direction="column" gap="3">
                            <Button w="full" h="12" bg={SAGE} color="white" fontSize="sm" fontWeight="bold" letterSpacing="0.02em" borderRadius="md" _hover={{ bg: SAGE_DARK }} _active={{ transform: 'scale(0.98)' }}>
                                {t('auth.link_verification.resend')}
                            </Button>

                            <Link fontSize="sm" fontWeight="semibold" color={SAGE_DARK} _hover={{ color: AMBER }} onClick={() => navigate('/login')} display="flex" alignItems="center" justifyContent="center" gap="1">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                                {t('auth.link_verification.back_to_login')}
                            </Link>
                        </Flex>

                        <Text fontSize="xs" color={TEXT_SUB} mt="8">
                            {t('login.copyright', { year: new Date().getFullYear() })}
                        </Text>
                    </Box>
                </Flex>
            </Flex>
        </>
    );
};

export default LinkVerification;